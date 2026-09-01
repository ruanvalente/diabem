/**
 * Storage persistence and quota awareness.
 *
 * Uses the Storage API (`navigator.storage.persist()` and `.estimate()`) when
 * available to request durable storage and surface a warning when the device is
 * getting close to its quota. The app degrades gracefully when these APIs are
 * unavailable.
 */

export type StorageEstimate = {
  usageBytes: number;
  quotaBytes: number;
};

const WARNING_THRESHOLD = 0.9; // 90% of quota triggers a warning

function hasStorageApi(): boolean {
  return typeof navigator !== "undefined" && "storage" in navigator;
}

/**
 * Requests persistent storage. Resolves true when granted or unsupported (no
 * way to know), false when explicitly denied.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!hasStorageApi()) {
    return true;
  }
  try {
    if (typeof navigator.storage.persist === "function") {
      return await navigator.storage.persist();
    }
    return true;
  } catch {
    return false;
  }
}

export async function isStoragePersisted(): Promise<boolean> {
  if (!hasStorageApi() || typeof navigator.storage.persisted !== "function") {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * Reads current usage and quota. Returns null when the API is unavailable.
 */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!hasStorageApi() || typeof navigator.storage.estimate !== "function") {
    return null;
  }
  try {
    const estimate = await navigator.storage.estimate();
    if (estimate.usage === undefined || estimate.quota === undefined) {
      return null;
    }
    return { usageBytes: estimate.usage, quotaBytes: estimate.quota };
  } catch {
    return null;
  }
}

/**
 * True when usage exceeds `WARNING_THRESHOLD` of quota. Returns false when the
 * estimate is unavailable.
 */
export function isNearStorageLimit(estimate: StorageEstimate | null): boolean {
  if (!estimate || estimate.quotaBytes <= 0) {
    return false;
  }
  return estimate.usageBytes / estimate.quotaBytes >= WARNING_THRESHOLD;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unit = "B";
  for (const u of units) {
    value = value / 1024;
    unit = u;
    if (value < 1024) break;
  }
  const formatted = value >= 100 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "");
  return `${formatted} ${unit}`;
}
