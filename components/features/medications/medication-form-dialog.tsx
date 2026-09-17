"use client";

import { useCallback, useState } from "react";
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
import { DateTimeInput } from "@/components/shared/date-time-input";
import { toast } from "@/components/ui/toast";
import { medicationSchema } from "@/lib/db/schema";
import { toDateTimeLocalValue } from "@/lib/date";
import { VoiceInputWidget } from "@/components/features/voice-input/widget/voice-input.widget";
import type { Medication } from "@/lib/db/types";
import type { SaveMedicationInput, ServiceResult } from "@/lib/health/types";
import { Loader2, Pencil, Pill } from "lucide-react";

const MESSAGES = {
  save: "Medicamento registrado com sucesso.",
  update: "Medicamento atualizado com sucesso.",
};

type MedicationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Medication | null;
  onSubmit: (
    input: SaveMedicationInput,
    record?: Medication,
  ) => Promise<ServiceResult<Medication>>;
};

export function MedicationFormDialog({
  open,
  onOpenChange,
  record = null,
  onSubmit,
}: MedicationFormDialogProps) {
  const isEditing = !!record;

  // State is seeded during mount; the page remounts this dialog (via `key`)
  // every time it is opened so the form always starts fresh.
  const [name, setName] = useState(record?.name ?? "");
  const [dosage, setDosage] = useState(record?.dosage ?? "");
  const [unit, setUnit] = useState(record?.unit ?? "");
  const [frequency, setFrequency] = useState(record?.frequency ?? "");
  const [route, setRoute] = useState(record?.route ?? "");
  const [medicatedAtLocal, setMedicatedAtLocal] = useState(() =>
    record
      ? toDateTimeLocalValue(new Date(record.medicatedAt))
      : toDateTimeLocalValue(new Date()),
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [speechUsed, setSpeechUsed] = useState(false);

  const handleNotesTranscript = useCallback((text: string) => {
    setSpeechUsed(true);
    setNotes((prev) => {
      if (prev.trim() === "") return text;
      return `${prev.trim()} ${text.trim()}`.trim();
    });
  }, []);

  const handleSubmit = async () => {
    const validation = medicationSchema.safeParse({
      name,
      dosage,
      unit,
      frequency,
      route,
      medicatedAt: medicatedAtLocal,
      notes,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(
      {
        name: validation.data.name,
        dosage: validation.data.dosage,
        unit: validation.data.unit,
        frequency: validation.data.frequency,
        route: validation.data.route,
        medicatedAtLocal,
        notes: validation.data.notes,
        provenanceSource: !isEditing && speechUsed ? "speech" : undefined,
      },
      record ?? undefined,
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

  const canSubmit = name.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar medicamento" : "Registrar medicamento"}
          </DialogTitle>
          <DialogDescription>
            Adicione informações sobre sua medicação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="medication-name"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Medicamento
            </label>
            <Input
              id="medication-name"
              placeholder="Ex: Metformina"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "medication-name-error" : undefined}
              className="h-12 bg-muted/50"
            />
          </div>

          <DateTimeInput
            id="medication-medicated-at"
            value={medicatedAtLocal}
            onChange={setMedicatedAtLocal}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="medication-dosage"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Dosagem (opcional)
              </label>
              <Input
                id="medication-dosage"
                placeholder="Ex: 500"
                inputMode="decimal"
                value={dosage}
                onChange={(event) => setDosage(event.target.value)}
                className="h-12 bg-muted/50"
              />
            </div>
            <div>
              <label
                htmlFor="medication-unit"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Unidade (opcional)
              </label>
              <Input
                id="medication-unit"
                placeholder="Ex: mg"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="h-12 bg-muted/50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="medication-frequency"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Frequência (opcional)
            </label>
            <Input
              id="medication-frequency"
              placeholder="Ex: 2x ao dia"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className="h-12 bg-muted/50"
            />
          </div>

          <div>
            <label
              htmlFor="medication-route"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Via de administração (opcional)
            </label>
            <Input
              id="medication-route"
              placeholder="Ex: oral"
              value={route}
              onChange={(event) => setRoute(event.target.value)}
              className="h-12 bg-muted/50"
            />
          </div>

          <div>
            <label
              htmlFor="medication-notes"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Observação (opcional)
            </label>
            <Textarea
              id="medication-notes"
              placeholder="Ex: Tomado após o café da manhã"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="my-2 lg:my-4 bg-muted/50"
            />
            <VoiceInputWidget
              label="Falar observação"
              onTranscript={handleNotesTranscript}
            />
          </div>

          {error && (
            <p
              id="medication-name-error"
              role="alert"
              className="text-sm text-destructive"
            >
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
              <Pill className="size-4" />
            )}
            {isEditing ? "Salvar alterações" : "Salvar medicamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}