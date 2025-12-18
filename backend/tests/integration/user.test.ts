import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

import apiRouter from "../../src/routes/index.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";

vi.mock("../../src/services/user.js", () => {
  return {
    createUserService: vi.fn(async (data: any) => ({
      _id: "user-id-1",
      ...data,
    })),
    getUsersService: vi.fn(async () => ({
      users: [
        {
          _id: "user-id-1",
          name: "John Doe",
          email: "john@example.com",
        },
      ],
      pagination: {
        limit: 5,
        hasNextPage: false,
        nextCursor: null,
      },
    })),
  };
});

const createApp = () => {
  const app = express();
  app.use(express.json({ limit: "10kb" }));
  app.use("/api/v1", apiRouter);
  app.use(errorHandler);
  return app;
};

describe("Users API integration", () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
  });

  describe("POST /api/v1/users", () => {
    it("should create a user with valid payload", async () => {
      const payload = {
        name: "John Doe",
        email: "john@example.com",
        primaryMobile: "+12345678901",
        secondaryMobile: "+10987654321",
        aadhaar: "123456789012",
        pan: "ABCDE1234F",
        dateOfBirth: "1990-01-01",
        placeOfBirth: "City",
        currentAddress: "Some address",
        permanentAddress: "Some permanent address",
      };

      const res = await request(app).post("/api/v1/users").send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        status: 201,
        message: "User created successfully",
        data: {
          _id: "user-id-1",
          name: payload.name,
          email: payload.email,
        },
      });
    });

    it("should return 400 for invalid payload", async () => {
      const payload = {
        name: "J",
        email: "bad-email",
      };

      const res = await request(app).post("/api/v1/users").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 400,
        message: "Input Validation Error",
      });
    });
  });

  describe("GET /api/v1/users", () => {
    it("should return users list with valid query", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .query({ limit: 5, name: "John" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 200,
        message: "Users fetched successfully",
        data: {
          users: [
            expect.objectContaining({
              _id: "user-id-1",
              name: "John Doe",
              email: "john@example.com",
            }),
          ],
          pagination: {
            limit: 5,
            hasNextPage: false,
            nextCursor: null,
          },
        },
      });
    });

    it("should return 400 for invalid query params", async () => {
      const res = await request(app)
        .get("/api/v1/users")
        .query({ limit: -1 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 400,
        message: "Input Validation Error",
      });
    });
  });
});


