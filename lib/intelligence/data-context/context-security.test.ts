import { describe, expect, it } from "vitest";
import type { DataContext } from "./data-context.types";
import {
  filterRecordsByUser,
  stripInternalFields,
  stripInternalFieldsFromRecords,
  summarizeContextForLogging,
} from "./context-security";

const AT = "2026-09-02T08:00:00.000Z";

describe("context-security", () => {
  it("strips internal fields without mutating the original record", () => {
    const record = {
      id: "g1",
      userId: "u",
      value: 110,
      sourceKey: "dev|dedupe",
      createdAt: AT,
      updatedAt: AT,
    };

    const cleaned = stripInternalFields(record);

    expect(cleaned).toEqual({ id: "g1", value: 110 });
    expect(record).toHaveProperty("userId");
    expect(record).toHaveProperty("createdAt");
  });

  it("strips internal fields from a list of records", () => {
    const records = [
      { id: "g1", userId: "u", value: 110, createdAt: AT },
      { id: "g2", userId: "u", value: 120, passwordHash: "hash" },
    ];

    const cleaned = stripInternalFieldsFromRecords(records);

    expect(cleaned[0]).toEqual({ id: "g1", value: 110 });
    expect(cleaned[1]).toEqual({ id: "g2", value: 120 });
    expect(cleaned[1]).not.toHaveProperty("passwordHash");
  });

  it("keeps only the records belonging to the given user", () => {
    const records = [
      { userId: "u", id: "g1" },
      { userId: "other", id: "g2" },
      { userId: "u", id: "g3" },
    ];

    expect(filterRecordsByUser(records, "u").map((r) => r.id)).toEqual([
      "g1",
      "g3",
    ]);
  });

  it("summarizes a context for logging without health values or free text", () => {
    const context: DataContext = {
      contextVersion: 1,
      generatedAt: AT,
      period: { start: "2026-09-01T00:00:00.000Z", end: AT },
      records: {
        glucose: [
          {
            kind: "glucose",
            id: "g1",
            value: 110,
            context: "fasting",
            measuredAt: AT,
          },
        ],
        meals: [],
        activities: [],
        medications: [],
        notes: [
          {
            kind: "note",
            id: "n1",
            content: "texto medical sensível",
            createdAt: AT,
          },
        ],
      },
    };

    const summary = summarizeContextForLogging(context);

    expect(summary.recordCounts).toEqual({
      glucose: 1,
      meals: 0,
      activities: 0,
      medications: 0,
      notes: 1,
    });
    expect(JSON.stringify(summary)).not.toContain("110");
    expect(JSON.stringify(summary)).not.toContain("texto medical");
    expect(summary.derivedSections).toEqual([]);
  });
});