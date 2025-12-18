import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

import {
  validateCreateUser,
  validateGetUsers,
} from "../../../src/middlewares/validators/user.js";
import {
  createUserSchema,
  getUsersSchema,
} from "../../../src/middlewares/schemas/user.schema.js";

const createMockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("user validators middleware", () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  describe("validateCreateUser", () => {
    const middleware = validateCreateUser(createUserSchema);

    it("should call next for valid create user body", () => {
      const req = {
        body: {
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
        },
      } as Request;

      const res = createMockRes();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((res.status as any)).not.toHaveBeenCalled();
      expect((res.json as any)).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid create user body", () => {
      const req = {
        body: {
          name: "J", // too short
          email: "not-an-email",
          primaryMobile: "12345", // invalid format
          aadhaar: "123", // invalid format
          pan: "BADPAN", // invalid format
          dateOfBirth: "bad-date",
          placeOfBirth: "C",
          currentAddress: "1234",
          permanentAddress: "1234",
        },
      } as unknown as Request;

      const res = createMockRes();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Input Validation Error",
      });
    });
  });

  describe("validateGetUsers", () => {
    const middleware = validateGetUsers(getUsersSchema);

    it("should call next for valid query params", () => {
      const req = {
        query: {
          limit: "10",
          cursor: "some-cursor",
          name: "John",
          email: "john@example.com",
          mobile: "1234",
          dob: "1990-01-01",
        },
      } as unknown as Request;

      const res = createMockRes();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid query params", () => {
      const req = {
        query: {
          limit: "-5", // invalid: negative
        },
      } as unknown as Request;

      const res = createMockRes();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Input Validation Error",
      });
    });

    it("should return 400 when limit is not a number", () => {
      const req = {
        query: {
          limit: "not-a-number",
        },
      } as unknown as Request;
      
      const res = createMockRes();
      middleware(req, res, next);
      
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 400,
        message: "Input Validation Error",
      });
    });
  });

});


