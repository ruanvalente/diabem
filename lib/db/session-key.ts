import type { DataEncryptionKey } from "../crypto/crypto.types";

/**
 * In-memory holder for the current user's data-at-rest encryption key.
 *
 * The key is derived from the user's password at login/registration and held
 * ONLY in memory for the duration of the session. It is never persisted (not in
 * localStorage, IndexedDB, cookies or JS). It is wiped on logout and on any
 * interruption.
 *
 * This module is browser-only and must not be imported into Server Components.
 */

let currentKey: DataEncryptionKey | null = null;

export function setSessionDataKey(key: DataEncryptionKey | null): void {
  currentKey = key;
}

export function getSessionDataKey(): DataEncryptionKey | null {
  return currentKey;
}

export function clearSessionDataKey(): void {
  currentKey = null;
}
