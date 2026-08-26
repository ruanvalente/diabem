import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { sessionRepository } from "./session.repository";

beforeEach(async () => {
  const db = getDatabase();
  await db.users.clear();
  await db.sessions.clear();
});

describe("sessionRepository.create", () => {
  it("creates a session with generated id and timestamp", async () => {
    const session = await sessionRepository.create({ userId: "user-1" });

    expect(session.id).toBeTruthy();
    expect(session.userId).toBe("user-1");
    expect(session.createdAt).toBeTruthy();
  });
});

describe("sessionRepository.getCurrent", () => {
  it("returns the most recent session", async () => {
    await sessionRepository.create({ userId: "user-1" });
    await new Promise((r) => setTimeout(r, 10));
    const second = await sessionRepository.create({ userId: "user-1" });

    const current = await sessionRepository.getCurrent();
    expect(current).toBeDefined();
    expect(current?.id).toBe(second.id);
  });

  it("returns undefined when no sessions exist", async () => {
    const current = await sessionRepository.getCurrent();
    expect(current).toBeUndefined();
  });

  it("returns undefined for expired session", async () => {
    const db = getDatabase();
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    await db.sessions.add({
      id: "expired-session",
      userId: "user-1",
      createdAt: pastDate,
      expiresAt: pastDate,
    });

    const current = await sessionRepository.getCurrent();
    expect(current).toBeUndefined();
  });
});

describe("sessionRepository.deleteById", () => {
  it("deletes a session", async () => {
    const session = await sessionRepository.create({ userId: "user-1" });
    const result = await sessionRepository.deleteById(session.id);
    expect(result).toBe(true);

    const current = await sessionRepository.getCurrent();
    expect(current).toBeUndefined();
  });
});

describe("sessionRepository.deleteAll", () => {
  it("clears all sessions", async () => {
    await sessionRepository.create({ userId: "user-1" });
    await sessionRepository.create({ userId: "user-2" });

    await sessionRepository.deleteAll();

    const current = await sessionRepository.getCurrent();
    expect(current).toBeUndefined();
  });
});
