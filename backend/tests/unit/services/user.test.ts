import { describe, it, expect, vi, beforeEach } from "vitest";

const createUserServicePath = "../../../src/services/user.js";

const mockUserModel = {
  findOne: vi.fn(),
  create: vi.fn(),
  find: vi.fn(),
};

const mockQueryChain = {
  sort: vi.fn(),
  limit: vi.fn(),
  select: vi.fn(),
};

vi.mock("../../../src/models/userModel.js", () => ({
  user: mockUserModel,
}));

vi.mock("mongoose", () => {
  class MockObjectId {
    value: string;
    constructor(id: string) {
      this.value = id;
    }
  }

  return {
    default: {
      Types: {
        ObjectId: MockObjectId,
      },
    },
    Types: {
      ObjectId: MockObjectId,
    },
  };
});

vi.mock("../../../src/utils/encrypt.js", () => ({
  encrypt: vi.fn((value: string) => `enc-${value}`),
}));

vi.mock("http-errors", async (importOriginal) => {
  const actual = await importOriginal<typeof import("http-errors")>();
  return {
    ...actual,
    default: {
      ...(actual as any).default,
      Forbidden: (message: string) => {
        const error = new Error(message) as Error & { status?: number };
        error.status = 403;
        return error;
      },
    },
  };
});

describe("user service", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockUserModel.find = vi.fn(() => mockQueryChain);
    mockQueryChain.sort = vi.fn(() => mockQueryChain);
    mockQueryChain.limit = vi.fn(() => mockQueryChain);
    mockQueryChain.select = vi.fn();
  });

  describe("createUserService", () => {
    it("should throw Forbidden error if user already exists", async () => {
      const { createUserService } = await import(createUserServicePath);

      const existingUser = { _id: "1" };
      mockUserModel.findOne.mockResolvedValue(existingUser);

      const input = {
        name: "John Doe",
        email: "john@example.com",
        primaryMobile: "1234567890",
        aadhaar: "123412341234",
        pan: "ABCDE1234F",
        dateOfBirth: new Date("1990-01-01"),
        placeOfBirth: "City",
        currentAddress: "Current address 123",
        permanentAddress: "Permanent address 456",
      };

      await expect(createUserService(input as any)).rejects.toMatchObject({
        message: "User already exists",
        status: 403,
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: input.email },
          { primaryMobile: input.primaryMobile },
        ],
      });
    });

    it("should create a new user with encrypted aadhaar and pan", async () => {
      const { createUserService } = await import(createUserServicePath);
      const { encrypt } = await import("../../../src/utils/encrypt.js");

      mockUserModel.findOne.mockResolvedValue(null);

      const createdUser = {
        _id: "user-id",
        name: "John Doe",
        email: "john@example.com",
        primaryMobile: "1234567890",
        secondaryMobile: "0987654321",
        dateOfBirth: new Date("1990-01-01"),
        placeOfBirth: "City",
        currentAddress: "Current address 123",
        permanentAddress: "Permanent address 456",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserModel.create.mockResolvedValue(createdUser);

      const input = {
        name: "John Doe",
        email: "john@example.com",
        primaryMobile: "1234567890",
        secondaryMobile: "0987654321",
        aadhaar: "123412341234",
        pan: "ABCDE1234F",
        dateOfBirth: new Date("1990-01-01"),
        placeOfBirth: "City",
        currentAddress: "Current address 123",
        permanentAddress: "Permanent address 456",
      };

      const result = await createUserService(input as any);

      expect(encrypt).toHaveBeenCalledWith(input.aadhaar);
      expect(encrypt).toHaveBeenCalledWith(input.pan);

      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: input.name,
          email: input.email,
          primaryMobile: input.primaryMobile,
          secondaryMobile: input.secondaryMobile,
          aadhaar: `enc-${input.aadhaar}`,
          pan: `enc-${input.pan}`,
        })
      );

      expect(result).toEqual({
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        primaryMobile: createdUser.primaryMobile,
        secondaryMobile: createdUser.secondaryMobile,
        dateOfBirth: createdUser.dateOfBirth,
        placeOfBirth: createdUser.placeOfBirth,
        currentAddress: createdUser.currentAddress,
        permanentAddress: createdUser.permanentAddress,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
    });
  });

  describe("getUsersService", () => {
    it("should build query and return paginated users", async () => {
      const { getUsersService } = await import(createUserServicePath);

      const users = [
        { _id: "3", name: "User 3" },
        { _id: "2", name: "User 2" },
        { _id: "1", name: "User 1" },
      ];

      mockQueryChain.select.mockResolvedValue(users);

      const input = {
        limit: 2,
        name: "John",
        email: "john@example.com",
        mobile: "1234",
        dob: "1990-01-01",
        next: "some-cursor-id",
      };

      const result = await getUsersService(input as any);

      expect(mockUserModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          name: { $regex: input.name, $options: "i" },
          email: { $regex: input.email, $options: "i" },
          $or: [
            { primaryMobile: { $regex: input.mobile } },
            { secondaryMobile: { $regex: input.mobile } },
          ],
          dateOfBirth: expect.objectContaining({
            $gte: expect.any(Date),
            $lt: expect.any(Date),
          }),
          _id: expect.any(Object),
        })
      );

      expect(mockQueryChain.sort).toHaveBeenCalledWith({ _id: -1 });
      expect(mockQueryChain.limit).toHaveBeenCalledWith(input.limit + 1);
      expect(mockQueryChain.select).toHaveBeenCalledWith(
        "-aadhaar -pan -isDeleted -isActive -deletedAt -permanentAddress"
      );

      expect(result.pagination.limit).toBe(input.limit);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.nextCursor).toBe("2");
      expect(result.users).toEqual([
        { _id: "3", name: "User 3" },
        { _id: "2", name: "User 2" },
      ]);
    });

    it("should handle case with no next page", async () => {
      const { getUsersService } = await import(createUserServicePath);

      const users = [
        { _id: "2", name: "User 2" },
        { _id: "1", name: "User 1" },
      ];

      mockQueryChain.select.mockResolvedValue(users);

      const input = {
        limit: 2,
      };

      const result = await getUsersService(input as any);

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.nextCursor).toBe(users[users.length - 1]?._id);
      expect(result.users).toEqual(users);
    });
  });
});


