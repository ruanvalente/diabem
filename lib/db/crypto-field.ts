import {
  decryptPayload,
  encryptPayload,
  isEncryptedPayload,
} from "../crypto/encryption";
import type { EncryptedPayload } from "../crypto/crypto.types";
import { getSessionDataKey } from "./session-key";

/** A single sensitive field value as it may appear at rest or in memory. */
export type SensitiveFieldValue = string | EncryptedPayload | undefined;

/** Sensitive fields keyed by field name (in-memory / persisted union). */
export type SensitiveFields = Record<string, SensitiveFieldValue>;

type EncryptedFieldsOut = {
  fields: SensitiveFields;
  encrypted: boolean;
};

/**
 * Encrypts the given sensitive string fields using the current in-memory
 * session key.
 *
 * If no key is available (e.g. before login or in tests) the input is returned
 * unchanged with `encrypted: false`. When a key IS available every field is
 * encrypted, migrating any legacy plaintext, so the operation is idempotent.
 */
export async function encryptSensitiveFields(
  fields: SensitiveFields,
): Promise<EncryptedFieldsOut> {
  const key = getSessionDataKey();
  if (!key) {
    return { fields, encrypted: false };
  }

  const out: SensitiveFields = {};
  for (const [k, value] of Object.entries(fields)) {
    if (value === undefined || isEncryptedPayload(value)) {
      out[k] = value as EncryptedPayload | undefined;
      continue;
    }
    const result = await encryptPayload(key, value);
    out[k] = result.ok ? result.data : value;
  }

  return { fields: out, encrypted: true };
}

/**
 * Decrypts a set of stored sensitive fields. Handles both encrypted payloads
 * and legacy plaintext (returned as-is). When decryption fails for a field the
 * value is set to undefined so a single bad record cannot break an entire list.
 */
export async function decryptSensitiveFields(
  fields: SensitiveFields,
): Promise<Record<string, string | undefined>> {
  const key = getSessionDataKey();
  const out: Record<string, string | undefined> = {};

  for (const [k, value] of Object.entries(fields)) {
    if (value === undefined) {
      out[k] = undefined;
      continue;
    }
    if (isEncryptedPayload(value)) {
      if (!key) {
        out[k] = undefined;
        continue;
      }
      const result = await decryptPayload(key, value);
      out[k] = result.ok ? result.data : undefined;
      continue;
    }
    // Legacy plaintext.
    out[k] = value;
  }

  return out;
}

