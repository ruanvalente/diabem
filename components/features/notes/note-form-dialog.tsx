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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { noteSchema } from "@/lib/db/schema";
import type { Note } from "@/lib/db/types";
import type {
  SaveNoteInput,
  ServiceResult,
  UpdateNoteInput,
} from "@/lib/health/types";
import { Loader2, Pencil } from "lucide-react";

type NoteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: Note | null;
  onUpdate: (
    id: string,
    input: UpdateNoteInput
  ) => Promise<ServiceResult<Note>>;
};

export function NoteFormDialog({
  open,
  onOpenChange,
  record = null,
  onUpdate,
}: NoteFormDialogProps) {
  // State is seeded during mount; the page remounts this dialog (via `key`)
  // every time it is opened so the form always starts fresh.
  const [content, setContent] = useState(record?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!record) return;
    const validation = noteSchema.safeParse({ content });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setIsSubmitting(true);
    const result = await onUpdate(record.id, {
      content: validation.data.content,
    } satisfies SaveNoteInput);
    setIsSubmitting(false);

    if (result.ok) {
      toast.add({ title: "Observação atualizada com sucesso.", type: "success" });
      onOpenChange(false);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar observação</DialogTitle>
          <DialogDescription>
            Atualize o conteúdo da observação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="note-edit-content"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Conteúdo
            </label>
            <Textarea
              id="note-edit-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "note-edit-content-error" : undefined}
              className="bg-muted/50"
            />
          </div>
          {error && (
            <p id="note-edit-content-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => void handleSubmit()}
            disabled={content.trim() === "" || isSubmitting}
            className="h-12 w-full text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span className="sr-only">Salvando...</span>
              </>
            ) : (
              <Pencil className="size-4" />
            )}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}