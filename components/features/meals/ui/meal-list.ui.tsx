"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { groupByLocalDay, formatTime } from "@/lib/date";
import { MEAL_TYPE_LABELS } from "@/lib/health/constants";
import type { Meal } from "@/lib/db/types";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

type MealListProps = {
  records: Meal[];
  onEdit: (record: Meal) => void;
  onRequestDelete: (record: Meal) => void;
  emptyState?: ReactNode;
};

export function MealList({
  records,
  onEdit,
  onRequestDelete,
  emptyState,
}: MealListProps) {
  if (records.length === 0 && emptyState) return <>{emptyState}</>;

  const groups = groupByLocalDay(records, (record) => record.consumedAt);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.dayKey} aria-label={group.label}>
          <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="space-y-2.5">
            {group.items.map((record) => (
              <Card key={record.id} className="border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {MEAL_TYPE_LABELS[record.type]}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatTime(record.consumedAt)} · {record.description}
                      {record.notes ? ` · ${record.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar refeição"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir refeição"
                      onClick={() => onRequestDelete(record)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}