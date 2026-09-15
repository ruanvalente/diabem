import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import {
  recordAudit,
  recordAuditAsync,
  listAuditEntries,
  listEntityAudit,
} from "./";

beforeEach(async () => {
  const db = getDatabase();
  await db.auditTrail.clear();
});

describe("audit trail", () => {
  it("records an entry scoped to a user without sensitive content", async () => {
    await recordAudit("record.created", "glucose", "user-a", "g-1");

    const entries = await listAuditEntries("user-a");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      userId: "user-a",
      action: "record.created",
      entity: "glucose",
      entityId: "g-1",
    });
    expect(entries[0].id).toBeTruthy();
    expect(entries[0].timestamp).toBeTruthy();
    expect(JSON.stringify(entries[0])).not.toContain("value");
  });

  it("does not leak entries from other users", async () => {
    await recordAudit("record.created", "activity", "user-a", "a-1");
    await recordAudit("record.created", "activity", "user-b", "a-2");

    const entries = await listAuditEntries("user-b");
    expect(entries).toHaveLength(1);
    expect(entries[0].userId).toBe("user-b");
  });

  it("lists the audit history for a single entity", async () => {
    await recordAudit("record.created", "meal", "user-a", "m-1");
    await recordAudit("record.updated", "meal", "user-a", "m-1");
    await recordAudit("record.created", "meal", "user-a", "m-2");

    const history = await listEntityAudit("user-a", "meal", "m-1");
    expect(history).toHaveLength(2);
    expect(new Set(history.map((e) => e.action))).toEqual(
      new Set(["record.created", "record.updated"])
    );
  });

  it("recordAuditAsync is fire-and-forget and still persists", async () => {
    recordAuditAsync("data.imported", "user", "user-a");
    // Give the background operation a chance to complete.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const entries = await listAuditEntries("user-a");
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("data.imported");
  });

  it("supports purging all entries for a user (data deletion)", async () => {
    await recordAudit("insight.generated", "insight", "user-a", "i-1");
    await recordAudit("insight.generated", "insight", "user-a", "i-2");
    const db = getDatabase();
    await db.auditTrail.where("userId").equals("user-a").delete();

    const entries = await listAuditEntries("user-a");
    expect(entries).toHaveLength(0);
  });
});