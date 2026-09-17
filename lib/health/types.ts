import type {
  Activity,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "../db/types";
import type { DataSource } from "../db/types";
import type { ActivityFilter } from "../db/repositories/activity.repository";
import type { GlucoseReadingFilter } from "../db/repositories/glucose.repository";
import type { MealFilter } from "../db/repositories/meal.repository";
import type { NoteFilter } from "../db/repositories/note.repository";
import type { MedicationFilter } from "../db/repositories/medication.repository";

export type {
  ActivityFilter,
  GlucoseReadingFilter,
  MealFilter,
  MedicationFilter,
  NoteFilter,
};

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SaveGlucoseInput = {
  value: number;
  context: GlucoseReading["context"];
  measuredAtLocal: string;
  notes?: string;
  provenanceSource?: DataSource;
};

export type SaveMealInput = {
  type: Meal["type"];
  description: string;
  consumedAtLocal: string;
  notes?: string;
  provenanceSource?: DataSource;
};

export type SaveActivityInput = {
  type: Activity["type"];
  durationMinutes: number;
  startedAtLocal: string;
  notes?: string;
  provenanceSource?: DataSource;
};

export type SaveNoteInput = {
  content: string;
  provenanceSource?: DataSource;
};

export type SaveMedicationInput = {
  name: string;
  dosage?: string;
  unit?: string;
  frequency?: string;
  route?: string;
  medicatedAtLocal: string;
  notes?: string;
  provenanceSource?: DataSource;
};

export type UpdateGlucoseInput = Partial<SaveGlucoseInput>;
export type UpdateMealInput = Partial<SaveMealInput>;
export type UpdateActivityInput = Partial<SaveActivityInput>;
export type UpdateNoteInput = Partial<SaveNoteInput>;
export type UpdateMedicationInput = Partial<SaveMedicationInput>;

export type TimelineEventType =
  | "glucose"
  | "meal"
  | "activity"
  | "note"
  | "medication";

export type TimelineEvent =
  | { type: "glucose"; id: string; at: string; data: GlucoseReading }
  | { type: "meal"; id: string; at: string; data: Meal }
  | { type: "activity"; id: string; at: string; data: Activity }
  | { type: "note"; id: string; at: string; data: Note }
  | { type: "medication"; id: string; at: string; data: Medication };

export type TimelineFilter = {
  from?: string;
  to?: string;

  type?: TimelineEventType;

  types?: TimelineEventType[];
};
