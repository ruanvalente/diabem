import type { DataContext } from "../../data-context";
import type {
  LocalIntelligenceExplanation,
  LocalIntelligenceProvenance,
} from "../intelligence-result";

export type ProvenanceAnalysis = {
  provenance: LocalIntelligenceProvenance;
  explanation: LocalIntelligenceExplanation;
};

/**
 * Aggregates provenance by source so the consumer can distinguish manual
 * records from imported/device records without seeing any record internals.
 * The original provenance is never altered.
 */
export function analyzeProvenance(context: DataContext): ProvenanceAnalysis {
  const provenance = context.provenance;

  if (!provenance) {
    const result: LocalIntelligenceProvenance = {
      bySource: {},
      knownSourceRate: 0,
      unknownSourceCount: 0,
      totalRecords: 0,
      notRequested: true,
    };

    const explanation: LocalIntelligenceExplanation = {
      rule: "provenance.source",
      description: "Origem dos registros não foi solicitada no contexto.",
      data: ["seção provenance não incluída"],
    };

    return { provenance: result, explanation };
  }

  const bySource: Record<string, number> = {};
  for (const { source, count } of provenance.bySource) {
    bySource[source] = count;
  }

  const result: LocalIntelligenceProvenance = {
    bySource,
    knownSourceRate: provenance.knownSourceRate,
    unknownSourceCount: provenance.unknownSourceCount,
    totalRecords: provenance.totalRecords,
    notRequested: false,
  };

  const explanation: LocalIntelligenceExplanation = {
    rule: "provenance.source",
    description: "Distribuição dos registros por origem.",
    data: [
      ...Object.entries(bySource).map(
        ([source, count]) => `${source}: ${count}`
      ),
      provenance.unknownSourceCount > 0
        ? `${provenance.unknownSourceCount} registros sem origem conhecida`
        : "todos os registros possuem origem conhecida",
    ],
  };

  return { provenance: result, explanation };
}