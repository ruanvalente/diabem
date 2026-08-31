import type { PatternEvidence } from "./rule.types";

export type InsightType = "observation" | "insufficient_data";

export type InsightPriority = "low" | "medium";

export type Insight = {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  evidence: PatternEvidence[];
  generatedAt: string;
};
