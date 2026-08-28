"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { ActivityList } from "@/components/features/activity/activity-list";
import { ActivityFormDialog } from "@/components/features/activity/activity-form-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { OptionPills } from "@/components/shared/option-pills";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_ORDER } from "@/lib/health/constants";
import { resolvePeriodRange, type PeriodFilter as PeriodFilterValue } from "@/lib/date";
import { toast } from "@/components/ui/toast";
import type { Activity } from "@/lib/db/types";
import type { SaveActivityInput } from "@/lib/health/types";
import { Activity as ActivityIcon, Plus } from "lucide-react";

export default function ActivityPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodFilterValue>("week");
  const [type, setType] = useState<Activity["type"] | undefined>(undefined);

  const baseFilter = useMemo(() => resolvePeriodRange(period), [period]);

  const activities = useActivities(userId, baseFilter);
  const {
    records,
    isLoading,
    error,
    reload,
    applyFilters,
    create,
    update,
    remove,
  } = activities;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Activity | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePeriodChange = (next: PeriodFilterValue) => {
    setPeriod(next);
    void applyFilters({ ...resolvePeriodRange(next), type });
  };

  const handleTypeChange = (next: Activity["type"] | undefined) => {
    setType(next);
    void applyFilters({ ...baseFilter, type: next });
  };

  const openCreate = () => {
    setEditingRecord(null);
    setIsDialogOpen(true);
  };

  const openEdit = (record: Activity) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleSubmit = useCallback(
    async (input: SaveActivityInput, record?: Activity) => {
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
      toast.add({ title: "Atividade excluída.", type: "success" });
      setDeletingRecord(null);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  const emptyState = (
    <EmptyState
      icon={ActivityIcon}
      title="Ainda não há atividades neste período"
      description="Registre sua primeira atividade física para acompanhar sua rotina."
      action={
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Registrar primeira atividade
        </Button>
      }
    />
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <PageHeader
        title="Atividade física"
        description="Seus registros de atividade"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Registrar
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <OptionPills
          options={ACTIVITY_TYPE_ORDER.map((value) => ({
            value,
            label: ACTIVITY_TYPE_LABELS[value],
          }))}
          value={type ?? null}
          onChange={handleTypeChange}
        />
        <PeriodFilter value={period} onChange={handlePeriodChange} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <ActivityList
          records={records}
          onEdit={openEdit}
          onRequestDelete={setDeletingRecord}
          emptyState={emptyState}
        />
      )}

      <ActivityFormDialog
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
        title="Excluir atividade?"
        description="Esta ação não pode ser desfeita. Sua atividade será removida deste dispositivo."
        isPending={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}