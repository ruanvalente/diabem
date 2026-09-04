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
import { getGlucoseRangeInfo } from "@/lib/health/glucose-range";
import { GLUCOSE_CONTEXT_LABELS, GLUCOSE_CONTEXT_ORDER } from "@/lib/health/constants";
import { glucoseReadingSchema } from "@/lib/db/schema";
import { toDateTimeLocalValue } from "@/lib/date";
import { speechRecognitionSupported } from "@/lib/browser/capabilities/speech-recognition";
import { VoiceInputButton } from "@/components/features/voice-input/ui/voice-input-button.ui";
import type { GlucoseReading } from "@/lib/db/types";
import type { SaveGlucoseInput, ServiceResult } from "@/lib/health/types";
import { Loader2, Droplets, Pencil } from "lucide-react";

const MESSAGES = {
  save: "Glicemia registrada com sucesso.",
  update: "Glicemia atualizada com sucesso.",
};

type GlucoseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: GlucoseReading | null;
  onSubmit: (
    input: SaveGlucoseInput,
    record?: GlucoseReading
  ) => Promise<ServiceResult<GlucoseReading>>;
};

export function GlucoseFormDialog({
  open,
  onOpenChange,
  record = null,
  onSubmit,
}: GlucoseFormDialogProps) {
  const isEditing = !!record;

  // State is seeded during mount; the page remounts this dialog (via `key`)
  // every time it is opened so the form always starts fresh.
  const [value, setValue] = useState(() =>
    record ? String(record.value) : ""
  );
  const [context, setContext] = useState<GlucoseReading["context"] | undefined>(
    record?.context
  );
  const [measuredAtLocal, setMeasuredAtLocal] = useState(() =>
    record
      ? toDateTimeLocalValue(new Date(record.measuredAt))
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

  const numericValue = value === "" ? undefined : Number(value);
  const rangeInfo =
    numericValue !== undefined && !Number.isNaN(numericValue)
      ? getGlucoseRangeInfo(numericValue)
      : null;

  const handleSubmit = async () => {
    const validation = glucoseReadingSchema.safeParse({
      value: numericValue,
      context,
      measuredAt: measuredAtLocal,
      notes,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(
      {
        value: validation.data.value,
        context: validation.data.context,
        measuredAtLocal,
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

  const canSubmit =
    numericValue !== undefined &&
    context !== undefined &&
    measuredAtLocal !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar glicemia" : "Registrar glicemia"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da medição."
              : "Registre sua medição de glicose."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="glucose-value"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Valor da medição
            </label>
            <div className="relative">
              <Input
                id="glucose-value"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "glucose-value-error" : undefined}
                className="h-16 bg-muted/50 text-center text-3xl font-bold tracking-tight [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
                mg/dL
              </span>
            </div>
            {rangeInfo && (
              <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                {rangeInfo.label}
              </p>
            )}
          </div>

          <DateTimeInput
            id="glucose-measured-at"
            value={measuredAtLocal}
            onChange={setMeasuredAtLocal}
          />

          <div>
            <label
              id="glucose-context-label"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Contexto da medição
            </label>
            <OptionPills
              aria-labelledby="glucose-context-label"
              options={GLUCOSE_CONTEXT_ORDER.map((value) => ({
                value,
                label: GLUCOSE_CONTEXT_LABELS[value],
              }))}
              value={context ?? null}
              onChange={(next) => setContext(next)}
            />
          </div>

          <div>
            <label
              htmlFor="glucose-notes"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Observação (opcional)
            </label>
            <Textarea
              id="glucose-notes"
              placeholder="Ex: Após almoço leve"
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
            <p id="glucose-value-error" role="alert" className="text-sm text-destructive">
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
              <Droplets className="size-4" />
            )}
            {isEditing ? "Salvar alterações" : "Salvar registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}