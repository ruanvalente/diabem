import {
  AlertCircle,
  Loader2,
  Mic,
  Square,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpeechRecognitionState } from "@/lib/browser/services/speech-recognition.service";
import {
  resolveVoiceInputActivity,
  type VoiceInputActivity,
} from "../utils/voice-input-activity";
import { VoiceTranscriptActions } from "./voice-transcript-actions.ui";

type VoiceInputButtonProps = {
  state: SpeechRecognitionState;
  transcript: string;
  label: string;
  onToggle: () => void;
  onUseTranscript: () => void;
  onDiscard: () => void;
};

type VoiceInputViewInput = Pick<
  VoiceInputButtonProps,
  "state" | "transcript" | "label"
>;

type VoiceInputTrigger = {
  icon: LucideIcon;
  ariaLabel: string;
  label: string;
  isBusy: boolean;
};

type VoiceInputView = {
  activity: VoiceInputActivity;
  trigger: VoiceInputTrigger;
  statusMessage: string | null;
  hasTranscript: boolean;
};

const COPY = {
  ariaError: "Erro ao gravar áudio, clique para tentar novamente",
  ariaRecording: "Gravando áudio, clique para parar",
  labelRetry: "Tente novamente",
  labelStarting: "Iniciando...",
  labelProcessing: "Processando...",
  labelRecording: "Gravando...",
  statusError: "Não foi possível capturar áudio.",
  statusRecording: "Ouvindo... Fale sua observação.",
} as const;

function resolveTrigger(
  state: SpeechRecognitionState,
  label: string,
): VoiceInputTrigger {
  switch (state) {
    case "error":
      return {
        icon: AlertCircle,
        ariaLabel: COPY.ariaError,
        label: COPY.labelRetry,
        isBusy: false,
      };
    case "starting":
      return {
        icon: Square,
        ariaLabel: COPY.ariaRecording,
        label: COPY.labelStarting,
        isBusy: true,
      };
    case "processing":
      return {
        icon: Square,
        ariaLabel: COPY.ariaRecording,
        label: COPY.labelProcessing,
        isBusy: true,
      };
    case "listening":
      return {
        icon: Square,
        ariaLabel: COPY.ariaRecording,
        label: COPY.labelRecording,
        isBusy: false,
      };
    case "idle":
    case "unsupported":
      return { icon: Mic, ariaLabel: label, label, isBusy: false };
  }
}

function resolveStatusMessage(activity: VoiceInputActivity): string | null {
  if (activity === "error") return COPY.statusError;
  if (activity === "recording") return COPY.statusRecording;
  return null;
}

function resolveVoiceInputView({
  state,
  transcript,
  label,
}: VoiceInputViewInput): VoiceInputView {
  const activity = resolveVoiceInputActivity(state);

  return {
    activity,
    trigger: resolveTrigger(state, label),
    statusMessage: resolveStatusMessage(activity),
    hasTranscript: activity !== "recording" && transcript.trim() !== "",
  };
}

export function VoiceInputButton({
  state,
  transcript,
  label,
  onToggle,
  onUseTranscript,
  onDiscard,
}: VoiceInputButtonProps) {
  const view = resolveVoiceInputView({ state, transcript, label });
  const isRecording = view.activity === "recording";
  const TriggerIcon = view.trigger.icon;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={isRecording ? "destructive" : "default"}
        onClick={onToggle}
        aria-label={view.trigger.ariaLabel}
        aria-pressed={isRecording}
        className="h-12 w-full gap-2 text-base"
      >
        <TriggerIcon className="size-4" aria-hidden="true" />
        {view.trigger.label}
        {view.trigger.isBusy && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
      </Button>

      {view.statusMessage && (
        <p
          role="status"
          aria-live="polite"
          className="text-center text-sm text-muted-foreground"
        >
          {view.statusMessage}
        </p>
      )}

      {view.hasTranscript && (
        <VoiceTranscriptActions
          transcript={transcript}
          onUse={onUseTranscript}
          onDiscard={onDiscard}
        />
      )}
    </div>
  );
}
