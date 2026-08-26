import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { userRepository } from "./user.repository";

beforeEach(async () => {
  const db = getDatabase();
  await db.users.clear();
  await db.sessions.clear();
});

describe("userRepository.create", () => {
  it("creates a user with generated id and timestamps", async () => {
    const user = await userRepository.create({
      name: "Maria",
      email: "maria@test.com",
      passwordHash: "hash123",
      passwordSalt: "salt123",
    });

    expect(user.id).toBeTruthy();
    expect(user.name).toBe("Maria");
    expect(user.email).toBe("maria@test.com");
    expect(user.createdAt).toBeTruthy();
    expect(user.updatedAt).toBeTruthy();
  });
});

describe("userRepository.findById", () => {
  it("finds an existing user by id", async () => {
    const created = await userRepository.create({
      name: "Joao",
      email: "joao@test.com",
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    const found = await userRepository.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Joao");
  });

  it("returns undefined for non-existent id", async () => {
    const found = await userRepository.findById("non-existent-id");
    expect(found).toBeUndefined();
  });
});

describe("userRepository.findByEmail", () => {
  it("finds user by email", async () => {
    await userRepository.create({
      name: "Ana",
      email: "ana@test.com",
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    const found = await userRepository.findByEmail("ana@test.com");
    expect(found).toBeDefined();
    expect(found?.name).toBe("Ana");
  });

  it("returns undefined for non-existent email", async () => {
    const found = await userRepository.findByEmail("none@test.com");
    expect(found).toBeUndefined();
  });
});

describe("userRepository.update", () => {
  it("updates user fields", async () => {
    const created = await userRepository.create({
      name: "Old Name",
      email: "old@test.com",
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    await new Promise((r) => setTimeout(r, 10));

    const updated = await userRepository.update(created.id, {
      name: "New Name",
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe("New Name");
    expect(updated?.email).toBe("old@test.com");
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("returns undefined for non-existent user", async () => {
    const result = await userRepository.update("non-existent", {
      name: "Test",
    });
    expect(result).toBeUndefined();
  });
});

describe("userRepository.deleteById", () => {
  it("deletes an existing user", async () => {
    const created = await userRepository.create({
      name: "Delete Me",
      email: "delete@test.com",
      passwordHash: "hash",
      passwordSalt: "salt",
    });

    const result = await userRepository.deleteById(created.id);
    expect(result).toBe(true);

    const found = await userRepository.findById(created.id);
    expect(found).toBeUndefined();
  });
});

describe("userRepository.count", () => {
  it("counts users", async () => {
    expect(await userRepository.count()).toBe(0);

    await userRepository.create({
      name: "User 1",
      email: "u1@test.com",
      passwordHash: "h",
      passwordSalt: "s",
    });
    await userRepository.create({
      name: "User 2",
      email: "u2@test.com",
      passwordHash: "h",
      passwordSalt: "s",
    });

    expect(await userRepository.count()).toBe(2);
  });
});
