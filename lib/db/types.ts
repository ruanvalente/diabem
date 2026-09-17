export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  /** Per-user random salt for data-at-rest encryption key derivation. */
  keySalt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalSession = {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt?: string;
};

export type GlucoseContext =
  | "fasting"
  | "before_meal"
  | "after_meal"
  | "bedtime"
  | "other";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type ActivityType =
  | "walking"
  | "running"
  | "cycling"
  | "gym"
  | "stretching"
  | "swimming"
  | "other";

/**
 * Origin of a data record — answers "Where did this data come from?"
 * Used for Data Provenance (Sprint 11, plan §2).
 */
export type DataSource =
  | "manual"
  | "import"
  | "device"
  | "camera"
  | "speech"
  | "system";

/**
 * Provenance metadata attached to records. Non-sensitive — stored plaintext
 * (consistent with sourceKey / syncHistory precedent).
 */
export type DataProvenance = {
  source: DataSource;
  sourceId?: string;
  importedAt?: string;
  recordedAt: string;
};

/**
 * A single glucose measurement. All values are persisted in ISO 8601 UTC and
 * rendered in the user's own timezone.
 */
export type GlucoseReading = {
  id: string;
  userId: string;
  value: number;
  unit: "mg/dL";
  context: GlucoseContext;
  measuredAt: string;
  notes?: string;
  /**
   * Stable dedup key for device-sourced readings (origin + timestamp + type +
   * value). Persisted at import so re-syncing the same device never creates
   * duplicates. Absent on readings imported via file (CSV/JSON).
   */
  sourceKey?: string;
  provenance?: DataProvenance;
  createdAt: string;
  updatedAt: string;
};

export type Meal = {
  id: string;
  userId: string;
  type: MealType;
  description: string;
  consumedAt: string;
  notes?: string;
  provenance?: DataProvenance;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  userId: string;
  type: ActivityType;
  durationMinutes: number;
  startedAt: string;
  notes?: string;
  provenance?: DataProvenance;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  userId: string;
  content: string;
  provenance?: DataProvenance;
  createdAt: string;
  updatedAt: string;
};

/**
 * A single medication intake record (Sprint 12). Follows the same lifecycle as
 * the other record types: user-scoped, timestamped, optional provenance.
 *
 * `dosage` is stored as the value the user typed (e.g. "500" or "10"); `unit`
 * ("mg", "ml", "unidades"), `frequency` ("2x ao dia") and `route` ("oral",
 * "subcutânea") are free-form. The app deliberately does NOT judge clinical
 * adequacy — it stores what the user informed.
 *
 * `medicatedAt` is persisted in ISO 8601 UTC and rendered in the user's own
 * timezone, matching `measuredAt`/`consumedAt`/`startedAt` on other records.
 */
export type Medication = {
  id: string;
  userId: string;
  name: string;
  dosage?: string;
  unit?: string;
  frequency?: string;
  route?: string;
  medicatedAt: string;
  notes?: string;
  provenance?: DataProvenance;
  createdAt: string;
  updatedAt: string;
};
