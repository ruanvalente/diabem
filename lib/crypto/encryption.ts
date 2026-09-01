import {
  AES_GCM_IV_LENGTH,
  ENCRYPTED_PAYLOAD_VERSION,
  type CryptoOperationResult,
  type DataEncryptionKey,
  type EncryptedPayload,
} from "./crypto.types";

const ALGORITHM = "AES-GCM" as const;

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

function keyFromHex(hex: string): Promise<CryptoKey> {
  const bytes = hexToBytes(hex);
  return crypto.subtle.importKey(
    "raw",
    bytes.buffer as ArrayBuffer,
    ALGORITHM,
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts a UTF-8 string using AES-GCM with a fresh random IV per operation.
 * The returned payload is versioned so future schema changes stay backward
 * compatible. Callers must supply a key from {@link KeyManager} (in memory).
 */
export async function encryptPayload(
  key: DataEncryptionKey,
  data: string,
): Promise<CryptoOperationResult<EncryptedPayload>> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
    const cryptoKey = await keyFromHex(key.material);
    const plaintext = new TextEncoder().encode(data);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      cryptoKey,
      plaintext as BufferSource,
    );

    return {
      ok: true,
      data: {
        version: ENCRYPTED_PAYLOAD_VERSION,
        algorithm: ALGORITHM,
        iv: bytesToHex(iv),
        data: bytesToHex(new Uint8Array(ciphertext)),
      },
    };
  } catch {
    return { ok: false, error: "Erro ao criptografar dados" };
  }
}

/**
 * Decrypts a versioned payload back to a UTF-8 string. Fails with a generic
 * error on an invalid key, corrupt or tampered payload, or unsupported version.
 * Never exposes internal details.
 */
export async function decryptPayload(
  key: DataEncryptionKey,
  payload: EncryptedPayload,
): Promise<CryptoOperationResult<string>> {
  try {
    if (payload.version !== ENCRYPTED_PAYLOAD_VERSION || payload.algorithm !== ALGORITHM) {
      return { ok: false, error: "Formato de dados não suportado" };
    }

    const cryptoKey = await keyFromHex(key.material);
    const iv = hexToBytes(payload.iv);
    const ciphertext = hexToBytes(payload.data);

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
      cryptoKey,
      ciphertext as BufferSource,
    );

    return { ok: true, data: new TextDecoder().decode(plaintext) };
  } catch {
    return { ok: false, error: "Não foi possível descriptografar os dados" };
  }
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === ENCRYPTED_PAYLOAD_VERSION &&
    record.algorithm === ALGORITHM &&
    typeof record.iv === "string" &&
    typeof record.data === "string"
  );
}
