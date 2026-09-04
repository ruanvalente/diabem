"use client";

import { AlertCircle, Loader2, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/lib/browser/hooks/use-speech-recognition";

type VoiceInputButtonProps = {
  onTranscript: (text: string) => void;
  label: string;
};

export function VoiceInputButton({
  onTranscript,
  label,
}: VoiceInputButtonProps) {
  const {
    state,
    supported,
    transcript,
    isListening,
    start,
    stop,
    abort,
    reset,
  } = useSpeechRecognition();

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

  const getAriaLabel = () => {
    if (hasError) return "Erro ao gravar áudio, clique para tentar novamente";
    if (isRecording) return "Gravando áudio, clique para parar";
    return label;
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isRecording ? "destructive" : "default"}
        onClick={hasError ? handleRetry : handleToggleRecording}
        aria-label={getAriaLabel()}
        aria-pressed={isRecording}
        className="h-12 w-full gap-2 text-base"
      >
        {hasError ? (
          <AlertCircle className="size-4" aria-hidden="true" />
        ) : isRecording ? (
          <Square className="size-4" aria-hidden="true" />
        ) : (
          <Mic className="size-4" aria-hidden="true" />
        )}
        {hasError
          ? "Tente novamente"
          : state === "starting"
            ? "Iniciando..."
            : state === "processing"
              ? "Processando..."
              : isRecording
                ? "Gravando..."
                : label}
        {(state === "starting" || state === "processing") && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
      </Button>

      {(isRecording || hasError) && (
        <p
          role="status"
          aria-live="polite"
          className="text-center text-sm text-muted-foreground"
        >
          {hasError
            ? "Não foi possível capturar áudio."
            : "Ouvindo... Fale sua observação."}
        </p>
      )}

      {hasTranscript && (
        <>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-muted-foreground"
          >
            {`Texto reconhecido: "${transcript}"`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleUseText}
              aria-label="Usar texto reconhecido"
              className="h-9 flex-1"
            >
              Usar texto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              aria-label="Descartar texto reconhecido"
              className="h-9 flex-1"
            >
              Descartar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
