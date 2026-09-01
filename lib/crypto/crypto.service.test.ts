import { describe, it, expect } from "vitest";
import { cryptoService } from "./crypto.service";
import { encryptPayload } from "./encryption";
import {
  deriveEncryptionKey,
  generateKeySalt,
} from "./key-manager";
import type { DataEncryptionKey } from "./crypto.types";

describe("cryptoService.createUserKeys", () => {
  it("derives a 256-bit material and a random salt", async () => {
    const result = await cryptoService.createUserKeys("minha-senha-supersecreta");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // 256-bit material, hex-encoded => 64 chars.
    expect(result.data.dataKey.material).toMatch(/^[0-9a-f]{64}$/);
    // 32-byte salt, hex-encoded => 64 chars.
    expect(result.data.salt).toMatch(/^[0-9a-f]{64}$/);
    expect(result.data.salt).not.toBe(result.data.dataKey.material);
  });

  it("produces a different salt on every call", async () => {
    const a = await cryptoService.createUserKeys("s");
    const b = await cryptoService.createUserKeys("s");
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.data.salt).not.toBe(b.data.salt);
    expect(a.data.dataKey.material).not.toBe(b.data.dataKey.material);
  });
});

describe("encrypt/decrypt roundtrip", () => {
  it("encrypts and decrypts a payload with the correct key", async () => {
    const userKeys = await cryptoService.createUserKeys("senha");
    if (!userKeys.ok) return;
    const key = userKeys.data.dataKey;
    const secret = "Conteúdo de saúde sensível 123";

    const encrypted = await cryptoService.encrypt(key, secret);
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) return;

    expect(encrypted.data.version).toBe(1);
    expect(encrypted.data.algorithm).toBe("AES-GCM");
    expect(encrypted.data.data).not.toContain(secret);

    const decrypted = await cryptoService.decrypt(key, encrypted.data);
    expect(decrypted.ok).toBe(true);
    if (decrypted.ok) expect(decrypted.data).toBe(secret);
  });

  it("uses a fresh random IV per encryption", async () => {
    const key: DataEncryptionKey = { material: "a".repeat(64) };
    const first = await encryptPayload(key, "mesmo texto");
    const second = await encryptPayload(key, "mesmo texto");
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.data.iv).not.toBe(second.data.iv);
    expect(first.data.data).not.toBe(second.data.data);
  });

  it("fails to decrypt with the wrong key", async () => {
    const a = await cryptoService.createUserKeys("senha-a");
    const b = await cryptoService.createUserKeys("senha-b");
    if (!a.ok || !b.ok) return;

    const encrypted = await cryptoService.encrypt(a.data.dataKey, "segredo");
    if (!encrypted.ok) return;

    const wrongKey = await cryptoService.decrypt(b.data.dataKey, encrypted.data);
    expect(wrongKey.ok).toBe(false);
  });

  it("rejects a tampered ciphertext", async () => {
    const userKeys = await cryptoService.createUserKeys("senha");
    if (!userKeys.ok) return;
    const { dataKey } = userKeys.data;
    const encrypted = await cryptoService.encrypt(dataKey, "segredo");
    if (!encrypted.ok) return;

    const tampered = {
      ...encrypted.data,
      data:
        (parseInt(encrypted.data.data[0], 16) ^ 1).toString(16) +
        encrypted.data.data.slice(1),
    };
    const result = await cryptoService.decrypt(dataKey, tampered);
    expect(result.ok).toBe(false);
  });

  it("rejects an unsupported version/algorithm", async () => {
    const userKeys = await cryptoService.createUserKeys("senha");
    if (!userKeys.ok) return;
    const { dataKey } = userKeys.data;
    const encrypted = await cryptoService.encrypt(dataKey, "x");
    if (!encrypted.ok) return;

    const badVersion = await cryptoService.decrypt(dataKey, {
      ...encrypted.data,
      version: 99 as never,
    });
    expect(badVersion.ok).toBe(false);

    const badAlgo = await cryptoService.decrypt(dataKey, {
      ...encrypted.data,
      // @ts-expect-error intentionally invalid algorithm
      algorithm: "AES-CBC",
    });
    expect(badAlgo.ok).toBe(false);
  });
});

describe("deriveEncryptionKey", () => {
  it("reproduces the same key for the same password and salt", async () => {
    const salt = generateKeySalt();
    const a = await deriveEncryptionKey("senha", salt);
    const b = await deriveEncryptionKey("senha", salt);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.data.material).toBe(b.data.material);
  });

  it("produces different keys for different salts", async () => {
    const a = await deriveEncryptionKey("senha", generateKeySalt());
    const b = await deriveEncryptionKey("senha", generateKeySalt());
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.data.material).not.toBe(b.data.material);
  });
});
