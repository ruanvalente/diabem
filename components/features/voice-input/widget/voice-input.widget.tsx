"use client";

import { useSpeechRecognition } from "@/lib/browser/hooks/use-speech-recognition";
import { VoiceInputButton } from "../ui/voice-input-button.ui";

type VoiceInputWidgetProps = {
  onTranscript: (text: string) => void;
  label: string;
};

export function VoiceInputWidget({
  onTranscript,
  label,
}: VoiceInputWidgetProps) {
  const { state, supported, transcript, isListening, start, stop, reset } =
    useSpeechRecognition();

  if (!supported) return null;

  const isRecording = isListening || state === "processing";
  const hasTranscript = transcript.trim() !== "" && !isRecording;
  const hasError = state === "error";

  const handleToggleRecording = () => {
    if (isRecording) {
      stop();
    } else {
      start();
    }
  };

  const handleUseText = () => {
    onTranscript(transcript);
    reset();
  };

  const handleDiscard = () => {
    reset();
  };

  const handleRetry = () => {
    reset();
    start();
  };

  return (
    <VoiceInputButton
      state={state}
      isRecording={isRecording}
      hasTranscript={hasTranscript}
      hasError={hasError}
      transcript={transcript}
      label={label}
      onToggleRecording={handleToggleRecording}
      onUseText={handleUseText}
      onDiscard={handleDiscard}
      onRetry={handleRetry}
    />
  );
}
