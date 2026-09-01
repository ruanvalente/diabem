import type { CryptoOperationResult, DataEncryptionKey } from "./crypto.types";

/**
 * Derivation parameters for the data-at-rest encryption key.
 *
 * An independent salt (random, per-user) and higher iteration count are used so
 * the encryption key is not derived from the password-hash path. The salt is
 * not secret and is persisted with the user's cryptographic metadata.
 */

const KEY_ITERATIONS = 210_000;
const KEY_LENGTH_BITS = 256;
const KEY_SALT_LENGTH = 32; // bytes
const PBKDF2_HASH = "SHA-256";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function generateKeySalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(KEY_SALT_LENGTH));
  return bytesToHex(salt);
}

/**
 * Derives a 256-bit AES-GCM key from a user password and a per-user salt.
 * The derived key is returned as an in-memory-only {@link DataEncryptionKey}
 * and MUST NOT be persisted.
 */
export async function deriveEncryptionKey(
  password: string,
  salt: string,
): Promise<CryptoOperationResult<DataEncryptionKey>> {
  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password) as BufferSource,
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: hexToBytes(salt).buffer as ArrayBuffer,
        iterations: KEY_ITERATIONS,
        hash: PBKDF2_HASH,
      },
      keyMaterial,
      KEY_LENGTH_BITS,
    );

    return { ok: true, data: { material: bytesToHex(new Uint8Array(derivedBits)) } };
  } catch {
    return { ok: false, error: "Erro ao derivar chave de criptografia" };
  }
}
