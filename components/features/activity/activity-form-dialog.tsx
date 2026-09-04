"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OptionPills } from "@/components/shared/option-pills";
import { DateTimeInput } from "@/components/shared/date-time-input";
import { toast } from "@/components/ui/toast";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ORDER } from "@/lib/health/constants";
import { activitySchema } from "@/lib/db/schema";
import { toDateTimeLocalValue } from "@/lib/date";
import { speechRecognitionSupported } from "@/lib/browser/capabilities/speech-recognition";
import { VoiceInputButton } from "@/components/features/voice-input/ui/voice-input-button.ui";
import type { Activity } from "@/lib/db/types";
import type { SaveActivityInput, ServiceResult } from "@/lib/health/types";
import { Activity as ActivityIcon, Loader2, Pencil } from "lucide-react";

const MESSAGES = {
  save: "Atividade registrada com sucesso.",
  update: "Atividade atualizada com sucesso.",
};

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Activity | null;
  onSubmit: (
    input: SaveActivityInput,
    record?: Activity
  ) => Promise<ServiceResult<Activity>>;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  record = null,
  onSubmit,
}: ActivityFormDialogProps) {
  const isEditing = !!record;

  // State is seeded during mount; the page remounts this dialog (via `key`)
  // every time it is opened so the form always starts fresh.
  const [type, setType] = useState<Activity["type"] | undefined>(record?.type);
  const [duration, setDuration] = useState(
    record ? String(record.durationMinutes) : ""
  );
  const [startedAtLocal, setStartedAtLocal] = useState(() =>
    record
      ? toDateTimeLocalValue(new Date(record.startedAt))
      : toDateTimeLocalValue(new Date())
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotesTranscript = useCallback((text: string) => {
    setNotes((prev) => {
      if (prev.trim() === "") return text;
      return `${prev.trim()} ${text.trim()}`.trim();
    });
  }, []);

  const handleSubmit = async () => {
    const numericDuration = duration === "" ? undefined : Number(duration);
    const validation = activitySchema.safeParse({
      type,
      durationMinutes: numericDuration,
      startedAt: startedAtLocal,
      notes,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(
      {
        type: validation.data.type,
        durationMinutes: validation.data.durationMinutes,
        startedAtLocal,
        notes: validation.data.notes,
      },
      record ?? undefined
    );
    setIsSubmitting(false);

    if (result.ok) {
      toast.add({
        title: isEditing ? MESSAGES.update : MESSAGES.save,
        type: "success",
      });
      onOpenChange(false);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  const canSubmit = type !== undefined && duration !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar atividade" : "Registrar atividade"}
          </DialogTitle>
          <DialogDescription>
            Registre sua atividade física.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label
              id="activity-type-label"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Tipo de atividade
            </label>
            <OptionPills
              aria-labelledby="activity-type-label"
              options={ACTIVITY_TYPE_ORDER.map((value) => ({
                value,
                label: ACTIVITY_TYPE_LABELS[value],
              }))}
              value={type ?? null}
              onChange={setType}
            />
          </div>

          <DateTimeInput
            id="activity-started-at"
            value={startedAtLocal}
            onChange={setStartedAtLocal}
          />

          <div>
            <label
              htmlFor="activity-duration"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Duração
            </label>
            <div className="relative">
              <Input
                id="activity-duration"
                type="number"
                inputMode="numeric"
                placeholder="30"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "activity-duration-error" : undefined}
                className="h-12 bg-muted/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
                min
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="activity-notes"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Observação (opcional)
            </label>
            <Textarea
              id="activity-notes"
              placeholder="Ex: No parque com amigos"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="bg-muted/50"
            />
            {speechRecognitionSupported() && (
              <div className="mt-2">
                <VoiceInputButton
                  label="Falar observação"
                  onTranscript={handleNotesTranscript}
                />
              </div>
            )}
          </div>

          {error && (
            <p id="activity-duration-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="h-12 w-full text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span className="sr-only">Salvando...</span>
              </>
            ) : isEditing ? (
              <Pencil className="size-4" />
            ) : (
              <ActivityIcon className="size-4" />
            )}
            {isEditing ? "Salvar alterações" : "Salvar atividade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}