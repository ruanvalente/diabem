import type {
  Activity,
  GlucoseReading,
  Meal,
  Note,
} from "../../db/types";

export type ExportFormat = "json" | "csv";

export type ExportScope = {
  glucose: boolean;
  meals: boolean;
  activities: boolean;
  notes: boolean;
};

export type ExportPeriodFilter = {
  from?: string;
  to?: string;
};

export type ExportOptions = {
  format: ExportFormat;
  scope: ExportScope;
  period?: ExportPeriodFilter;
};

/**
 * Public JSON export envelope. This is the contract exposed to users.
 * It intentionally does NOT mirror the internal IndexedDB schema.
 */
export type DiaBemExport = {
  version: number;
  application: string;
  exportedAt: string;
  exportScope?: ExportScope;
  period?: ExportPeriodFilter;
  data: {
    glucose: GlucoseExportRecord[];
    meals: MealExportRecord[];
    activities: ActivityExportRecord[];
    notes: NoteExportRecord[];
  };
};

/** Export record shape — strips internal userId and keeps user-facing fields. */
export type GlucoseExportRecord = Omit<GlucoseReading, "userId">;
export type MealExportRecord = Omit<Meal, "userId">;
export type ActivityExportRecord = Omit<Activity, "userId">;
export type NoteExportRecord = Omit<Note, "userId">;

export const CURRENT_EXPORT_VERSION = 1;
export const APPLICATION_NAME = "DiaBem";
