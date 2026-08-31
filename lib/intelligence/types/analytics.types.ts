export type AnalysisPeriod = {
  start: string;
  end: string;
};

export type BasicStats = {
  count: number;
  average?: number;
  median?: number;
  minimum?: number;
  maximum?: number;
  standardDeviation?: number;
};

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type TimeSlotStats = {
  period: TimeOfDay;
  count: number;
  average?: number;
  minimum?: number;
  maximum?: number;
};

export type GlucoseAnalytics = {
  stats: BasicStats;
  byTimeOfDay: TimeSlotStats[];
};

export type MealAnalytics = {
  totalCount: number;
  byType: { type: string; count: number }[];
};

export type ActivityAnalytics = {
  totalCount: number;
  totalMinutes: number;
  byType: { type: string; count: number; totalMinutes: number }[];
};

export type TrendDirection =
  | "increasing"
  | "decreasing"
  | "stable"
  | "insufficient_data";

export type Trend = {
  direction: TrendDirection;
  confidence?: number;
};

export type Variability = {
  standardDeviation?: number;
  range?: number;
  coefficientOfVariation?: number;
};

export type PeriodComparison = {
  current: number;
  previous: number;
  absoluteDifference: number;
  percentageDifference?: number;
};

export type PeriodComparisonResult = {
  average?: PeriodComparison;
  count?: PeriodComparison;
  minimum?: PeriodComparison;
  maximum?: PeriodComparison;
  totalMinutes?: PeriodComparison;
};

export type MealGlucoseRelation = {
  mealId: string;
  glucoseBefore?: { id: string; value: number; measuredAt: string };
  glucoseAfter?: { id: string; value: number; measuredAt: string };
  timeDifferenceMinutes?: number;
};

export type ActivityGlucoseRelation = {
  activityId: string;
  glucoseBefore?: { id: string; value: number; measuredAt: string };
  glucoseAfter?: { id: string; value: number; measuredAt: string };
  timeDifferenceMinutes?: number;
};

export type DataQuality = {
  totalRecords: number;
  missingValues: number;
  duplicatedRecords: number;
  periodCoverage: number;
  sufficientForAnalysis: boolean;
};

export type IntelligenceAnalytics = {
  period: AnalysisPeriod;
  dataQuality: DataQuality;
  glucose?: GlucoseAnalytics;
  meals?: MealAnalytics;
  activities?: ActivityAnalytics;
  comparisons?: PeriodComparisonResult;
  glucoseTrend?: Trend;
  glucoseVariability?: Variability;
  mealGlucoseRelations: MealGlucoseRelation[];
  activityGlucoseRelations: ActivityGlucoseRelation[];
};

export type DatasetVersion = {
  userId: string;
  version: number;
  updatedAt: string;
};
