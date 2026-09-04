import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import { browserCapabilities } from "./index";

describe("browserCapabilities", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns supported capabilities when all APIs are available", () => {
    vi.stubGlobal("Notification", { permission: "default" });
    vi.stubGlobal("SpeechRecognition", class MockSR {});
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn() } });
    const caps = browserCapabilities();
    expect(caps.notifications.supported).toBe(true);
    expect(caps.speechRecognition.supported).toBe(true);
    expect(caps.camera.supported).toBe(true);
  });

  it("returns unsupported capabilities when APIs are missing", () => {
    delete (globalThis as Record<string, unknown>).Notification;
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
    vi.stubGlobal("navigator", {});
    const caps = browserCapabilities();
    expect(caps.notifications.supported).toBe(false);
    expect(caps.speechRecognition.supported).toBe(false);
    expect(caps.camera.supported).toBe(false);
  });
});
