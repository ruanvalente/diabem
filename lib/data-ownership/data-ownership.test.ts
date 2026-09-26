import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import { glucoseRepository } from "../db/repositories/glucose.repository";
import { mealRepository } from "../db/repositories/meal.repository";
import { activityRepository } from "../db/repositories/activity.repository";
import { noteRepository } from "../db/repositories/note.repository";
import { medicationRepository } from "../db/repositories/medication.repository";
import { notificationScheduleRepository } from "../db/repositories/notification-schedule.repository";
import { exportAsJson, exportAsCsv } from "./export/exporter";
import { parseFileContent } from "./import/importer";
import { detectFileKind, validateFile } from "./import/validator";
import { parseJsonImport } from "./import/json-parser";
import { parseCsvImport } from "./import/csv-parser";
import { normalizeImportData } from "./import/normalizer";
import {
  deduplicateGlucose,
  deduplicateMeals,
  deduplicateActivities,
  deduplicateNotes,
  deduplicateMedications,
} from "./import/deduplicator";
import { dataOwnershipService } from "./data-ownership.service";
import { deleteUserHealthData } from "./delete-service";
import type { ExportOptions, DiaBemExport } from "./types/export.types";
import type { NormalizedImportData } from "./types/import.types";
import { CURRENT_EXPORT_VERSION, APPLICATION_NAME } from "./types/export.types";
import { canShare } from "./share/share.service";
import { setSessionDataKey, clearSessionDataKey } from "../db/session-key";
import { cryptoService } from "../crypto/crypto.service";
import type { DataEncryptionKey } from "../crypto/crypto.types";

const TEST_USER_ID = "test-user-data-ownership";

let encryptionKey: DataEncryptionKey;

beforeEach(async () => {
  const db = getDatabase();
  await db.transaction(
    "rw",
    [
      db.glucoseReadings,
      db.meals,
      db.activities,
      db.notes,
      db.medications,
      db.users,
      db.sessions,
      db.notificationSchedules,
      db.notificationPreferences,
    ],
    async () => {
      await Promise.all([
        db.glucoseReadings.where("userId").equals(TEST_USER_ID).delete(),
        db.meals.where("userId").equals(TEST_USER_ID).delete(),
        db.activities.where("userId").equals(TEST_USER_ID).delete(),
        db.notes.where("userId").equals(TEST_USER_ID).delete(),
        db.medications.where("userId").equals(TEST_USER_ID).delete(),
        db.notificationSchedules.clear(),
        db.notificationPreferences.clear(),
      ]);
    }
  );

  const result = await cryptoService.createUserKeys("test-password");
  if (!result.ok) throw new Error("key derivation failed");
  encryptionKey = result.data.dataKey;
  setSessionDataKey(encryptionKey);
});

async function seedGlucose(overrides?: { value?: number; context?: string; measuredAt?: string; notes?: string }[]) {
  const defaults = [
    { value: 120, context: "fasting" as const, measuredAt: "2026-09-01T08:00:00Z", notes: "Jejum normal" },
    { value: 180, context: "after_meal" as const, measuredAt: "2026-09-01T12:30:00Z", notes: "Almoço" },
    { value: 95, context: "bedtime" as const, measuredAt: "2026-09-01T22:00:00Z" },
  ];
  const items = overrides ?? defaults;
  for (const item of items) {
    await glucoseRepository.create({
      userId: TEST_USER_ID,
      value: item.value ?? 100,
      unit: "mg/dL",
      context: (item.context ?? "fasting") as "fasting",
      measuredAt: item.measuredAt ?? new Date().toISOString(),
      notes: item.notes,
    });
  }
}

async function seedMeals() {
  const items = [
    { type: "breakfast" as const, description: "Pão com ovo", consumedAt: "2026-09-01T07:30:00Z", notes: "Café da manhã" },
    { type: "lunch" as const, description: "Arroz, feijão e frango", consumedAt: "2026-09-01T12:00:00Z" },
  ];
  for (const item of items) {
    await mealRepository.create({
      userId: TEST_USER_ID,
      ...item,
    });
  }
}

async function seedActivities() {
  const items = [
    { type: "walking" as const, durationMinutes: 30, startedAt: "2026-09-01T06:00:00Z", notes: "Caminhada matinal" },
    { type: "cycling" as const, durationMinutes: 45, startedAt: "2026-09-01T17:00:00Z" },
  ];
  for (const item of items) {
    await activityRepository.create({
      userId: TEST_USER_ID,
      ...item,
    });
  }
}

async function seedNotes() {
  const items = [
    { content: "Me sentindo bem hoje", createdAt: "2026-09-01T08:00:00Z" },
    { content: "Dor de cabeça leve", createdAt: "2026-09-01T14:00:00Z" },
  ];
  for (const item of items) {
    await noteRepository.create({
      userId: TEST_USER_ID,
      ...item,
    });
  }
}

async function seedMedications() {
  const items = [
    {
      name: "Metformina",
      dosage: "500",
      unit: "mg",
      frequency: "2x ao dia",
      route: "oral",
      medicatedAt: "2026-09-01T08:00:00Z",
      notes: "Tomar com café",
    },
    {
      name: "Ibuprofeno",
      dosage: "200",
      medicatedAt: "2026-09-01T15:00:00Z",
    },
  ];
  for (const item of items) {
    await medicationRepository.create({
      userId: TEST_USER_ID,
      ...item,
    });
  }
}

async function seedAllData() {
  await seedGlucose();
  await seedMeals();
  await seedActivities();
  await seedNotes();
  await seedMedications();
}

