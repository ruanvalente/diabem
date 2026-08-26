import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
} from "./schema";

describe("createUserSchema", () => {
  const validInput = {
    name: "Maria Silva",
    email: "maria@example.com",
    password: "Senha123",
    confirmPassword: "Senha123",
  };

  it("accepts valid input", () => {
    const result = createUserSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      name: "M",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("2 caracteres");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("longo");
    }
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("inválido");
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      password: "Ab1",
      confirmPassword: "Ab1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("8 caracteres");
    }
  });

  it("rejects password without uppercase", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      password: "senha123",
      confirmPassword: "senha123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("maiúscula");
    }
  });

  it("rejects password without lowercase", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      password: "SENHA123",
      confirmPassword: "SENHA123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("minúscula");
    }
  });

  it("rejects password without number", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      password: "SenhaTeste",
      confirmPassword: "SenhaTeste",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("número");
    }
  });

  it("rejects mismatched passwords", () => {
    const result = createUserSchema.safeParse({
      ...validInput,
      confirmPassword: "OutraSenha1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => i.path[0] === "confirmPassword"
      );
      expect(confirmError).toBeDefined();
      expect(confirmError!.message).toContain("coincidem");
    }
  });
});

describe("loginUserSchema", () => {
  it("accepts valid input", () => {
    const result = loginUserSchema.safeParse({
      email: "user@example.com",
      password: "any-password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginUserSchema.safeParse({
      email: "invalid",
      password: "any",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginUserSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserSchema", () => {
  it("accepts partial updates", () => {
    const result = updateUserSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty update", () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid email in update", () => {
    const result = updateUserSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
  });
});
