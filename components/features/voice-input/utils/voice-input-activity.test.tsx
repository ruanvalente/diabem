import { describe, it, expect } from "vitest";
import { resolveVoiceInputActivity } from "./voice-input-activity";
import type { SpeechRecognitionState } from "@/lib/browser/services/speech-recognition.service";

describe("resolveVoiceInputActivity", () => {
  const cases: [SpeechRecognitionState, string][] = [
    ["idle", "idle"],
    ["unsupported", "idle"],
    ["starting", "recording"],
    ["listening", "recording"],
    ["processing", "recording"],
    ["error", "error"],
  ];

  it.each(cases)("maps %s to %s", (state, expected) => {
    expect(resolveVoiceInputActivity(state)).toBe(expected);
  });
});
