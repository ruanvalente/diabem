import type { Activity, GlucoseReading, Meal, Note } from "@/lib/db/types";
import type { AnalysisPeriod } from "./analytics.types";
import type { Insight } from "./insight.types";
import type { Pattern } from "./rule.types";
import type { IntelligenceAnalytics } from "./analytics.types";

export type IntelligenceRequest = {
  type: "analyze";
  requestId: string;
  payload: {
    glucose: GlucoseReading[];
    meals: Meal[];
    activities: Activity[];
    notes: Note[];
    period: AnalysisPeriod;
  };
};

export type IntelligenceSuccessResponse = {
  type: "success";
  requestId: string;
  payload: IntelligenceResult;
};

export type IntelligenceErrorResponse = {
  type: "error";
  requestId: string;
  error: {
    code: string;
    message: string;
  };
};

export type IntelligenceResponse =
  | IntelligenceSuccessResponse
  | IntelligenceErrorResponse;

export type IntelligenceResult = {
  period: AnalysisPeriod;
  analytics: IntelligenceAnalytics;
  patterns: Pattern[];
  insights: Insight[];
};
