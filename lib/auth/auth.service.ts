import { createUserSchema, loginUserSchema } from "../db/schema";
import { userRepository } from "../db/repositories/user.repository";
import { sessionRepository } from "../db/repositories/session.repository";
import { hashPassword, verifyPassword } from "../crypto/key-derivation";
import { cryptoService } from "../crypto/crypto.service";
import {
  clearSessionDataKey,
  getSessionDataKey,
  setSessionDataKey,
} from "../db/session-key";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "./auth.types";

type AuthServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toAuthUser(
  user:
    | { id: string; email: string; name: string; createdAt: string }
    | undefined,
): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export async function register(
  credentials: RegisterCredentials,
): Promise<AuthServiceResult<AuthUser>> {
  const validation = createUserSchema.safeParse(credentials);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return { ok: false, error: firstError.message };
  }

  const { name, email, password } = validation.data;

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return { ok: false, error: "Este e-mail já está em uso" };
  }

  const derivation = await hashPassword(password);
  if (!derivation.ok) {
    return { ok: false, error: derivation.error };
  }

  // Derive a data-at-rest encryption key (per-user salt) and hold it in memory.
  const keys = await cryptoService.createUserKeys(password);
  if (!keys.ok) {
    return { ok: false, error: keys.error };
  }
  setSessionDataKey(keys.data.dataKey);

  const user = await userRepository.create({
    name,
    email,
    passwordHash: derivation.data.hash,
    passwordSalt: derivation.data.salt,
    keySalt: keys.data.salt,
  });

  await sessionRepository.create({ userId: user.id });

  return { ok: true, data: toAuthUser(user)! };
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthServiceResult<AuthUser>> {
  const validation = loginUserSchema.safeParse(credentials);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return { ok: false, error: firstError.message };
  }

  const { email, password } = validation.data;

  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { ok: false, error: "E-mail ou senha incorretos" };
  }

  const verification = await verifyPassword(
    password,
    user.passwordHash,
    user.passwordSalt,
  );
  if (!verification.ok) {
    return { ok: false, error: verification.error };
  }

  if (!verification.data) {
    return { ok: false, error: "E-mail ou senha incorretos" };
  }

  // Re-derive the data-at-rest encryption key from the stored per-user salt.
  if (user.keySalt) {
    const keyResult = await cryptoService.restoreUserKey(password, user.keySalt);
    if (!keyResult.ok) {
      return { ok: false, error: keyResult.error };
    }
    setSessionDataKey(keyResult.data);
  }

  const currentSession = await sessionRepository.getCurrent();
  if (currentSession) {
    await sessionRepository.deleteById(currentSession.id);
  }

  await sessionRepository.create({ userId: user.id });

  return { ok: true, data: toAuthUser(user)! };
}

export async function logout(): Promise<void> {
  const session = await sessionRepository.getCurrent();
  if (session) {
    await sessionRepository.deleteById(session.id);
  }
  // Wipe the data-at-rest encryption key from memory. Encrypted data stays on
  // disk and is recoverable on next login with the correct password.
  clearSessionDataKey();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await sessionRepository.getCurrent();
  if (!session) return null;

  const user = await userRepository.findById(session.userId);
  return toAuthUser(user);
}

/**
 * Restores the current user from the persisted session, but only when the
 * data-at-rest encryption key is available in memory.
 *
 * A session may survive a browser restart (persisted in IndexedDB). Because the
 * encryption key is held only in memory and is never persisted, a fresh page
 * load has no key. Returning a user we cannot decrypt data for would silently
 * show blank records, so we force re-authentication when the user has a
 * `keySalt` (encryption configured) but no key is present.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  const session = await sessionRepository.getCurrent();
  if (!session) return null;

  const user = await userRepository.findById(session.userId);
  if (!user) return null;

  if (user.keySalt && !getSessionDataKey()) {
    return null;
  }

  return toAuthUser(user);
}
