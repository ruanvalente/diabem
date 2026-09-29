import { Button } from "@/components/ui/button";

type VoiceTranscriptActionsProps = {
  transcript: string;
  onUse: () => void;
  onDiscard: () => void;
};

/**
 * Presents the recognized text together with the explicit decision to keep or
 * discard it.
 */
export function VoiceTranscriptActions({
  transcript,
  onUse,
  onDiscard,
}: VoiceTranscriptActionsProps) {
  return (
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
          onClick={onUse}
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
  );
}
