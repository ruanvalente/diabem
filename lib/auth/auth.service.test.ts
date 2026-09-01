import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "@/lib/db/database";
import { clearSessionDataKey } from "@/lib/db/session-key";
import { register, login, logout, getCurrentUser, restoreSession } from "./auth.service";

beforeEach(async () => {
  clearSessionDataKey();
  const db = getDatabase();
  await db.users.clear();
  await db.sessions.clear();
});

describe("register", () => {
  const validCredentials = {
    name: "Maria Silva",
    email: "maria@test.com",
    password: "Senha123",
    confirmPassword: "Senha123",
  };

  it("creates a new user and session", async () => {
    const result = await register(validCredentials);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Maria Silva");
      expect(result.data.email).toBe("maria@test.com");
      expect(result.data.id).toBeTruthy();
    }
  });

  it("rejects duplicate email", async () => {
    await register(validCredentials);
    const result = await register(validCredentials);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("já está em uso");
    }
  });

  it("rejects invalid email", async () => {
    const result = await register({
      ...validCredentials,
      email: "not-email",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects weak password", async () => {
    const result = await register({
      ...validCredentials,
      password: "123",
      confirmPassword: "123",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects mismatched passwords", async () => {
    const result = await register({
      ...validCredentials,
      confirmPassword: "Different1",
    });
    expect(result.ok).toBe(false);
  });

  it("does not store password in plain text", async () => {
    await register(validCredentials);
    const db = getDatabase();
    const user = await db.users.where("email").equals("maria@test.com").first();
    expect(user).toBeDefined();
    expect(user?.passwordHash).not.toBe("Senha123");
    expect(user?.passwordHash.length).toBeGreaterThan(0);
    expect(user?.passwordSalt.length).toBeGreaterThan(0);
  });
});

describe("login", () => {
  const credentials = {
    name: "Test User",
    email: "test@test.com",
    password: "Senha123",
    confirmPassword: "Senha123",
  };

  it("logs in with correct credentials", async () => {
    await register(credentials);
    const result = await login({
      email: credentials.email,
      password: credentials.password,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe(credentials.email);
    }
  });

  it("rejects wrong password", async () => {
    await register(credentials);
    const result = await login({
      email: credentials.email,
      password: "WrongPass1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("incorretos");
    }
  });

  it("rejects non-existent email", async () => {
    const result = await login({
      email: "nobody@test.com",
      password: "Senha123",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("incorretos");
    }
  });

  it("rejects invalid email format", async () => {
    const result = await login({
      email: "not-email",
      password: "Senha123",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects empty password", async () => {
    const result = await login({
      email: "test@test.com",
      password: "",
    });
    expect(result.ok).toBe(false);
  });
});

describe("logout", () => {
  it("clears the current session", async () => {
    await register({
      name: "User",
      email: "user@test.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    let user = await getCurrentUser();
    expect(user).not.toBeNull();

    await logout();

    user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("does nothing when no session exists", async () => {
    await expect(logout()).resolves.toBeUndefined();
  });
});

describe("getCurrentUser", () => {
  it("returns current user when session exists", async () => {
    await register({
      name: "Current User",
      email: "current@test.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    const user = await getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.name).toBe("Current User");
    expect(user?.email).toBe("current@test.com");
  });

  it("returns null when no session exists", async () => {
    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});

describe("restoreSession", () => {
  it("restores user from existing session", async () => {
    await register({
      name: "Restore User",
      email: "restore@test.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    const user = await restoreSession();
    expect(user).not.toBeNull();
    expect(user?.name).toBe("Restore User");
  });

  it("returns null when no session to restore", async () => {
    const user = await restoreSession();
    expect(user).toBeNull();
  });

  it("returns null after key is wiped (browser restart) to force re-auth", async () => {
    await register({
      name: "Restart User",
      email: "restart@test.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    // Simulates a fresh page load: the persisted session survives but the
    // in-memory encryption key is gone.
    await clearSessionDataKey();

    const user = await restoreSession();
    expect(user).toBeNull();
  });
});

describe("data isolation", () => {
  it("User A does not see User B data", async () => {
    await register({
      name: "User A",
      email: "a@test.com",
      password: "Senha123",
      confirmPassword: "Senha123",
    });

    const userA = await getCurrentUser();
    expect(userA?.name).toBe("User A");

    await logout();

    await register({
      name: "User B",
      email: "b@test.com",
      password: "Senha456",
      confirmPassword: "Senha456",
    });

    const userB = await getCurrentUser();
    expect(userB?.name).toBe("User B");
    expect(userB?.email).not.toBe(userA?.email);

    await logout();

    await login({ email: "a@test.com", password: "Senha123" });
    const restoredA = await getCurrentUser();
    expect(restoredA?.name).toBe("User A");
    expect(restoredA?.email).toBe("a@test.com");
  });
});
