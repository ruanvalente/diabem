import { decryptPayload, encryptPayload } from "./encryption";
import { deriveEncryptionKey, generateKeySalt } from "./key-manager";
import type {
  CryptoOperationResult,
  DataEncryptionKey,
  EncryptedPayload,
} from "./crypto.types";

/**
 * High-level, typed, testable crypto API used by the persistence layer.
 *
 * The UI / repositories never call `crypto.subtle` directly; they go through
 * this service. Functions are async, side-effect free and independent of any
 * React or Dexie concern.
 */

export type DerivedKeys = {
  /** Data-at-rest encryption key, held in memory only. */
  dataKey: DataEncryptionKey;
  /** Per-user random salt. Not secret; persisted alongside the user. */
  salt: string;
};

/**
 * Generates a fresh per-user salt and derives the data encryption key from the
 * user's password. Called once during registration/login.
 */
export async function createUserKeys(
  password: string,
): Promise<CryptoOperationResult<DerivedKeys>> {
  const salt = generateKeySalt();
  const derived = await deriveEncryptionKey(password, salt);
  if (!derived.ok) {
    return { ok: false, error: derived.error };
  }
  return { ok: true, data: { dataKey: derived.data, salt } };
}

/**
 * Rebuilds a data key from a password and a stored per-user salt. Needed on
 * subsequent logins to re-derive the in-memory key.
 */
export async function restoreUserKey(
  password: string,
  salt: string,
): Promise<CryptoOperationResult<DataEncryptionKey>> {
  return deriveEncryptionKey(password, salt);
}

/** Encrypts a string into a versioned payload. */
export async function encrypt(
  key: DataEncryptionKey,
  data: string,
): Promise<CryptoOperationResult<EncryptedPayload>> {
  return encryptPayload(key, data);
}

/** Decrypts a versioned payload back to a string. */
export async function decrypt(
  key: DataEncryptionKey,
  payload: EncryptedPayload,
): Promise<CryptoOperationResult<string>> {
  return decryptPayload(key, payload);
}

export type CryptoService = {
  createUserKeys: typeof createUserKeys;
  restoreUserKey: typeof restoreUserKey;
  encrypt: typeof encrypt;
  decrypt: typeof decrypt;
};

export const cryptoService: CryptoService = {
  createUserKeys,
  restoreUserKey,
  encrypt,
  decrypt,
};
