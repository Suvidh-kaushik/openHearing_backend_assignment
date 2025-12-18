import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../src/config/redisDB.js", () => {
  const get = vi.fn();
  const set = vi.fn();
  const del = vi.fn();
  return {
    redisClient: {
      get,
      set,
      del,
    },
  };
});

vi.mock("../../src/config/rabbitMQ.js", () => ({
  publishToQueue: vi.fn(),
}));

vi.mock("../../src/models/userModel.js", () => {
  return {
    user: {
      findOneAndUpdate: vi.fn(),
    },
  };
});

vi.mock("../../src/utils/generateToken.js", () => ({
  generateToken: vi.fn(() => "fake-jwt-token"),
}));

import apiRouter from "../../src/routes/index.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { redisClient } from "../../src/config/redisDB.js";
import { publishToQueue } from "../../src/config/rabbitMQ.js";
import { user } from "../../src/models/userModel.js";
import { generateToken } from "../../src/utils/generateToken.js";

const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "10kb" }));
  app.use("/api/v1", apiRouter);
  app.use(errorHandler);
  return app;
};

describe("Auth API integration", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    vi.resetAllMocks();
  });

  describe("POST /api/v1/auth/login", () => {
    it("should return 429 when rate limited", async () => {
      (redisClient.get as any).mockResolvedValue("true");

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        message: "Too may requests. Please wait before requesting new opt",
      });

      expect(redisClient.set).not.toHaveBeenCalled();
      expect(publishToQueue).not.toHaveBeenCalled();
    });

    it("should send OTP and enqueue email when not rate limited", async () => {
      (redisClient.get as any).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "OTP sent to your mail",
      });

      expect(redisClient.set).toHaveBeenCalledTimes(2);
      expect(publishToQueue).toHaveBeenCalledWith(
        "send-mail",
        expect.objectContaining({
          to: "test@example.com",
          subject: "OTP for Login",
        })
      );
    });
  });

  describe("POST /api/v1/auth/verify", () => {
    it("should return 400 when email or otp missing", async () => {
      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Email and OTP Required",
      });
    });

    it("should return 400 when otp is invalid or expired", async () => {
      (redisClient.get as any).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ email: "test@example.com", otp: "123456" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Invalid or expired OTP",
      });
    });

    it("should verify user, clear otp, and return token when otp is valid", async () => {
      (redisClient.get as any).mockResolvedValue("123456");

      const userDoc = {
        _id: "user-id-1",
        email: "test@example.com",
        isDeleted: false,
        deletedAt: null,
      };

      (user.findOneAndUpdate as any).mockResolvedValue(userDoc);

      const res = await request(app)
        .post("/api/v1/auth/verify")
        .send({ email: "test@example.com", otp: "123456" });

      expect(res.status).toBe(200);
      expect(redisClient.del).toHaveBeenCalledWith("otp:test@example.com");

      expect(generateToken).toHaveBeenCalledWith("user-id-1", expect.anything());

      expect(res.body).toMatchObject({
        message: "User Verified",
        user: userDoc,
        token: "fake-jwt-token",
      });
    });
  });
});

