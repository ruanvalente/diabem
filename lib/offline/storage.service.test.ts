import { describe, it, expect } from "vitest";
import {
  formatBytes,
  isNearStorageLimit,
} from "./storage.service";
import type { StorageEstimate } from "./storage.service";

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(3 * 1024 * 1024)).toBe("3 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2 GB");
  });
});

describe("isNearStorageLimit", () => {
  it("returns false when estimate is null or quota is zero", () => {
    expect(isNearStorageLimit(null)).toBe(false);
    expect(isNearStorageLimit({ usageBytes: 100, quotaBytes: 0 })).toBe(false);
  });

  it("returns false while usage is under the warning threshold", () => {
    const estimate: StorageEstimate = { usageBytes: 100, quotaBytes: 1000 };
    expect(isNearStorageLimit(estimate)).toBe(false);
  });

  it("returns true when usage reaches the warning threshold", () => {
    const estimate: StorageEstimate = { usageBytes: 901, quotaBytes: 1000 };
    expect(isNearStorageLimit(estimate)).toBe(true);
  });
});
