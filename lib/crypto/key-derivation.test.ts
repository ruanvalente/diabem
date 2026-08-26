import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./key-derivation";

describe("hashPassword", () => {
  it("returns hash and salt on success", async () => {
    const result = await hashPassword("MyPassword1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hash).toBeTruthy();
      expect(result.data.salt).toBeTruthy();
      expect(typeof result.data.hash).toBe("string");
      expect(typeof result.data.salt).toBe("string");
    }
  });

  it("produces different hashes for same password (different salts)", async () => {
    const r1 = await hashPassword("MyPassword1");
    const r2 = await hashPassword("MyPassword1");
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.data.salt).not.toBe(r2.data.salt);
      expect(r1.data.hash).not.toBe(r2.data.hash);
    }
  });

  it("produces consistent hash with same salt", async () => {
    const r1 = await hashPassword("MyPassword1");
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      const r2 = await verifyPassword(
        "MyPassword1",
        r1.data.hash,
        r1.data.salt
      );
      expect(r2.ok).toBe(true);
      if (r2.ok) {
        expect(r2.data).toBe(true);
      }
    }
  });
});

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const derivation = await hashPassword("CorrectPass1");
    expect(derivation.ok).toBe(true);
    if (derivation.ok) {
      const result = await verifyPassword(
        "CorrectPass1",
        derivation.data.hash,
        derivation.data.salt
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(true);
      }
    }
  });

  it("returns false for incorrect password", async () => {
    const derivation = await hashPassword("CorrectPass1");
    expect(derivation.ok).toBe(true);
    if (derivation.ok) {
      const result = await verifyPassword(
        "WrongPass1",
        derivation.data.hash,
        derivation.data.salt
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(false);
      }
    }
  });

  it("returns false for empty password against hashed password", async () => {
    const derivation = await hashPassword("SomePass1");
    expect(derivation.ok).toBe(true);
    if (derivation.ok) {
      const result = await verifyPassword(
        "",
        derivation.data.hash,
        derivation.data.salt
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(false);
      }
    }
  });
});
