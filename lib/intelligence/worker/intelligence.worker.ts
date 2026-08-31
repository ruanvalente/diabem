import type { IntelligenceResponse, IntelligenceRequest } from "../types/worker.types";
import { computeIntelligenceAnalytics } from "../analytics/analytics-engine";
import { compareGlucosePeriods } from "../analytics/period-comparison";
import { evaluateAllRules } from "../rules/rule-engine";
import { generateInsights } from "../insights/insight-generator";
import type { IntelligenceResult } from "../types/worker.types";

function computeComparisons(
  glucose: IntelligenceRequest["payload"]["glucose"],
  period: IntelligenceRequest["payload"]["period"]
) {
  const periodStartMs = new Date(period.start).getTime();
  const periodLengthMs = new Date(period.end).getTime() - periodStartMs;
  const previousStartMs = periodStartMs - periodLengthMs;

  const current = glucose.filter((g) => {
    const t = new Date(g.measuredAt).getTime();
    return t >= periodStartMs && t < new Date(period.end).getTime();
  });

  const previous = glucose.filter((g) => {
    const t = new Date(g.measuredAt).getTime();
    return t >= previousStartMs && t < periodStartMs;
  });

  return compareGlucosePeriods(current, previous);
}

function analyze(request: IntelligenceRequest): IntelligenceResult {
  const { glucose, meals, activities, period } = request.payload;

  const comparisons = computeComparisons(glucose, period);

  const analytics = computeIntelligenceAnalytics(glucose, meals, activities, period);
  analytics.comparisons = comparisons;

  const patterns = evaluateAllRules({
    period,
    analytics,
    dataQuality: analytics.dataQuality,
  });

  const insights = generateInsights(patterns);

  return {
    period,
    analytics,
    patterns,
    insights,
  };
}

self.onmessage = (event: MessageEvent<IntelligenceRequest>) => {
  const request = event.data;

  if (request.type !== "analyze") {
    const errorResponse: IntelligenceResponse = {
      type: "error",
      requestId: request.requestId,
      error: { code: "UNSUPPORTED_REQUEST", message: "Tipo de requisição não suportado" },
    };
    self.postMessage(errorResponse);
    return;
  }

  try {
    const result = analyze(request);
    const response: IntelligenceResponse = {
      type: "success",
      requestId: request.requestId,
      payload: result,
    };
    self.postMessage(response);
  } catch (error) {
    const errorResponse: IntelligenceResponse = {
      type: "error",
      requestId: request.requestId,
      error: {
        code: "ANALYSIS_FAILED",
        message: error instanceof Error ? error.message : "Falha ao analisar os dados",
      },
    };
    self.postMessage(errorResponse);
  }
};
