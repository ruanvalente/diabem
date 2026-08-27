import type { PasswordDerivation, CryptoOperationResult } from "./crypto.types";

const PBKDF2_ITERATIONS = 100_000;
const HASH_LENGTH = 64;
const SALT_LENGTH = 32;

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return arrayBufferToHex(salt.buffer);
}

async function deriveKey(
  password: string,
  salt: string,
): Promise<CryptoOperationResult<string>> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = hexToArrayBuffer(salt);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-512",
      },
      keyMaterial,
      HASH_LENGTH * 8,
    );

    const hash = arrayBufferToHex(derivedBits);
    return { ok: true, data: hash };
  } catch {
    return { ok: false, error: "Erro ao processar senha" };
  }
}

export async function hashPassword(
  password: string,
): Promise<CryptoOperationResult<PasswordDerivation>> {
  const salt = generateSalt();
  const result = await deriveKey(password, salt);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    data: { hash: result.data, salt },
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
): Promise<CryptoOperationResult<boolean>> {
  const result = await deriveKey(password, storedSalt);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, data: result.data === storedHash };
}

export async function deriveEncryptionKey(
  password: string,
): Promise<CryptoOperationResult<ArrayBuffer>> {
  const result = await deriveKey(password, "");
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const hashBuffer = hexToArrayBuffer(result.data);
  const keyBytes = new Uint8Array(hashBuffer, 0, 32);
  return { ok: true, data: keyBytes.buffer };
}

export async function encryptData(
  key: ArrayBuffer,
  data: string,
): Promise<CryptoOperationResult<string>> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      dataBuffer,
    );

    const ivHex = arrayBufferToHex(iv.buffer);
    const ciphertextHex = arrayBufferToHex(encryptedBuffer);

    return { ok: true, data: ivHex + ciphertextHex };
  } catch (error) {
    return { ok: false, error: "Erro ao criptografar dados" };
  }
}

export async function decryptData(
  key: ArrayBuffer,
  encryptedData: string,
): Promise<CryptoOperationResult<string>> {
  try {
    const ivHex = encryptedData.substring(0, 24);
    const ciphertextHex = encryptedData.substring(24);

    const iv = hexToArrayBuffer(ivHex);
    const ciphertext = hexToArrayBuffer(ciphertextHex);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      "AES-GCM",
      false,
      ["decrypt"],
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      cryptoKey,
      ciphertext,
    );

    const decoder = new TextDecoder();
    const data = decoder.decode(decryptedBuffer);

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Erro ao descriptografar dados" };
  }
}
