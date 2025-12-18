import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../src/middlewares/authenticate.js", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    // Simulate an authenticated user with a valid ObjectId-like id
    req.user = { _id: "64b8f1e5c9a1d2e3f4a5b6c", email: "auth@example.com" };
    next();
  },
}));

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
    updateUserService: vi.fn(async (id: string, data: any) => ({
      _id: id,
      ...data,
    })),
    deleteUserService: vi.fn(async (id: string) => ({
      _id: id,
      name: "Deleted User",
      email: "auth@example.com",
      deletedAt: new Date().toISOString(),
    })),
  };
});

import apiRouter from "../../src/routes/index.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";

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
          // email comes from authenticated user, not request body
          email: "auth@example.com",
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
        errors: expect.any(String),
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
        errors: expect.any(String),
      });
    });
  });

  describe("PATCH /api/v1/users/:id", () => {
    it("should return 400 for invalid update payload or params", async () => {
      const payload = {
        name: "Updated Name",
        primaryMobile: "+12345678901",
      };

      const res = await request(app)
        .patch("/api/v1/users/64b8f1e5c9a1d2e3f4a5b6c")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 400,
        message: "Input Validation Error",
        errors: expect.any(String),
      });
    });

    it("should return 403 if user tries to update another user with valid id format", async () => {
      const res = await request(app)
        .patch("/api/v1/users/aaaaaaaaaaaaaaaaaaaaaaaa")
        .send({ name: "Updated Name" });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        status: 403,
        message: "You are not authorized to update this user",
      });
    });
  });

  describe("DELETE /api/v1/users/:id", () => {
    it("should return 400 for invalid delete params", async () => {
      const res = await request(app).delete(
        "/api/v1/users/64b8f1e5c9a1d2e3f4a5b6c"
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        status: 400,
        message: "Input Validation Error",
        errors: expect.any(String),
      });
    });

    it("should return 403 if user tries to delete another user with valid id format", async () => {
      const res = await request(app).delete(
        "/api/v1/users/aaaaaaaaaaaaaaaaaaaaaaaa"
      );

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        status: 403,
        message: "You are not authorized to delete this user",
      });
    });
  });
});