describe("Data Ownership — Export", () => {
  describe("Empty database", () => {
    it("exports JSON with empty arrays when no data exists", async () => {
      const options: ExportOptions = {
        format: "json",
        scope: { medications: false, glucose: true, meals: true, activities: true, notes: true },
      };
      const file = await exportAsJson(TEST_USER_ID, options);
      const parsed = JSON.parse(file.content) as DiaBemExport;

      expect(parsed.version).toBe(CURRENT_EXPORT_VERSION);
      expect(parsed.application).toBe(APPLICATION_NAME);
      expect(parsed.data.glucose).toEqual([]);
      expect(parsed.data.meals).toEqual([]);
      expect(parsed.data.activities).toEqual([]);
      expect(parsed.data.notes).toEqual([]);
    });

    it("exports CSV with headers only when no data exists", async () => {
      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: true, meals: true, activities: true, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(1);
      expect(files[0].content).toContain("id,timestamp,value");
    });
  });

  describe("Small dataset", () => {
    beforeEach(async () => {
      await seedAllData();
    });

    it("exports all data as JSON with correct envelope", async () => {
      const options: ExportOptions = {
        format: "json",
        scope: { medications: true, glucose: true, meals: true, activities: true, notes: true },
      };
      const file = await exportAsJson(TEST_USER_ID, options);
      const parsed = JSON.parse(file.content) as DiaBemExport;

      expect(parsed.version).toBe(1);
      expect(parsed.application).toBe("DiaBem");
      expect(parsed.exportedAt).toBeTruthy();
      expect(parsed.data.glucose.length).toBe(3);
      expect(parsed.data.meals.length).toBe(2);
      expect(parsed.data.activities.length).toBe(2);
      expect(parsed.data.notes.length).toBe(2);
      expect(parsed.data.medications.length).toBe(2);
    });

    it("does not include userId in exported records", async () => {
      const options: ExportOptions = {
        format: "json",
        scope: { medications: true, glucose: true, meals: true, activities: true, notes: true },
      };
      const file = await exportAsJson(TEST_USER_ID, options);
      const parsed = JSON.parse(file.content) as DiaBemExport;

      for (const record of parsed.data.glucose) {
        expect(record).not.toHaveProperty("userId");
      }
      for (const record of parsed.data.meals) {
        expect(record).not.toHaveProperty("userId");
      }
      for (const record of parsed.data.medications) {
        expect(record).not.toHaveProperty("userId");
      }
    });

    it("exports partial scope correctly", async () => {
      const options: ExportOptions = {
        format: "json",
        scope: { medications: false, glucose: true, meals: false, activities: false, notes: false },
      };
      const file = await exportAsJson(TEST_USER_ID, options);
      const parsed = JSON.parse(file.content) as DiaBemExport;

      expect(parsed.data.glucose.length).toBe(3);
      expect(parsed.data.meals.length).toBe(0);
      expect(parsed.data.activities.length).toBe(0);
      expect(parsed.data.notes.length).toBe(0);
    });

    it("exports separate CSV files per entity", async () => {
      const options: ExportOptions = {
        format: "csv",
        scope: { medications: true, glucose: true, meals: true, activities: true, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(5);
      expect(files[0].fileName).toContain("glucose");
      expect(files[1].fileName).toContain("meals");
      expect(files[2].fileName).toContain("activities");
      expect(files[3].fileName).toContain("notes");
      expect(files[4].fileName).toContain("medications");
    });
  });

  describe("Special characters and encoding", () => {
    it("handles Unicode and accents in notes", async () => {
      await glucoseRepository.create({
        userId: TEST_USER_ID,
        value: 110,
        unit: "mg/dL",
        context: "fasting",
        measuredAt: "2026-09-01T08:00:00Z",
        notes: "José cameu açúcar — \"especial\" & Events",
      });

      const options: ExportOptions = {
        format: "json",
        scope: { medications: false, glucose: true, meals: false, activities: false, notes: false },
      };
      const file = await exportAsJson(TEST_USER_ID, options);
      const parsed = JSON.parse(file.content) as DiaBemExport;

      expect(parsed.data.glucose[0].notes).toBe(
        "José cameu açúcar — \"especial\" & Events"
      );
    });

    it("handles commas and newlines in CSV", async () => {
      await noteRepository.create(
        {
          userId: TEST_USER_ID,
          content: "Texto, com vírgula\ne quebra de linha",
        },
        { createdAt: "2026-09-01T08:00:00Z" }
      );

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: false, activities: false, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(1);
      // The CSV has BOM + header + 1 data row. The newline in content is inside quotes.
      const content = files[0].content;
      expect(content).toContain("id,content,createdAt");
      expect(content).toContain("Texto, com vírgula");
    });

    it("prevents CSV injection with formula characters", async () => {
      await noteRepository.create(
        {
          userId: TEST_USER_ID,
          content: "=SUM(A1:A10)",
        },
        { createdAt: "2026-09-01T08:00:00Z" }
      );

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: false, activities: false, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      const content = files[0].content;
      const lines = content.split("\n");
      expect(lines[1]).toContain("'=SUM(A1:A10)");
    });

    it("prevents CSV injection even with leading whitespace", async () => {
      await noteRepository.create(
        {
          userId: TEST_USER_ID,
          content: "  =SUM(A1:A10)",
        },
        { createdAt: "2026-09-01T08:00:00Z" }
      );

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: false, activities: false, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      const content = files[0].content;
      const lines = content.split("\n");
      // Leading whitespace + formula char must be guarded.
      expect(lines[1]).toContain("'  =SUM(A1:A10)");
    });

    it("prevents CSV injection with tab-prefixed formula", async () => {
      await noteRepository.create(
        {
          userId: TEST_USER_ID,
          content: "\t=SUM(A1:A10)",
        },
        { createdAt: "2026-09-01T08:00:00Z" }
      );

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: false, activities: false, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      const content = files[0].content;
      const lines = content.split("\n");
      expect(lines[1]).toContain("'\t=SUM(A1:A10)");
    });
  });

  describe("Period filter", () => {
    it("exports only records within the specified period", async () => {
      await seedGlucose([
        { value: 120, context: "fasting", measuredAt: "2026-08-15T08:00:00Z" },
        { value: 130, context: "fasting", measuredAt: "2026-09-01T08:00:00Z" },
        { value: 140, context: "fasting", measuredAt: "2026-09-15T08:00:00Z" },
      ]);

      const options: ExportOptions = {
        format: "json",
        scope: { medications: false, glucose: true, meals: false, activities: false, notes: false },
        period: { from: "2026-09-01", to: "2026-09-10" },
      };
      const file = await exportAsJson(TEST_USER_ID, options);
      const parsed = JSON.parse(file.content) as DiaBemExport;

      expect(parsed.data.glucose.length).toBe(1);
      expect(parsed.data.glucose[0].value).toBe(130);
    });
  });
});

describe("Data Ownership — Import", () => {
  describe("JSON Import", () => {
    it("parses a valid JSON export", () => {
      const envelope: DiaBemExport = {
        version: 1,
        application: "DiaBem",
        exportedAt: "2026-09-02T12:00:00Z",
        data: {
          glucose: [
            {
              id: "g1",
              value: 120,
              unit: "mg/dL",
              context: "fasting",
              measuredAt: "2026-09-01T08:00:00Z",
              createdAt: "2026-09-01T08:00:00Z",
              updatedAt: "2026-09-01T08:00:00Z",
            },
          ],
          meals: [],
          activities: [],
          notes: [],
          medications: [],
        },
      };
      const content = JSON.stringify(envelope);
      const result = parseJsonImport(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.glucose.length).toBe(1);
        expect(result.data.data.glucose[0].value).toBe(120);
      }
    });

    it("parses medications from a JSON export", () => {
      const envelope: DiaBemExport = {
        version: 1,
        application: "DiaBem",
        exportedAt: "2026-09-02T12:00:00Z",
        data: {
          glucose: [],
          meals: [],
          activities: [],
          notes: [],
          medications: [
            {
              id: "med1",
              name: "Metformina",
              dosage: "500",
              unit: "mg",
              frequency: "2x ao dia",
              route: "oral",
              medicatedAt: "2026-09-01T08:00:00Z",
              notes: "Tomar com café",
              createdAt: "2026-09-01T08:00:00Z",
              updatedAt: "2026-09-01T08:00:00Z",
            },
          ],
        },
      };
      const content = JSON.stringify(envelope);
      const result = parseJsonImport(content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.medications.length).toBe(1);
        const med = result.data.data.medications[0];
        expect(med.name).toBe("Metformina");
        expect(med.dosage).toBe("500");
        expect(med.route).toBe("oral");
      }
    });

    it("treats a missing medications key as an empty list for older exports", () => {
      const envelope = {
        version: 1,
        application: "DiaBem",
        exportedAt: "2026-09-02T12:00:00Z",
        data: {
          glucose: [],
          meals: [],
          activities: [],
          notes: [],
        },
      };
      const result = parseJsonImport(JSON.stringify(envelope));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.data.medications).toEqual([]);
      }
    });

    it("rejects invalid JSON", () => {
      const result = parseJsonImport("not json");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].message).toContain("inválido");
      }
    });

    it("rejects unsupported version", () => {
      const envelope = {
        version: 99,
        application: "DiaBem",
        exportedAt: "2026-09-02T12:00:00Z",
        data: { glucose: [], meals: [], activities: [], notes: [] },
      };
      const result = parseJsonImport(JSON.stringify(envelope));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.field === "version")).toBe(true);
      }
    });

    it("rejects missing required fields", () => {
      const result = parseJsonImport(JSON.stringify({ version: 1 }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("rejects files with wrong application name", () => {
      const envelope = {
        version: 1,
        application: "OtherApp",
        exportedAt: "2026-09-02T12:00:00Z",
        data: { glucose: [], meals: [], activities: [], notes: [] },
      };
      const result = parseJsonImport(JSON.stringify(envelope));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.field === "application")).toBe(true);
        expect(result.errors.find((e) => e.field === "application")!.message).toContain("DiaBem");
      }
    });

    it("rejects files with missing application field", () => {
      const envelope = {
        version: 1,
        exportedAt: "2026-09-02T12:00:00Z",
        data: { glucose: [], meals: [], activities: [], notes: [] },
      };
      const result = parseJsonImport(JSON.stringify(envelope));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.field === "application")).toBe(true);
      }
    });

    it("rejects files exceeding size limit", () => {
      const large = "x".repeat(11 * 1024 * 1024);
      const result = parseJsonImport(large);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].message).toContain("muito grande");
      }
    });
  });

  describe("CSV Import", () => {
    it("parses a valid glucose CSV", () => {
      const csv = [
        "id,timestamp,value,unit,context,notes,createdAt,updatedAt",
        "g1,2026-09-01T08:00:00Z,120,mg/dL,fasting,Bom,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.glucose.length).toBe(1);
        expect(result.data.glucose[0].value).toBe(120);
      }
    });

    it("parses a valid meals CSV", () => {
      const csv = [
        "id,timestamp,type,description,notes,createdAt,updatedAt",
        "m1,2026-09-01T12:00:00Z,lunch,Arroz e feijão,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.meals.length).toBe(1);
        expect(result.data.meals[0].type).toBe("lunch");
      }
    });

    it("parses a valid activities CSV", () => {
      const csv = [
        "id,timestamp,type,durationMinutes,notes,createdAt,updatedAt",
        "a1,2026-09-01T06:00:00Z,walking,30,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.activities.length).toBe(1);
        expect(result.data.activities[0].durationMinutes).toBe(30);
      }
    });

    it("parses a valid notes CSV", () => {
      const csv = [
        "id,timestamp,content,createdAt,updatedAt",
        "n1,2026-09-01T08:00:00Z,Me sentindo bem,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.notes.length).toBe(1);
        expect(result.data.notes[0].content).toBe("Me sentindo bem");
      }
    });

    it("parses a valid medications CSV", () => {
      const csv = [
        "id,timestamp,name,dosage,unit,frequency,route,notes,createdAt,updatedAt",
        "med1,2026-09-01T08:00:00Z,Metformina,500,mg,2x ao dia,oral,Tomar com café,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.medications.length).toBe(1);
        expect(result.data.medications[0].name).toBe("Metformina");
        expect(result.data.medications[0].dosage).toBe("500");
        expect(result.data.medications[0].unit).toBe("mg");
        expect(result.data.medications[0].frequency).toBe("2x ao dia");
        expect(result.data.medications[0].route).toBe("oral");
        expect(result.data.medications[0].notes).toBe("Tomar com café");
      }
    });

    it("rejects a medications CSV with empty name and invalid dosage", () => {
      const csv = [
        "id,timestamp,name,dosage,unit,frequency,route,notes,createdAt,updatedAt",
        "med1,2026-09-01T08:00:00Z,Metformina,abc,,oral,,,,",
        "med2,2026-09-01T09:00:00Z,,500,,,,,,",
      ].join("\n");
      const result = parseCsvImport(csv);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const fields = result.errors.map((e) => `${e.field}:${e.recordIndex}`);
        expect(fields).toContain("dosage:2");
        expect(fields).toContain("name:3");
      }
    });

    it("drops a medication row when unit exceeds the length cap", () => {
      const csv = [
        "id,timestamp,name,dosage,unit,frequency,route,notes,createdAt,updatedAt",
        `med1,2026-09-01T08:00:00Z,Metformina,500,${"x".repeat(101)},2x ao dia,oral,Tomar com café,,`,
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.field === "unit")).toBe(true);
        // The whole row is dropped, not partially imported without the unit.
        const data = result as typeof result & { data: NormalizedImportData };
        expect(data.data.medications.length).toBe(0);
      }
    });

    it("keeps a medication row when notes exceed the length cap (field dropped only)", () => {
      const csv = [
        "id,timestamp,name,dosage,unit,frequency,route,notes,createdAt,updatedAt",
        `med1,2026-09-01T08:00:00Z,Metformina,500,mg,2x ao dia,oral,"${"x".repeat(501)}",,`,
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.medications.length).toBe(1);
        expect(result.data.medications[0].notes).toBeUndefined();
        expect(result.errors.some((e) => e.field === "notes")).toBe(true);
      }
    });

    it("rejects empty CSV", () => {
      const result = parseCsvImport("");
      expect(result.ok).toBe(false);
    });

    it("strips injection-prevention apostrophe on re-import (round-trip)", () => {
      // Simulates a CSV export that added the ' prefix, then re-imported.
      const csv = [
        "id,timestamp,content,createdAt,updatedAt",
        "n1,2026-09-01T08:00:00Z,'=SUM(A1:A10),,",
      ].join("\n");
      const result = parseCsvImport(csv);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.notes.length).toBe(1);
        expect(result.data.notes[0].content).toBe("=SUM(A1:A10)");
      }
    });

    it("strips leading-whitespace + tab CSV injection apostrophe on re-import", () => {
      const csv = [
        "id,timestamp,content,createdAt,updatedAt",
        "n1,2026-09-01T08:00:00Z,'  =SUM(A1:A10),,",
      ].join("\n");
      const result = parseCsvImport(csv);
      expect(result.ok).toBe(true);
      if (result.ok) {
        // CSV import always trims leading/trailing whitespace from text fields,
        // so the leading spaces are stripped alongside the injection guard.
        expect(result.data.notes[0].content).toBe("=SUM(A1:A10)");
      }
    });

    it("does not strip a lone apostrophe not followed by formula char", () => {
      const csv = [
        "id,timestamp,content,createdAt,updatedAt",
        "n1,2026-09-01T08:00:00Z,'Apenas uma nota,,",
      ].join("\n");
      const result = parseCsvImport(csv);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.notes[0].content).toBe("'Apenas uma nota");
      }
    });

    it("rejects notes content exceeding the length cap", () => {
      const longContent = "x".repeat(2001);
      const csv = [
        "id,timestamp,content,createdAt,updatedAt",
        `n1,2026-09-01T08:00:00Z,"${longContent}",,`,
      ].join("\n");
      const result = parseCsvImport(csv);
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.field === "content")).toBe(true);
    });

    it("reports validation errors for invalid rows", () => {
      const csv = [
        "id,timestamp,value,unit,context,notes,createdAt,updatedAt",
        "g1,2026-09-01T08:00:00Z,abc,mg/dL,fasting,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("inválido");
    });

    it("returns ok:false when all rows fail validation", () => {
      const csv = [
        "id,timestamp,value,unit,context,notes,createdAt,updatedAt",
        "g1,2026-09-01T08:00:00Z,abc,mg/dL,fasting,,",
        "g2,2026-09-01T09:00:00Z,xyz,mg/dL,fasting,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it("returns ok:true when at least one row is valid", () => {
      const csv = [
        "id,timestamp,value,unit,context,notes,createdAt,updatedAt",
        "g1,2026-09-01T08:00:00Z,abc,mg/dL,fasting,,",
        "g2,2026-09-01T09:00:00Z,120,mg/dL,fasting,,",
      ].join("\n");
      const result = parseCsvImport(csv);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.glucose.length).toBe(1);
        expect(result.errors.length).toBe(1);
      }
    });
  });

  describe("File validation", () => {
    it("detects JSON files by extension", () => {
      expect(detectFileKind("backup.json", "")).toBe("json");
    });

    it("detects CSV files by extension", () => {
      expect(detectFileKind("data.csv", "")).toBe("csv");
    });

    it("detects unknown files", () => {
      expect(detectFileKind("file.txt", "hello")).toBe("unknown");
    });

    it("rejects empty files", () => {
      const file = new File([], "empty.json", { type: "application/json" });
      const errors = validateFile(file);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain("vazio");
    });

    it("rejects files exceeding 10MB", () => {
      const big = new File(["x".repeat(11 * 1024 * 1024)], "big.json", {
        type: "application/json",
      });
      const errors = validateFile(big);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain("muito grande");
    });
  });

  describe("parseFileContent", () => {
    it("returns empty data and errors when CSV has no valid rows", () => {
      const csv = [
        "id,timestamp,value,unit,context,notes,createdAt,updatedAt",
        "g1,2026-09-01T08:00:00Z,abc,mg/dL,fasting,,",
      ].join("\n");
      const result = parseFileContent(csv, "csv");

      expect(result.data.glucose.length).toBe(0);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toContain("inválido");
    });

    it("returns empty data when JSON has invalid structure", () => {
      const result = parseFileContent('{"version":1}', "json");

      expect(result.data.glucose.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Normalization", () => {
    it("trims string fields", () => {
      const data: NormalizedImportData = {
        glucose: [],
        meals: [
          {
            type: "lunch",
            description: "  Arroz  ",
            consumedAt: "  2026-09-01T12:00:00Z  ",
            notes: "  nota  ",
            createdAt: "2026-09-01T12:00:00Z",
            updatedAt: "2026-09-01T12:00:00Z",
          },
        ],
        activities: [],
        notes: [],
        medications: [],
      };

      const normalized = normalizeImportData(data);
      expect(normalized.meals[0].description).toBe("Arroz");
      expect(normalized.meals[0].consumedAt).toBe("2026-09-01T12:00:00Z");
      expect(normalized.meals[0].notes).toBe("nota");
    });

    it("normalizes glucose values", () => {
      const data: NormalizedImportData = {
        glucose: [
          {
            value: 120.456,
            unit: "mg/dL",
            context: "fasting",
            measuredAt: "2026-09-01T08:00:00Z",
            createdAt: "2026-09-01T08:00:00Z",
            updatedAt: "2026-09-01T08:00:00Z",
          },
        ],
        meals: [],
        activities: [],
        notes: [],
        medications: [],
      };

      const normalized = normalizeImportData(data);
      expect(normalized.glucose[0].value).toBe(120.46);
    });

    it("normalizes medication fields", () => {
      const data: NormalizedImportData = {
        glucose: [],
        meals: [],
        activities: [],
        notes: [],
        medications: [
          {
            name: "  Metformina  ",
            dosage: " 500 ",
            unit: "  mg  ",
            frequency: "  2x ao dia  ",
            route: " oral ",
            medicatedAt: "  2026-09-01T08:00:00Z  ",
            notes: "  Tomar com café  ",
            createdAt: "2026-09-01T08:00:00Z",
            updatedAt: "2026-09-01T08:00:00Z",
          },
        ],
      };

      const normalized = normalizeImportData(data);
      expect(normalized.medications[0].name).toBe("Metformina");
      expect(normalized.medications[0].dosage).toBe("500");
      expect(normalized.medications[0].unit).toBe("mg");
      expect(normalized.medications[0].frequency).toBe("2x ao dia");
      expect(normalized.medications[0].route).toBe("oral");
      expect(normalized.medications[0].notes).toBe("Tomar com café");
    });

    it("normalizes medication with empty optionals to undefined", () => {
      const data: NormalizedImportData = {
        glucose: [],
        meals: [],
        activities: [],
        notes: [],
        medications: [
          {
            name: "Ibuprofeno",
            dosage: "",
            unit: "  ",
            frequency: "",
            route: "",
            medicatedAt: "2026-09-01T15:00:00Z",
            notes: "",
            createdAt: "2026-09-01T15:00:00Z",
            updatedAt: "2026-09-01T15:00:00Z",
          },
        ],
      };

      const normalized = normalizeImportData(data);
      expect(normalized.medications[0].dosage).toBeUndefined();
      expect(normalized.medications[0].unit).toBeUndefined();
      expect(normalized.medications[0].frequency).toBeUndefined();
      expect(normalized.medications[0].route).toBeUndefined();
      expect(normalized.medications[0].notes).toBeUndefined();
    });
  });

  describe("Deduplication", () => {
    it("deduplicates glucose by timestamp + value + context", () => {
      const incoming = [
        { value: 120, unit: "mg/dL" as const, context: "fasting" as const, measuredAt: "2026-09-01T08:00:00Z", notes: undefined, createdAt: "2026-09-01T08:00:00Z", updatedAt: "2026-09-01T08:00:00Z" },
        { value: 130, unit: "mg/dL" as const, context: "fasting" as const, measuredAt: "2026-09-01T09:00:00Z", notes: undefined, createdAt: "2026-09-01T09:00:00Z", updatedAt: "2026-09-01T09:00:00Z" },
      ];
      const existing = [
        { measuredAt: "2026-09-01T08:00:00Z", value: 120, context: "fasting" as const },
      ];

      const result = deduplicateGlucose(incoming, existing);
      expect(result.unique.length).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.unique[0].value).toBe(130);
    });

    it("deduplicates meals by timestamp + type + description", () => {
      const incoming = [
        { type: "lunch" as const, description: "Arroz", consumedAt: "2026-09-01T12:00:00Z", notes: undefined, createdAt: "2026-09-01T12:00:00Z", updatedAt: "2026-09-01T12:00:00Z" },
      ];
      const existing = [
        { consumedAt: "2026-09-01T12:00:00Z", type: "lunch", description: "Arroz" },
      ];

      const result = deduplicateMeals(incoming, existing);
      expect(result.unique.length).toBe(0);
      expect(result.duplicateCount).toBe(1);
    });

    it("deduplicates activities by timestamp + type + duration", () => {
      const incoming = [
        { type: "walking" as const, durationMinutes: 30, startedAt: "2026-09-01T06:00:00Z", notes: undefined, createdAt: "2026-09-01T06:00:00Z", updatedAt: "2026-09-01T06:00:00Z" },
      ];
      const existing = [
        { startedAt: "2026-09-01T06:00:00Z", type: "walking", durationMinutes: 30 },
      ];

      const result = deduplicateActivities(incoming, existing);
      expect(result.unique.length).toBe(0);
      expect(result.duplicateCount).toBe(1);
    });

    it("deduplicates notes by timestamp + content", () => {
      const incoming = [
        { content: "Bom dia", createdAt: "2026-09-01T08:00:00Z", updatedAt: "2026-09-01T08:00:00Z" },
      ];
      const existing = [
        { createdAt: "2026-09-01T08:00:00Z", content: "Bom dia" },
      ];

      const result = deduplicateNotes(incoming, existing);
      expect(result.unique.length).toBe(0);
      expect(result.duplicateCount).toBe(1);
    });

    it("deduplicates medications by timestamp + name + dosage", () => {
      const incoming = [
        {
          name: "Metformina",
          dosage: "500",
          medicatedAt: "2026-09-01T08:00:00Z",
          createdAt: "2026-09-01T08:00:00Z",
          updatedAt: "2026-09-01T08:00:00Z",
        },
        {
          name: "Metformina",
          dosage: "1000",
          medicatedAt: "2026-09-01T08:00:00Z",
          createdAt: "2026-09-01T08:00:00Z",
          updatedAt: "2026-09-01T08:00:00Z",
        },
      ];
      const existing = [
        {
          medicatedAt: "2026-09-01T08:00:00Z",
          name: "Metformina",
          dosage: "500",
        },
      ];

      const result = deduplicateMedications(incoming, existing);
      expect(result.unique.length).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.unique[0].dosage).toBe("1000");
    });

    it("deduplicates medications case-insensitively on name", () => {
      const incoming = [
        {
          name: "Glifage",
          dosage: "850",
          medicatedAt: "2026-09-01T08:00:00Z",
          createdAt: "2026-09-01T08:00:00Z",
          updatedAt: "2026-09-01T08:00:00Z",
        },
      ];
      const existing = [
        { medicatedAt: "2026-09-01T08:00:00Z", name: "glifage", dosage: "850" },
      ];

      const result = deduplicateMedications(incoming, existing);
      expect(result.duplicateCount).toBe(1);
      expect(result.unique.length).toBe(0);
    });
  });
});

