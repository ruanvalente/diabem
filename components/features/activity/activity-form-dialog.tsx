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
import { ACTIVITY_TYPE_OPTIONS } from "@/lib/health/constants";
import { activitySchema } from "@/lib/db/schema";
import { toDateTimeLocalValue } from "@/lib/date";
import { VoiceInputWidget } from "@/components/features/voice-input/widget/voice-input.widget";
import type { Activity } from "@/lib/db/types";
import type { SaveActivityInput, ServiceResult } from "@/lib/health/types";
import { Activity as ActivityIcon, Loader2, Pencil } from "lucide-react";

const MESSAGES = {
  save: "Atividade registrada com sucesso.",
  update: "Atividade atualizada com sucesso.",
};

type FieldError = {
  field: "type" | "duration" | "startedAt" | "notes";
  message: string;
};

const ERROR_ID_BY_FIELD: Record<FieldError["field"], string> = {
  type: "activity-type-error",
  duration: "activity-duration-error",
  startedAt: "activity-started-at-error",
  notes: "activity-notes-error",
};

/**
 * Maps the first zod issue of an activity validation to the form field that
 * should display the error. Unknown paths fall back to the duration field.
 */
function toFieldError(
  path: readonly PropertyKey[] | undefined,
  message: string,
): FieldError {
  switch (path?.[0]) {
    case "type":
      return { field: "type", message };
    case "startedAt":
      return { field: "startedAt", message };
    case "notes":
      return { field: "notes", message };
    case "durationMinutes":
      return { field: "duration", message };
    default:
      return { field: "duration", message };
  }
}

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Activity | null;
  onSubmit: (
    input: SaveActivityInput,
    record?: Activity,
  ) => Promise<ServiceResult<Activity>>;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  record = null,
  onSubmit,
}: ActivityFormDialogProps) {
  const isEditing = !!record;

  const [type, setType] = useState<Activity["type"] | undefined>(record?.type);
  const [duration, setDuration] = useState(
    record ? String(record.durationMinutes) : "",
  );
  const [startedAtLocal, setStartedAtLocal] = useState(() =>
    record
      ? toDateTimeLocalValue(new Date(record.startedAt))
      : toDateTimeLocalValue(new Date()),
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [error, setError] = useState<FieldError | null>(null);
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
      const issue = validation.error.issues[0];
      setError(
        toFieldError(issue?.path, issue?.message ?? "Dados inválidos"),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(
        {
          type: validation.data.type,
          durationMinutes: validation.data.durationMinutes,
          startedAtLocal,
          notes: validation.data.notes,
        },
        record ?? undefined,
      );

      if (result.ok) {
        toast.add({
          title: isEditing ? MESSAGES.update : MESSAGES.save,
          type: "success",
        });
        onOpenChange(false);
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    } finally {
      setIsSubmitting(false);
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
          <DialogDescription>Registre sua atividade física.</DialogDescription>
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
              options={ACTIVITY_TYPE_OPTIONS}
              value={type ?? null}
              onChange={setType}
            />
          </div>

          <DateTimeInput
            id="activity-started-at"
            value={startedAtLocal}
            onChange={setStartedAtLocal}
            aria-invalid={error?.field === "startedAt" || undefined}
            aria-describedby={
              error?.field === "startedAt"
                ? ERROR_ID_BY_FIELD.startedAt
                : undefined
            }
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
                aria-invalid={error?.field === "duration" || undefined}
                aria-describedby={
                  error?.field === "duration"
                    ? ERROR_ID_BY_FIELD.duration
                    : undefined
                }
                className="h-12 bg-muted/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                aria-hidden="true"
              >
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
              aria-invalid={error?.field === "notes" || undefined}
              aria-describedby={
                error?.field === "notes"
                  ? ERROR_ID_BY_FIELD.notes
                  : undefined
              }
              className="my-2 lg:my-4 bg-muted/50"
            />
            <VoiceInputWidget
              label="Falar observação"
              onTranscript={handleNotesTranscript}
            />
          </div>

          {error && (
            <p
              id={ERROR_ID_BY_FIELD[error.field]}
              role="alert"
              className="text-sm text-destructive"
            >
              {error.message}
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
