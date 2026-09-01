export type PasswordDerivation = {
  hash: string;
  salt: string;
};

export type CryptoOperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Versioned encrypted payload format stored in IndexedDB.
 *
 * The version field allows the mechanism to evolve without breaking existing
 * records. The IV is unique per encryption operation and is stored (it is not a
 * secret); it must never be reused with the same key.
 */
export type EncryptedPayload = {
  version: 1;
  algorithm: "AES-GCM";
  iv: string;
  data: string;
};

export const ENCRYPTED_PAYLOAD_VERSION = 1 as const;

export const AES_GCM_IV_LENGTH = 12; // bytes

/** Serializable in-memory encryption key wrapper used by the DAO layer. */
export type DataEncryptionKey = {
  /** Raw 32-byte AES-GCM key, hex-encoded. Held only in memory. */
  material: string;
};

