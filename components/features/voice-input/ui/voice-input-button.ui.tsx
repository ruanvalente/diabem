import { AlertCircle, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpeechRecognitionState } from "@/lib/browser/services/speech-recognition.service";

type VoiceInputButtonProps = {
  state: SpeechRecognitionState;
  isRecording: boolean;
  hasTranscript: boolean;
  hasError: boolean;
  transcript: string;
  label: string;
  onToggleRecording: () => void;
  onUseText: () => void;
  onDiscard: () => void;
  onRetry: () => void;
};

function getAriaLabel(
  hasError: boolean,
  isRecording: boolean,
  label: string,
): string {
  if (hasError) return "Erro ao gravar áudio, clique para tentar novamente";
  if (isRecording) return "Gravando áudio, clique para parar";
  return label;
}

function getButtonLabel(
  state: SpeechRecognitionState,
  isRecording: boolean,
  hasError: boolean,
  label: string,
): string {
  if (hasError) return "Tente novamente";
  if (state === "starting") return "Iniciando...";
  if (state === "processing") return "Processando...";
  if (isRecording) return "Gravando...";
  return label;
}

export function VoiceInputButton({
  state,
  isRecording,
  hasTranscript,
  hasError,
  transcript,
  label,
  onToggleRecording,
  onUseText,
  onDiscard,
  onRetry,
}: VoiceInputButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isRecording ? "destructive" : "default"}
        onClick={hasError ? onRetry : onToggleRecording}
        aria-label={getAriaLabel(hasError, isRecording, label)}
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
        {getButtonLabel(state, isRecording, hasError, label)}
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
              onClick={onUseText}
              aria-label="Usar texto reconhecido"
              className="h-9 flex-1"
            >
              Usar texto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscard}
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
