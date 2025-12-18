import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/env.js", () => ({
  ENV: {
    SECRET_KEY: "test-secret-key",
  },
}));

describe("encrypt/decrypt utility", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should encrypt and decrypt text correctly", async () => {
    const { encrypt, decrypt } = await import("../../../src/utils/encrypt.js");

    const plainText = "my-sensitive-data";
    const cipherText = encrypt(plainText);

    expect(cipherText).toBeTypeOf("string");
    expect(cipherText).not.toBe(plainText);

    const decrypted = decrypt(cipherText);
    expect(decrypted).toBe(plainText);
  });

  it("should return empty string when decrypting invalid cipher text", async () => {
    const { decrypt } = await import("../../../src/utils/encrypt.js");

    const decrypted = decrypt("invalid-cipher-text");
    // CryptoJS returns empty string when decryption fails
    expect(decrypted).toBe("");
  });
});