describe("Data Ownership — Round-trip", () => {
  describe("JSON round-trip", () => {
    it("export → import preserves data equivalence", async () => {
      await seedAllData();

      const options: ExportOptions = {
        format: "json",
        scope: { medications: true, glucose: true, meals: true, activities: true, notes: true },
      };
      const file = await exportAsJson(TEST_USER_ID, options);

      await deleteUserHealthData(TEST_USER_ID);

      const emptyGlucose = await glucoseRepository.findByUser(TEST_USER_ID);
      expect(emptyGlucose.length).toBe(0);

      const prepared = await dataOwnershipService.prepareImport(
        new File([file.content], file.fileName, { type: file.mimeType })
      );
      expect(prepared.fileKind).toBe("json");

      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.totalImported).toBe(11);

      const restoredGlucose = await glucoseRepository.findByUser(TEST_USER_ID);
      const restoredMeals = await mealRepository.findByUser(TEST_USER_ID);
      const restoredActivities = await activityRepository.findByUser(TEST_USER_ID);
      const restoredNotes = await noteRepository.findByUser(TEST_USER_ID);
      const restoredMedications = await medicationRepository.findByUser(TEST_USER_ID);

      expect(restoredGlucose.length).toBe(3);
      expect(restoredMeals.length).toBe(2);
      expect(restoredActivities.length).toBe(2);
      expect(restoredNotes.length).toBe(2);
      expect(restoredMedications.length).toBe(2);

      // Order may differ after re-import.
      const glucoseValues = restoredGlucose.map((g) => g.value);
      expect(glucoseValues).toContain(120);
      expect(glucoseValues).toContain(180);
      expect(glucoseValues).toContain(95);
      const mealDescriptions = restoredMeals.map((m) => m.description);
      expect(mealDescriptions).toContain("Pão com ovo");
      expect(restoredActivities.length).toBe(2);
      expect(restoredNotes.length).toBe(2);
      const medicationNames = restoredMedications.map((m) => m.name);
      expect(medicationNames).toContain("Metformina");
      expect(medicationNames).toContain("Ibuprofeno");
    });

    it("export → import preserves the original provenance source on re-import", async () => {
      await glucoseRepository.create({
        userId: TEST_USER_ID,
        value: 145,
        unit: "mg/dL",
        context: "fasting",
        measuredAt: "2026-09-01T08:00:00Z",
        provenance: {
          source: "device",
          sourceId: "device-sensor-01",
          recordedAt: "2026-09-01T08:00:00Z",
        },
      });

      const file = await exportAsJson(TEST_USER_ID, {
        format: "json",
        scope: { medications: false, glucose: true, meals: false, activities: false, notes: false },
      });

      await deleteUserHealthData(TEST_USER_ID);

      const prepared = await dataOwnershipService.prepareImport(
        new File([file.content], file.fileName, { type: file.mimeType })
      );
      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.totalImported).toBe(1);

      const restored = await glucoseRepository.findByUser(TEST_USER_ID);
      expect(restored).toHaveLength(1);
      expect(restored[0].provenance?.source).toBe("device");
      expect(restored[0].provenance?.sourceId).toBe("device-sensor-01");
    });
  });

  describe("CSV round-trip", () => {
    it("export → import preserves glucose data", async () => {
      await seedGlucose();

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: true, meals: false, activities: false, notes: false },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(1);

      await deleteUserHealthData(TEST_USER_ID);

      const prepared = await dataOwnershipService.prepareImport(
        new File([files[0].content], files[0].fileName, { type: files[0].mimeType })
      );
      expect(prepared.fileKind).toBe("csv");

      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.totalImported).toBe(3);

      const restored = await glucoseRepository.findByUser(TEST_USER_ID);
      expect(restored.length).toBe(3);
    });

    it("export → import preserves meals data", async () => {
      await seedMeals();

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: true, activities: false, notes: false },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(1);

      await deleteUserHealthData(TEST_USER_ID);

      const prepared = await dataOwnershipService.prepareImport(
        new File([files[0].content], files[0].fileName, { type: files[0].mimeType })
      );
      expect(prepared.fileKind).toBe("csv");

      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.totalImported).toBe(2);

      const restored = await mealRepository.findByUser(TEST_USER_ID);
      expect(restored.length).toBe(2);
      const descriptions = restored.map((m) => m.description);
      expect(descriptions).toContain("Pão com ovo");
      expect(descriptions).toContain("Arroz, feijão e frango");
    });

    it("export → import preserves activities data", async () => {
      await seedActivities();

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: false, activities: true, notes: false },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(1);

      await deleteUserHealthData(TEST_USER_ID);

      const prepared = await dataOwnershipService.prepareImport(
        new File([files[0].content], files[0].fileName, { type: files[0].mimeType })
      );
      expect(prepared.fileKind).toBe("csv");

      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.totalImported).toBe(2);

      const restored = await activityRepository.findByUser(TEST_USER_ID);
      expect(restored.length).toBe(2);
      const types = restored.map((a) => a.type);
      expect(types).toContain("walking");
      expect(types).toContain("cycling");
    });

    it("export → import preserves notes data", async () => {
      await seedNotes();

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: false, glucose: false, meals: false, activities: false, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(1);

      await deleteUserHealthData(TEST_USER_ID);

      const prepared = await dataOwnershipService.prepareImport(
        new File([files[0].content], files[0].fileName, { type: files[0].mimeType })
      );
      expect(prepared.fileKind).toBe("csv");

      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.totalImported).toBe(2);

      const restored = await noteRepository.findByUser(TEST_USER_ID);
      expect(restored.length).toBe(2);
      const contents = restored.map((n) => n.content);
      expect(contents).toContain("Me sentindo bem hoje");
      expect(contents).toContain("Dor de cabeça leve");
    });

    it("export → import preserves all entity types in separate CSV files", async () => {
      await seedAllData();

      const options: ExportOptions = {
        format: "csv",
        scope: { medications: true, glucose: true, meals: true, activities: true, notes: true },
      };
      const files = await exportAsCsv(TEST_USER_ID, options);
      expect(files.length).toBe(5);

      await deleteUserHealthData(TEST_USER_ID);

      let totalImported = 0;
      for (const file of files) {
        const prepared = await dataOwnershipService.prepareImport(
          new File([file.content], file.fileName, { type: file.mimeType })
        );
        const result = await dataOwnershipService.importUserData(
          TEST_USER_ID,
          prepared.normalizedData
        );
        totalImported += result.totalImported;
      }

      expect(totalImported).toBe(11);

      const glucose = await glucoseRepository.findByUser(TEST_USER_ID);
      const meals = await mealRepository.findByUser(TEST_USER_ID);
      const activities = await activityRepository.findByUser(TEST_USER_ID);
      const notes = await noteRepository.findByUser(TEST_USER_ID);
      const medications = await medicationRepository.findByUser(TEST_USER_ID);

      expect(glucose.length).toBe(3);
      expect(meals.length).toBe(2);
      expect(activities.length).toBe(2);
      expect(notes.length).toBe(2);
      expect(medications.length).toBe(2);
    });
  });

  describe("Deduplication on import", () => {
    it("skips duplicate records when importing existing backup", async () => {
      await seedAllData();

      const options: ExportOptions = {
        format: "json",
        scope: { medications: true, glucose: true, meals: true, activities: true, notes: true },
      };
      const file = await exportAsJson(TEST_USER_ID, options);

      // Import without clearing (should detect duplicates)
      const prepared = await dataOwnershipService.prepareImport(
        new File([file.content], file.fileName, { type: file.mimeType })
      );

      const result = await dataOwnershipService.importUserData(
        TEST_USER_ID,
        prepared.normalizedData
      );
      expect(result.duplicatesSkipped).toBe(11);
      expect(result.totalImported).toBe(0);
    });
  });
});

