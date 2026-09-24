"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { NoteList } from "../ui/note-list.ui";
import { NoteFormDialog } from "./note-form-dialog.widget";
import { NoteComposer } from "./note-composer.widget";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { resolvePeriodRange, type PeriodFilter as PeriodFilterValue } from "@/lib/date";
import { toast } from "@/components/ui/toast";
import type { Note } from "@/lib/db/types";
import { NotebookPen } from "lucide-react";
import { NotesPageHeader } from "../ui/notes-page-header.ui";

export function NotesWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodFilterValue>("all");

  const {
    records,
    isLoading,
    error,
    reload,
    applyFilters,
    create,
    update,
    remove,
  } = useNotes(userId);

  const [editingRecord, setEditingRecord] = useState<Note | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePeriodChange = (next: PeriodFilterValue) => {
    setPeriod(next);
    void applyFilters(resolvePeriodRange(next));
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    const result = await remove(deletingRecord.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.add({ title: "Observação excluída.", type: "success" });
      setDeletingRecord(null);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <NotesPageHeader
        periodValue={period}
        onPeriodChange={handlePeriodChange}
      />

      <NoteComposer onCreate={create} />

      <div className="mt-6">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void reload()} />
        ) : (
          <NoteList
            records={records}
            onEdit={setEditingRecord}
            onRequestDelete={setDeletingRecord}
            emptyState={
              <EmptyState
                icon={NotebookPen}
                title="Nenhuma observação por aqui"
                description="Use o campo acima para registrar observações rápidas do seu dia."
              />
            }
          />
        )}
      </div>

      <NoteFormDialog
        key={editingRecord?.id ?? "new"}
        open={!!editingRecord}
        onOpenChange={(open) => {
          if (!open) setEditingRecord(null);
        }}
        record={editingRecord}
        onUpdate={update}
      />

      <ConfirmDeleteDialog
        open={!!deletingRecord}
        onOpenChange={(open) => {
          if (!open) setDeletingRecord(null);
        }}
        title="Excluir observação?"
        description="Esta ação não pode ser desfeita. Sua observação será removida deste dispositivo."
        isPending={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
