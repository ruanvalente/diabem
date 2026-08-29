"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { MealList } from "@/components/features/meals/meal-list";
import { MealFormDialog } from "@/components/features/meals/meal-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/health/constants";
import { resolvePeriodRange, type PeriodFilter as PeriodFilterValue } from "@/lib/date";
import { toast } from "@/components/ui/toast";
import type { Meal } from "@/lib/db/types";
import type { SaveMealInput } from "@/lib/health/types";
import { Apple, Plus } from "lucide-react";
import { MealPageHeader } from "../ui/meal-page-header.ui";

export function MealWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodFilterValue>("week");
  const [type, setType] = useState<Meal["type"] | undefined>(undefined);

  const baseFilter = useMemo(() => resolvePeriodRange(period), [period]);

  const meals = useMeals(userId, baseFilter);
  const {
    records,
    isLoading,
    error,
    reload,
    applyFilters,
    create,
    update,
    remove,
  } = meals;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Meal | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<Meal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePeriodChange = (next: PeriodFilterValue) => {
    setPeriod(next);
    void applyFilters({ ...resolvePeriodRange(next), type });
  };

  const handleTypeChange = (next: Meal["type"] | undefined) => {
    setType(next);
    void applyFilters({ ...baseFilter, type: next });
  };

  const openCreate = () => {
    setEditingRecord(null);
    setIsDialogOpen(true);
  };

  const openEdit = (record: Meal) => {
    setEditingRecord(record);
    setIsDialogOpen(true);
  };

  const handleSubmit = useCallback(
    async (input: SaveMealInput, record?: Meal) => {
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
      toast.add({ title: "Refeição excluída.", type: "success" });
      setDeletingRecord(null);
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  const typeOptions = MEAL_TYPE_ORDER.map((value) => ({
    value,
    label: MEAL_TYPE_LABELS[value],
  }));

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <MealPageHeader
        title="Refeições"
        description="Seus registros de alimentação"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Registrar
          </Button>
        }
        typeOptions={typeOptions}
        typeValue={type ?? null}
        onTypeChange={handleTypeChange}
        periodValue={period}
        onPeriodChange={handlePeriodChange}
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <MealList
          records={records}
          onEdit={openEdit}
          onRequestDelete={setDeletingRecord}
          emptyState={
            <EmptyState
              icon={Apple}
              title="Ainda não há refeições neste período"
              description="Registre sua primeira refeição para acompanhar sua alimentação."
              action={
                <Button onClick={openCreate}>
                  <Plus className="size-4" />
                  Registrar primeira refeição
                </Button>
              }
            />
          }
        />
      )}

      <MealFormDialog
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
        title="Excluir refeição?"
        description="Esta ação não pode ser desfeita. Sua refeição será removida deste dispositivo."
        isPending={isDeleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
