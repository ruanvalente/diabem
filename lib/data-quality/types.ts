export type DataQualityIssueCode =
  | "unknown_provenance"
  | "missing_value"
  | "future_timestamp"
  | "old_timestamp"
  | "invalid_timestamp"
  | "unknown_unit"
  | "missing_notes"
  | "missing_required_field";

export type DataQualityIssueSeverity = "warning" | "info";

export type DataQualityIssue = {
  code: DataQualityIssueCode;
  severity: DataQualityIssueSeverity;
  field: string;
  message: string;
};

export type DataQualityLevel = "high" | "medium" | "low" | "unknown";

export type DataQualityResult = {
  score: number;
  level: DataQualityLevel;
  issues: DataQualityIssue[];
};
