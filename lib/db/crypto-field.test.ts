import { describe, it, expect, beforeEach } from "vitest";
import {
  clearSessionDataKey,
  setSessionDataKey,
} from "./session-key";
import {
  encryptSensitiveFields,
  decryptSensitiveFields,
  type SensitiveFields,
} from "./crypto-field";
import { cryptoService } from "../crypto/crypto.service";
import type { DataEncryptionKey } from "../crypto/crypto.types";

let key: DataEncryptionKey;

beforeEach(async () => {
  clearSessionDataKey();
  const result = await cryptoService.createUserKeys("teste");
  if (!result.ok) throw new Error("key derivation failed");
  key = result.data.dataKey;
});

describe("encryptSensitiveFields", () => {
  it("returns encrypted:false and unchanged fields when no key is set", async () => {
    const fields: SensitiveFields = { notes: "texto" };
    const result = await encryptSensitiveFields(fields);
    expect(result.encrypted).toBe(false);
    expect(result.fields.notes).toBe("texto");
  });

  it("encrypts all string fields when a key is present", async () => {
    setSessionDataKey(key);
    const result = await encryptSensitiveFields({
      notes: "segredo",
      description: "outro segredo",
    });
    expect(result.encrypted).toBe(true);
    for (const value of Object.values(result.fields)) {
      expect(value).not.toBe("segredo");
      expect(value).not.toBe("outro segredo");
    }
  });

  it("passes through an already-encrypted payload without double encryption", async () => {
    setSessionDataKey(key);
    const first = await encryptSensitiveFields({ notes: "valor" });
    const second = await encryptSensitiveFields(first.fields);
    expect(first.fields.notes).toEqual(second.fields.notes);
  });

  it("does not encrypt undefined fields", async () => {
    setSessionDataKey(key);
    const result = await encryptSensitiveFields({ notes: undefined });
    expect(result.fields.notes).toBeUndefined();
  });
});

describe("decryptSensitiveFields", () => {
  it("roundtrips encrypted fields back to plaintext", async () => {
    setSessionDataKey(key);
    const original = "conteúdo sensível";
    const { fields } = await encryptSensitiveFields({ notes: original });
    const decrypted = await decryptSensitiveFields(fields);
    expect(decrypted.notes).toBe(original);
  });

  it("returns legacy plaintext as-is", async () => {
    const decrypted = await decryptSensitiveFields({ notes: "plano" });
    expect(decrypted.notes).toBe("plano");
  });

  it("returns undefined for encrypted fields when no key is available", async () => {
    setSessionDataKey(key);
    const { fields } = await encryptSensitiveFields({ notes: "secreto" });
    clearSessionDataKey();
    const decrypted = await decryptSensitiveFields(fields);
    expect(decrypted.notes).toBeUndefined();
  });

  it("decrypts to undefined when the key is wrong", async () => {
    setSessionDataKey(key);
    const { fields } = await encryptSensitiveFields({ notes: "secreto" });
    const other = await cryptoService.createUserKeys("outra");
    if (!other.ok) return;
    setSessionDataKey(other.data.dataKey);
    const decrypted = await decryptSensitiveFields(fields);
    expect(decrypted.notes).toBeUndefined();
  });
});
