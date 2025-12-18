import { describe, it, expect, vi, beforeEach } from "vitest";

const createUserServicePath = "../../../src/services/user.js";

const mockUserModel = {
  findOne: vi.fn(),
  create: vi.fn(),
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
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
    mockUserModel.findById = vi.fn();
    mockUserModel.findByIdAndUpdate = vi.fn();
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
        "-aadhaar -pan -deletedAt -permanentAddress"
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

  describe("updateUserService", () => {
    it("should throw NotFound error if user does not exist", async () => {
      const { updateUserService } = await import(createUserServicePath);

      mockUserModel.findById.mockResolvedValue(null);

      await expect(
        updateUserService("non-existent-id", { name: "New Name" } as any)
      ).rejects.toMatchObject({
        message: "User not found",
      });

      expect(mockUserModel.findById).toHaveBeenCalledWith("non-existent-id");
    });

    it("should update user and encrypt aadhaar and pan when provided", async () => {
      const { updateUserService } = await import(createUserServicePath);
      const { encrypt } = await import("../../../src/utils/encrypt.js");

      const existingUser = { _id: "user-id" };
      mockUserModel.findById.mockResolvedValue(existingUser);

      const updatedUser = {
        _id: "user-id",
        name: "Updated Name",
        email: "updated@example.com",
        primaryMobile: "1234567890",
        secondaryMobile: "0987654321",
        dateOfBirth: new Date("1990-01-01"),
        placeOfBirth: "City",
        currentAddress: "Updated address 123",
        permanentAddress: "Updated permanent address 456",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockUserModel.findByIdAndUpdate as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(updatedUser),
      });

      const input = {
        name: "Updated Name",
        email: "updated@example.com",
        aadhaar: "123456789012",
        pan: "ABCDE1234F",
      };

      const result = await updateUserService("user-id", input as any);

      expect(encrypt).toHaveBeenCalledWith(input.aadhaar);
      expect(encrypt).toHaveBeenCalledWith(input.pan);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        expect.objectContaining({
          name: input.name,
          email: input.email,
          aadhaar: `enc-${input.aadhaar}`,
          pan: `enc-${input.pan}`,
        }),
        { new: true }
      );

      expect(result).toEqual({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        primaryMobile: updatedUser.primaryMobile,
        secondaryMobile: updatedUser.secondaryMobile,
        dateOfBirth: updatedUser.dateOfBirth,
        placeOfBirth: updatedUser.placeOfBirth,
        currentAddress: updatedUser.currentAddress,
        permanentAddress: updatedUser.permanentAddress,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
    });
  });

  describe("deleteUserService", () => {
    it("should throw NotFound error if user does not exist", async () => {
      const { deleteUserService } = await import(createUserServicePath);

      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        deleteUserService("non-existent-id" as any)
      ).rejects.toMatchObject({
        message: "User not found",
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "non-existent-id",
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Date),
        })
      );
    });

    it("should soft delete user and return minimal info", async () => {
      const { deleteUserService } = await import(createUserServicePath);

      const now = new Date();
      const deletedUser = {
        _id: "user-id",
        name: "John Doe",
        email: "john@example.com",
        deletedAt: now,
      };

      mockUserModel.findByIdAndUpdate.mockResolvedValue(deletedUser);

      const result = await deleteUserService("user-id" as any);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user-id",
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Date),
        })
      );

      expect(result).toEqual({
        _id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email,
        deletedAt: deletedUser.deletedAt,
      });
    });
  });
});


