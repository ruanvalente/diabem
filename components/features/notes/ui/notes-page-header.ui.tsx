"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { NoteComposer } from "@/components/features/notes/note-composer";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { SaveNoteInput, ServiceResult } from "@/lib/health/types";

type NotesPageHeaderProps = {
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
  onCreate: (input: SaveNoteInput) => Promise<ServiceResult<unknown>>;
};

export function NotesPageHeader({
  periodValue,
  onPeriodChange,
  onCreate,
}: NotesPageHeaderProps) {
  return (
    <>
      <PageHeader
        title="Observações"
        description="Notas rápidas e livres"
        action={<PeriodFilter value={periodValue} onChange={onPeriodChange} />}
      />

      <NoteComposer onCreate={onCreate} />
    </>
  );
}
