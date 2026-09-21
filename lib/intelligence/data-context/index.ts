export type {
  DataContext,
  DataContextIncludeOptions,
  DataContextOptions,
  DataContextPeriod,
  DataContextProvenanceSummary,
  DataContextRecord,
  DataContextRecords,
  DataContextResult,
  DataSourceCount,
  NormalizedActivityRecord,
  NormalizedGlucoseRecord,
  NormalizedMealRecord,
  NormalizedMedicationRecord,
  NormalizedNoteRecord,
} from "./data-context.types";
export type { DataContextSelection, DataRecordKind } from "./context-options";
export { DATA_CONTEXT_VERSION } from "./data-context.types";
export { dataContextService, getDataContext } from "./data-context.service";