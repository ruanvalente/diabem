import type { DataContext } from "../../data-context";
import type {
  LocalIntelligenceExplanation,
  LocalIntelligenceQuality,
} from "../intelligence-result";

export type QualityAnalysis = {
  dataQuality: LocalIntelligenceQuality;
  explanation: LocalIntelligenceExplanation;
};

/**
 * Mirrors the data quality level into the local intelligence result. When the
 * context did not request quality data, the level is `not_requested` instead of
 * guessing a value — a consumer must not infer quality from absence.
 */
export function analyzeQuality(context: DataContext): QualityAnalysis {
  const quality = context.quality;

  if (!quality) {
    const dataQuality: LocalIntelligenceQuality = {
      level: "not_requested",
      issueCount: 0,
      issueCodes: [],
    };

    const explanation: LocalIntelligenceExplanation = {
      rule: "quality.level",
      description: "Qualidade dos dados não foi solicitada no contexto.",
      data: ["seção quality não incluída"],
    };

    return { dataQuality, explanation };
  }

  const issueCodes = [...new Set(quality.issues.map((issue) => issue.code))];

  const dataQuality: LocalIntelligenceQuality = {
    level: quality.level,
    issueCount: quality.issues.length,
    issueCodes,
  };

  const explanation: LocalIntelligenceExplanation = {
    rule: "quality.level",
    description: "Nível de qualidade dos dados do período.",
    data: [
      `nível: ${quality.level}`,
      `${quality.issues.length} problemas de qualidade`,
    ],
  };

  return { dataQuality, explanation };
}