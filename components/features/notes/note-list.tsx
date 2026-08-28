"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { groupByLocalDay, formatTime } from "@/lib/date";
import type { Note } from "@/lib/db/types";
import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

type NoteListProps = {
  records: Note[];
  onEdit: (record: Note) => void;
  onRequestDelete: (record: Note) => void;
  emptyState?: ReactNode;
};

export function NoteList({
  records,
  onEdit,
  onRequestDelete,
  emptyState,
}: NoteListProps) {
  if (records.length === 0 && emptyState) return <>{emptyState}</>;

  const groups = groupByLocalDay(records, (record) => record.createdAt);

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
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line text-sm text-foreground">
                      {record.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(record.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Editar observação"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir observação"
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