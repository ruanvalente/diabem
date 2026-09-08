import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import {
  speechRecognitionCapability,
  speechRecognitionSupported,
} from "./speech-recognition";

describe("speechRecognitionCapability", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns supported when SpeechRecognition is available", () => {
    vi.stubGlobal("SpeechRecognition", class MockSR {});
    expect(speechRecognitionCapability().supported).toBe(true);
  });

  it("returns supported with webkitSpeechRecognition prefix", () => {
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    vi.stubGlobal("webkitSpeechRecognition", class MockSR {});
    expect(speechRecognitionCapability().supported).toBe(true);
  });

  it("returns unsupported when neither API is available", () => {
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
    expect(speechRecognitionCapability().supported).toBe(false);
  });
});

describe("speechRecognitionSupported", () => {
  it("returns false when SpeechRecognition API is missing", () => {
    vi.stubGlobal("window", globalThis);
    delete (globalThis as Record<string, unknown>).SpeechRecognition;
    delete (globalThis as Record<string, unknown>).webkitSpeechRecognition;
    expect(speechRecognitionSupported()).toBe(false);
  });

  it("returns true when SpeechRecognition API is available", () => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("SpeechRecognition", class MockSR {});
    expect(speechRecognitionSupported()).toBe(true);
  });
});
