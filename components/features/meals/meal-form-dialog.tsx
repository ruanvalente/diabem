"use client";

import { useState } from "react";
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
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/health/constants";
import { mealSchema } from "@/lib/db/schema";
import { toDateTimeLocalValue } from "@/lib/date";
import type { Meal } from "@/lib/db/types";
import type { SaveMealInput, ServiceResult } from "@/lib/health/types";
import { Apple, Loader2, Pencil } from "lucide-react";

const MESSAGES = {
  save: "Refeição registrada com sucesso.",
  update: "Refeição atualizada com sucesso.",
};

type MealFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Meal | null;
  onSubmit: (
    input: SaveMealInput,
    record?: Meal
  ) => Promise<ServiceResult<Meal>>;
};

export function MealFormDialog({
  open,
  onOpenChange,
  record = null,
  onSubmit,
}: MealFormDialogProps) {
  const isEditing = !!record;

  // State is seeded during mount; the page remounts this dialog (via `key`)
  // every time it is opened so the form always starts fresh.
  const [type, setType] = useState<Meal["type"] | undefined>(record?.type);
  const [description, setDescription] = useState(
    record?.description ?? ""
  );
  const [consumedAtLocal, setConsumedAtLocal] = useState(() =>
    record
      ? toDateTimeLocalValue(new Date(record.consumedAt))
      : toDateTimeLocalValue(new Date())
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = mealSchema.safeParse({
      type,
      description,
      consumedAt: consumedAtLocal,
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
        description: validation.data.description,
        consumedAtLocal,
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

  const canSubmit = type !== undefined && description.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar refeição" : "Registrar refeição"}
          </DialogTitle>
          <DialogDescription>
            Adicione informações sobre sua refeição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Tipo de refeição
            </label>
            <OptionPills
              options={MEAL_TYPE_ORDER.map((value) => ({
                value,
                label: MEAL_TYPE_LABELS[value],
              }))}
              value={type ?? null}
              onChange={setType}
            />
          </div>

          <DateTimeInput
            id="meal-consumed-at"
            value={consumedAtLocal}
            onChange={setConsumedAtLocal}
          />

          <div>
            <label
              htmlFor="meal-description"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Descrição
            </label>
            <Input
              id="meal-description"
              placeholder="Ex: Arroz, feijão, frango e salada"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-12 bg-muted/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Observação (opcional)
            </label>
            <Textarea
              placeholder="Ex: Refeição leve"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="bg-muted/50"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="h-12 w-full text-base"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEditing ? (
              <Pencil className="size-4" />
            ) : (
              <Apple className="size-4" />
            )}
            {isEditing ? "Salvar alterações" : "Salvar refeição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}