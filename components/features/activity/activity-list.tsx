"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { groupByLocalDay, formatTime } from "@/lib/date";
import { ACTIVITY_TYPE_LABELS } from "@/lib/health/constants";
import type { Activity } from "@/lib/db/types";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

type ActivityListProps = {
  records: Activity[];
  onEdit: (record: Activity) => void;
  onRequestDelete: (record: Activity) => void;
  emptyState?: ReactNode;
};

export function ActivityList({
  records,
  onEdit,
  onRequestDelete,
  emptyState,
}: ActivityListProps) {
  if (records.length === 0 && emptyState) return <>{emptyState}</>;

  const groups = groupByLocalDay(records, (record) => record.startedAt);

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
                      {ACTIVITY_TYPE_LABELS[record.type]}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatTime(record.startedAt)} ·{" "}
                      {formatDuration(record.durationMinutes)}
                      {record.notes ? ` · ${record.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar atividade"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir atividade"
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