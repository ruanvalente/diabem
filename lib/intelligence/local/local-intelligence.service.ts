import type { DataContext } from "../data-context";
import type { LocalIntelligenceResult } from "./intelligence-result";
import { LOCAL_INTELLIGENCE_VERSION } from "./intelligence-result";
import { analyzeRecords } from "./analyzers/records.analyzer";
import { analyzeCoverage } from "./analyzers/coverage.analyzer";
import { analyzeQuality } from "./analyzers/quality.analyzer";
import { analyzeProvenance } from "./analyzers/provenance.analyzer";

/**
 * First deterministic layer of local intelligence. It consumes a `DataContext`
 * — never repositories, IndexedDB or auth — and produces a structural summary
 * (counts, coverage, quality, provenance) with traceable origins.
 *
 * It is fully local and synchronous-friendly: no LLM, no network, no external
 * calls, and no medical interpretation.
 */
export async function analyzeLocalIntelligence(
  context: DataContext
): Promise<LocalIntelligenceResult> {
  const records = analyzeRecords(context);
  const coverage = analyzeCoverage(context);
  const quality = analyzeQuality(context);
  const provenance = analyzeProvenance(context);

  return {
    version: LOCAL_INTELLIGENCE_VERSION,
    generatedAt: new Date().toISOString(),
    period: context.period,
    summary: records.summary,
    dataQuality: quality.dataQuality,
    coverage: coverage.coverage,
    provenance: provenance.provenance,
    explanations: [
      records.explanation,
      coverage.explanation,
      quality.explanation,
      provenance.explanation,
    ],
  };
}

export const localIntelligenceService = {
  analyze: analyzeLocalIntelligence,
};