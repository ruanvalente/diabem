import { createUserSchema, loginUserSchema } from "../db/schema";
import { userRepository } from "../db/repositories/user.repository";
import { sessionRepository } from "../db/repositories/session.repository";
import { hashPassword, verifyPassword } from "../crypto/key-derivation";
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

  const user = await userRepository.create({
    name,
    email,
    passwordHash: derivation.data.hash,
    passwordSalt: derivation.data.salt,
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
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await sessionRepository.getCurrent();
  if (!session) return null;

  const user = await userRepository.findById(session.userId);
  return toAuthUser(user);
}

export async function restoreSession(): Promise<AuthUser | null> {
  return getCurrentUser();
}
