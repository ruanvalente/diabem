"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { GlucoseList } from "@/components/features/glucose/glucose-list";
import { GlucoseFormDialog } from "@/components/features/glucose/glucose-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { GLUCOSE_CONTEXT_LABELS, GLUCOSE_CONTEXT_ORDER } from "@/lib/health/constants";
import { resolvePeriodRange, type PeriodFilter as PeriodFilterValue } from "@/lib/date";
import { toast } from "@/components/ui/toast";
import type { GlucoseReading } from "@/lib/db/types";
import type { SaveGlucoseInput } from "@/lib/health/types";
import { Droplets, Plus } from "lucide-react";
import { GlucosePageHeader } from "../ui/glucose-page-header.ui";

export function GlucoseWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodFilterValue>("week");
  const [context, setContext] = useState<GlucoseReading["context"] | undefined>(
    undefined
  );

  const baseFilter = useMemo(() => resolvePeriodRange(period), [period]);

  const glucose = useGlucose(userId, baseFilter);
  const {
    records,
    isLoading,
    error,
    reload,
    applyFilters,
    create,
    update,
    remove,
  } = glucose;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GlucoseReading | null>(
    null
  );
  const [deletingRecord, setDeletingRecord] = useState<GlucoseReading | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePeriodChange = (next: PeriodFilterValue) => {
    setPeriod(next);
    void applyFilters({ ...resolvePeriodRange(next), context });
  };

  const handleContextChange = (next: GlucoseReading["context"] | undefined) => {
    setContext(next);
    void applyFilters({ ...baseFilter, context: next });
  };

  const openCreate = () => {
    setEditingRecord(null);
    setIsDialogOpen(true);
  };

  const openEdit = (record: GlucoseReading) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleSubmit = useCallback(
    async (input: SaveGlucoseInput, record?: GlucoseReading) => {
      return record ? update(record.id, input) : create(input);
    },
    [create, update]
  );

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    const result = await remove(deletingRecord.id);
    setIsDeleting(false);
    if (result.ok) {
      toast.add({ title: "Registro excluído.", type: "success" });
      setDeletingRecord(null);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  const contextOptions = GLUCOSE_CONTEXT_ORDER.map((value) => ({
    value,
    label: GLUCOSE_CONTEXT_LABELS[value],
  }));

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <GlucosePageHeader
        title="Glicemia"
        description="Seus registros de glicose"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Registrar
          </Button>
        }
        contextOptions={contextOptions}
        contextValue={context ?? null}
        onContextChange={handleContextChange}
        periodValue={period}
        onPeriodChange={handlePeriodChange}
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <GlucoseList
          records={records}
          onEdit={openEdit}
          onRequestDelete={setDeletingRecord}
          emptyState={
            <EmptyState
              icon={Droplets}
              title="Ainda não há medições neste período"
              description="Registre sua primeira glicemia para começar a acompanhar."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Registrar primeira glicemia
                </Button>
              }
            />
          }
        />
      )}

      <GlucoseFormDialog
        key={`${isDialogOpen ? "open" : "closed"}-${editingRecord?.id ?? "new"}`}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        record={editingRecord}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={!!deletingRecord}
        onOpenChange={(open) => {
          if (!open) setDeletingRecord(null);
        }}
        title="Excluir registro?"
        description="Esta ação não pode ser desfeita. Seus dados serão removidos deste dispositivo."
        isPending={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
