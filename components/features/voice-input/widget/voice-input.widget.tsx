"use client";

import { useSpeechRecognition } from "@/lib/browser/hooks/use-speech-recognition";
import { resolveVoiceInputActivity } from "../utils/voice-input-activity";
import { VoiceInputButton } from "../ui/voice-input-button.ui";

type VoiceInputWidgetProps = {
  onTranscript: (text: string) => void;
  label: string;
};

/**
 * Orchestrates speech recognition for a notes field. It renders nothing when
 * the browser has no recognition API, so its absence is deliberate rather than
 * a loading state.
 */
export function VoiceInputWidget({
  onTranscript,
  label,
}: VoiceInputWidgetProps) {
  const { state, supported, transcript, start, stop, reset } =
    useSpeechRecognition();

  if (!supported) return null;

  const handleToggle = () => {
    const activity = resolveVoiceInputActivity(state);

    if (activity === "error") {
      reset();
      start();
      return;
    }
    if (activity === "recording") {
      stop();
      return;
    }
    start();
  };

  const handleUseTranscript = () => {
    onTranscript(transcript);
    reset();
  };

  const handleDiscard = () => {
    reset();
  };

  return (
    <VoiceInputButton
      state={state}
      transcript={transcript}
      label={label}
      onToggle={handleToggle}
      onUseTranscript={handleUseTranscript}
      onDiscard={handleDiscard}
    />
  );
}