describe("Data Ownership — Delete", () => {
  it("deletes all health data for a user", async () => {
    await seedAllData();

    await deleteUserHealthData(TEST_USER_ID);

    const glucose = await glucoseRepository.findByUser(TEST_USER_ID);
    const meals = await mealRepository.findByUser(TEST_USER_ID);
    const activities = await activityRepository.findByUser(TEST_USER_ID);
    const notes = await noteRepository.findByUser(TEST_USER_ID);
    const medications = await medicationRepository.findByUser(TEST_USER_ID);

    expect(glucose.length).toBe(0);
    expect(meals.length).toBe(0);
    expect(activities.length).toBe(0);
    expect(notes.length).toBe(0);
    expect(medications.length).toBe(0);
  });

  it("deletes the user's notification schedules and preferences", async () => {
    const db = getDatabase();
    await notificationScheduleRepository.create(TEST_USER_ID, {
      label: "Medição da manhã",
      period: "morning",
      time: "08:00",
      enabled: true,
      daysOfWeek: ["monday"],
      reminderTypes: ["glucose"],
    });
    await notificationScheduleRepository.updatePreferences(TEST_USER_ID, {
      enabled: true,
      quietHours: { enabled: true, start: "22:00", end: "07:00" },
    });

    await deleteUserHealthData(TEST_USER_ID);

    expect(await db.notificationSchedules.count()).toBe(0);
    expect(await db.notificationPreferences.get(TEST_USER_ID)).toBeUndefined();
  });

  it("does not delete another user's notification schedules", async () => {
    await notificationScheduleRepository.create("other-user", {
      label: "Lembrete de outro usuário",
      period: "night",
      time: "20:00",
      enabled: true,
      daysOfWeek: ["friday"],
      reminderTypes: ["meal"],
    });

    await deleteUserHealthData(TEST_USER_ID);

    const remaining = await notificationScheduleRepository.findByUser("other-user");
    expect(remaining.length).toBe(1);
  });

  it("purges the user's sessions on deletion (logs out)", async () => {
    const db = getDatabase();
    await db.sessions.add({
      id: "session-1",
      userId: TEST_USER_ID,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });

    await deleteUserHealthData(TEST_USER_ID);

    const remaining = await db.sessions.where("userId").equals(TEST_USER_ID).toArray();
    expect(remaining.length).toBe(0);
  });

  it("does not delete other users' sessions", async () => {
    const db = getDatabase();
    await db.sessions.add({
      id: "session-other",
      userId: "other-user",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });

    await deleteUserHealthData(TEST_USER_ID);

    const other = await db.sessions.where("userId").equals("other-user").toArray();
    expect(other.length).toBe(1);
  });
});

