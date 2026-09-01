import { describe, it, expect, afterEach, vi } from "vitest";
import { getInitialOnlineState } from "@/lib/offline/network-status";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getInitialOnlineState", () => {
  it("defaults to online when `navigator` is unavailable (SSR path)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(getInitialOnlineState()).toBe(true);
  });

  it("mirrors the browser's reported connectivity", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(getInitialOnlineState()).toBe(false);

    vi.stubGlobal("navigator", { onLine: true });
    expect(getInitialOnlineState()).toBe(true);
  });
});