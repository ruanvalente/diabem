"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useMedications } from "@/lib/health/hooks/use-medications";
import { MedicationList } from "@/components/features/medications/ui/medication-list.ui";
import { MedicationFormDialog } from "@/components/features/medications/widget/medication-form-dialog.widget";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { resolvePeriodRange, type PeriodFilter as PeriodFilterValue } from "@/lib/date";
import { toast } from "@/components/ui/toast";
import type { Medication } from "@/lib/db/types";
import type { SaveMedicationInput } from "@/lib/health/types";
import { Pill, Plus } from "lucide-react";
import { MedicationPageHeader } from "../ui/medication-page-header.ui";

export function MedicationWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodFilterValue>("week");

  const baseFilter = useMemo(() => resolvePeriodRange(period), [period]);

  const medications = useMedications(userId, baseFilter);
  const {
    records,
    isLoading,
    error,
    reload,
    applyFilters,
    create,
    update,
    remove,
  } = medications;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Medication | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Medication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePeriodChange = (next: PeriodFilterValue) => {
    setPeriod(next);
    void applyFilters({ ...resolvePeriodRange(next) });
  };

  const openCreate = () => {
    setEditingRecord(null);
    setIsDialogOpen(true);
  };

  const openEdit = (record: Medication) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleSubmit = useCallback(
    async (input: SaveMedicationInput, record?: Medication) => {
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
      toast.add({ title: "Medicamento excluído.", type: "success" });
      setDeletingRecord(null);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <MedicationPageHeader
        title="Medicamentos"
        description="Seus registros de medicação"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Registrar
          </Button>
        }
        periodValue={period}
        onPeriodChange={handlePeriodChange}
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <MedicationList
          records={records}
          onEdit={openEdit}
          onRequestDelete={setDeletingRecord}
          emptyState={
            <EmptyState
              icon={Pill}
              title="Ainda não há medicamentos neste período"
              description="Registre seu primeiro medicamento para acompanhar sua medicação."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Registrar primeiro medicamento
                </Button>
              }
            />
          }
        />
      )}

      <MedicationFormDialog
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
        title="Excluir medicamento?"
        description="Esta ação não pode ser desfeita. Seu medicamento será removido deste dispositivo."
        isPending={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}