describe("Data Ownership — Share", () => {
  it("canShare returns a boolean without throwing", () => {
    const result = canShare();
    expect(typeof result).toBe("boolean");
  });
});

describe("Data Ownership — Service", () => {
  it("defaultScope includes all data types", () => {
    const scope = dataOwnershipService.defaultScope;
    expect(scope.glucose).toBe(true);
    expect(scope.meals).toBe(true);
    expect(scope.activities).toBe(true);
    expect(scope.notes).toBe(true);
    expect(scope.medications).toBe(true);
  });

  it("prepareImport validates file size", async () => {
    const big = new File(["x".repeat(11 * 1024 * 1024)], "big.json", {
      type: "application/json",
    });

    await expect(dataOwnershipService.prepareImport(big)).rejects.toThrow("muito grande");
  });

  it("buildPreview returns correct counts", async () => {
    await seedAllData();

    const envelope: DiaBemExport = {
      version: 1,
      application: "DiaBem",
      exportedAt: "2026-09-02T12:00:00Z",
      data: {
        glucose: [
          { id: "new1", value: 200, unit: "mg/dL", context: "fasting", measuredAt: "2026-09-02T08:00:00Z", createdAt: "2026-09-02T08:00:00Z", updatedAt: "2026-09-02T08:00:00Z" },
        ],
        meals: [],
        activities: [],
        notes: [],
        medications: [],
      },
    };

    const { data } = parseFileContent(JSON.stringify(envelope), "json");
    const preview = await dataOwnershipService.buildPreview(
      TEST_USER_ID,
      "test.json",
      "json",
      data
    );

    expect(preview.glucoseCount).toBe(1);
    expect(preview.duplicateCount).toBe(0);
  });
});

