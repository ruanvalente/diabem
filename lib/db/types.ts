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
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};