import { auditRepository } from "./audit.repository";
import type {
  AuditAction,
  AuditEntity,
  AuditEntry,
} from "./audit.types";

/**
 * Records a non-sensitive audit event. Fire-and-forget — callers should
 * not await this in hot paths (plan §15).
 */
export async function recordAudit(
  action: AuditAction,
  entity: AuditEntity,
  userId: string,
  entityId?: string
): Promise<void> {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    userId,
    action,
    entity,
    entityId,
    timestamp: new Date().toISOString(),
  };
  await auditRepository.addEntry(entry);
}

/**
 * Convenience: fire-and-forget wrapper for use in service hot paths.
 * Records the audit entry without blocking the caller.
 */
export function recordAuditAsync(
  action: AuditAction,
  entity: AuditEntity,
  userId: string,
  entityId?: string
): void {
  recordAudit(action, entity, userId, entityId).catch(() => {
    // Audit failures must not break the main operation.
  });
}

export async function listAuditEntries(
  userId: string,
  limit?: number
): Promise<AuditEntry[]> {
  return auditRepository.listByUser(userId, limit);
}

export async function listEntityAudit(
  userId: string,
  entity: AuditEntity,
  entityId: string
): Promise<AuditEntry[]> {
  return auditRepository.listByEntity(userId, entity, entityId);
}
