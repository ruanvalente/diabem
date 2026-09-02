"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { noteSchema } from "@/lib/db/schema";
import type { SaveNoteInput, ServiceResult } from "@/lib/health/types";
import { Loader2, StickyNote } from "lucide-react";

type NoteComposerProps = {
  onCreate: (input: SaveNoteInput) => Promise<ServiceResult<unknown>>;
};

export function NoteComposer({ onCreate }: NoteComposerProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSave = content.trim() !== "";

  const handleSave = async () => {
    const validation = noteSchema.safeParse({ content });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setIsSubmitting(true);
    const result = await onCreate({ content: validation.data.content });
    setIsSubmitting(false);

    if (result.ok) {
      setContent("");
      setError(null);
      toast.add({ title: "Observação salva neste dispositivo.", type: "success" });
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  return (
    <section
      aria-label="Nova observação"
      className="rounded-xl border border-border bg-card p-4"
    >
      <label
        htmlFor="note-content"
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        Nova observação
      </label>
      <Textarea
        id="note-content"
        placeholder="Escreva aqui suas observações…"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? "note-content-error" : undefined}
        className="bg-muted/50"
      />
      {error && (
        <p id="note-content-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        onClick={() => void handleSave()}
        disabled={!canSave || isSubmitting}
        className="mt-3 h-12 w-full text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Salvando...</span>
          </>
        ) : (
          <StickyNote className="size-4" />
        )}
        Salvar observação
      </Button>
    </section>
  );
}