describe("Data Ownership — Encryption Integration", () => {
  it("imported data is encrypted in IndexedDB", async () => {
    await seedGlucose([{ value: 120, context: "fasting", measuredAt: "2026-09-01T08:00:00Z", notes: "Teste criptografia" }]);

    // Verify the note is accessible (decrypted) through the repository
    const records = await glucoseRepository.findByUser(TEST_USER_ID);
    expect(records[0].notes).toBe("Teste criptografia");

    // Verify raw data in IndexedDB is encrypted
    const db = getDatabase();
    const raw = await db.glucoseReadings.toArray();
    const target = raw.find((r) => r.userId === TEST_USER_ID);
    expect(target).toBeTruthy();
    // The notes field should be an EncryptedPayload, not a plain string
    expect(target!.notes).toHaveProperty("version");
    expect(target!.notes).toHaveProperty("algorithm", "AES-GCM");
    expect(target!.notes).toHaveProperty("iv");
    expect(target!.notes).toHaveProperty("data");
  });

  it("clearing encryption key makes data inaccessible", async () => {
    await seedGlucose([{ value: 120, context: "fasting", measuredAt: "2026-09-01T08:00:00Z", notes: "Segredo" }]);
    clearSessionDataKey();

    const records = await glucoseRepository.findByUser(TEST_USER_ID);
    // Without key, encrypted fields should be undefined
    expect(records[0].notes).toBeUndefined();
  });

  it("imported medications are encrypted in IndexedDB", async () => {
    const envelope: DiaBemExport = {
      version: 1,
      application: "DiaBem",
      exportedAt: "2026-09-02T12:00:00Z",
      data: {
        glucose: [],
        meals: [],
        activities: [],
        notes: [],
        medications: [
          {
            id: "med1",
            name: "Metformina",
            dosage: "500",
            medicatedAt: "2026-09-01T08:00:00Z",
            notes: "Nota sensível do medicamento",
            createdAt: "2026-09-01T08:00:00Z",
            updatedAt: "2026-09-01T08:00:00Z",
          },
        ],
      },
    };

    const { data } = parseFileContent(JSON.stringify(envelope), "json");
    const result = await dataOwnershipService.importUserData(
      TEST_USER_ID,
      data
    );
    expect(result.totalImported).toBe(1);

    // Decrypted read through the repository.
    const records = await medicationRepository.findByUser(TEST_USER_ID);
    expect(records).toHaveLength(1);
    expect(records[0].notes).toBe("Nota sensível do medicamento");

    // Raw persisted notes must be an encrypted payload.
    const db = getDatabase();
    const raw = await db.medications.toArray();
    const target = raw.find((r) => r.userId === TEST_USER_ID);
    expect(target).toBeTruthy();
    expect(target!.notes).toHaveProperty("algorithm", "AES-GCM");
    expect(target!.notes).toHaveProperty("iv");
    expect(target!.notes).toHaveProperty("data");
  });
});
