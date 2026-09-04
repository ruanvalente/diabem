import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import { speechRecognitionService } from "./speech-recognition.service";

describe("speechRecognitionService", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("SpeechRecognition", class MockSR {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    speechRecognitionService.abort();
  });

  describe("isSupported", () => {
    it("returns true when SpeechRecognition is available", () => {
      expect(speechRecognitionService.isSupported()).toBe(true);
    });

    it("returns true with webkit prefix", () => {
      delete (globalThis as Record<string, unknown>).SpeechRecognition;
      vi.stubGlobal("webkitSpeechRecognition", class MockSR {});
      expect(speechRecognitionService.isSupported()).toBe(true);
    });

    it("returns false when SpeechRecognition API is missing", () => {
      delete (globalThis as Record<string, unknown>).SpeechRecognition;
      delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
      expect(speechRecognitionService.isSupported()).toBe(false);
    });
  });

  describe("getState", () => {
    it("returns idle by default", () => {
      expect(speechRecognitionService.getState()).toBe("idle");
    });
  });

  describe("start", () => {
    it("sets unsupported state when API is not available", () => {
      delete (globalThis as Record<string, unknown>).SpeechRecognition;
      delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
      const onStateChange = vi.fn();
      speechRecognitionService.setHandlers({ onStateChange });
      speechRecognitionService.start();
      expect(onStateChange).toHaveBeenCalledWith("unsupported");
    });
  });

  describe("stop and abort", () => {
    it("stop is safe to call when no recognition is active", () => {
      expect(() => speechRecognitionService.stop()).not.toThrow();
    });

    it("abort is safe to call when no recognition is active", () => {
      expect(() => speechRecognitionService.abort()).not.toThrow();
    });
  });
});
