/**
 * Technical audit trail entry — answers "What happened?" without exposing
 * sensitive health content (plan §15, §18).
 *
 * Only stores entity identity and action type. No glucose values, meal
 * descriptions, or free-text notes are recorded here.
 */
export type AuditAction =
  | "record.created"
  | "record.updated"
  | "record.deleted"
  | "data.imported"
  | "data.exported"
  | "analytics.recalculated"
  | "insight.generated"
  | "user.data.deleted";

export type AuditEntity =
  | "glucose"
  | "meal"
  | "activity"
  | "note"
  | "analytics"
  | "insight"
  | "user"
  | "device";

export type AuditEntry = {
  id: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  timestamp: string;
};
