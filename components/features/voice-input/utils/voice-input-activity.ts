import type { SpeechRecognitionState } from "@/lib/browser/services/speech-recognition.service";

export type VoiceInputActivity = "idle" | "recording" | "error";

/**
 * Collapses a recognition state into the situation the feature reacts to.
 * `starting` and `processing` still count as recording: the microphone is
 * capturing or its result is still pending, and a press must stop instead of
 * starting another recognition.
 */
export function resolveVoiceInputActivity(
  state: SpeechRecognitionState,
): VoiceInputActivity {
  switch (state) {
    case "error":
      return "error";
    case "listening":
    case "starting":
    case "processing":
      return "recording";
    case "idle":
    case "unsupported":
      return "idle";
  }
}
