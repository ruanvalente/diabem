import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../db/database";
import {
  createMedication,
  updateMedication,
  deleteMedication,
  listMedications,
} from "./medication.service";

beforeEach(async () => {
  const db = getDatabase();
  await db.medications.clear();
});

const validMedInput = {
  name: "Metformina",
  dosage: "500",
  unit: "mg",
  frequency: "2x ao dia",
  route: "oral",
  medicatedAtLocal: "2026-08-28T08:30",
  notes: "Tomar com café",
};

describe("createMedication", () => {
  it("creates a medication with a UTC instant", async () => {
    const result = await createMedication("user-a", validMedInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.medicatedAt).toBe(
        new Date(2026, 7, 28, 8, 30).toISOString(),
      );
      expect(result.data.name).toBe("Metformina");
      expect(result.data.provenance?.source).toBe("manual");
    }
  });

  it("creates a medication with only required fields", async () => {
    const result = await createMedication("user-a", {
      name: "Ibuprofeno",
      medicatedAtLocal: "2026-08-28T14:00",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Ibuprofeno");
      expect(result.data.dosage).toBeUndefined();
    }
  });

  it("propagates a non-manual provenance source", async () => {
    const result = await createMedication("user-a", {
      ...validMedInput,
      provenanceSource: "speech",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.provenance?.source).toBe("speech");
    }
  });

  it("rejects empty name", async () => {
    const result = await createMedication("user-a", {
      ...validMedInput,
      name: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid datetime", async () => {
    const result = await createMedication("user-a", {
      ...validMedInput,
      medicatedAtLocal: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid dosage format", async () => {
    const result = await createMedication("user-a", {
      ...validMedInput,
      dosage: "abc",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts comma decimal dosage", async () => {
    const result = await createMedication("user-a", {
      ...validMedInput,
      dosage: "1,5",
    });
    expect(result.ok).toBe(true);
  });
});

describe("updateMedication", () => {
  it("updates fields and preserves id, userId and createdAt", async () => {
    const created = await createMedication("user-a", validMedInput);
    if (!created.ok) throw new Error("setup failed");

    const updated = await updateMedication("user-a", created.data.id, {
      name: "Metformina Editada",
      notes: "Nova posologia",
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.name).toBe("Metformina Editada");
      expect(updated.data.notes).toBe("Nova posologia");
      expect(updated.data.id).toBe(created.data.id);
      expect(updated.data.userId).toBe(created.data.userId);
      expect(updated.data.createdAt).toBe(created.data.createdAt);
    }
  });

  it("updates updatedAt timestamp", async () => {
    const created = await createMedication("user-a", validMedInput);
    if (!created.ok) throw new Error("setup failed");
    await new Promise((r) => setTimeout(r, 10));

    const updated = await updateMedication("user-a", created.data.id, {
      name: "Updated",
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.updatedAt).not.toBe(created.data.updatedAt);
    }
  });

  it("clears an optional field that is set to undefined on update", async () => {
    const created = await createMedication("user-a", validMedInput);
    if (!created.ok) throw new Error("setup failed");
    expect(created.data.dosage).toBe("500");

    const updated = await updateMedication("user-a", created.data.id, {
      dosage: undefined,
      unit: undefined,
      frequency: undefined,
      route: undefined,
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.dosage).toBeUndefined();
      expect(updated.data.unit).toBeUndefined();
      expect(updated.data.frequency).toBeUndefined();
      expect(updated.data.route).toBeUndefined();
      expect(updated.data.name).toBe("Metformina");
    }
  });

  it("rejects update for a non-existent id", async () => {
    const result = await updateMedication("user-a", "non-existent", {
      name: "X",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects update when userId does not match (ownership check)", async () => {
    const created = await createMedication("user-b", validMedInput);
    if (!created.ok) throw new Error("setup failed");

    const result = await updateMedication("user-a", created.data.id, {
      name: "Hacked",
    });
    expect(result.ok).toBe(false);
  });
});

describe("deleteMedication", () => {
  it("deletes an existing medication", async () => {
    const created = await createMedication("user-a", validMedInput);
    if (!created.ok) throw new Error("setup failed");

    const result = await deleteMedication("user-a", created.data.id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe(created.data.id);
    }

    const findResult = await listMedications("user-a");
    expect(findResult.ok).toBe(true);
    if (findResult.ok) {
      expect(findResult.data).toHaveLength(0);
    }
  });

  it("rejects delete when userId does not match", async () => {
    const created = await createMedication("user-b", validMedInput);
    if (!created.ok) throw new Error("setup failed");

    const result = await deleteMedication("user-a", created.data.id);
    expect(result.ok).toBe(false);
  });

  it("rejects delete for a non-existent id", async () => {
    const result = await deleteMedication("user-a", "non-existent");
    expect(result.ok).toBe(false);
  });
});

describe("listMedications", () => {
  it("returns user's medications newest first", async () => {
    await createMedication("user-a", {
      ...validMedInput,
      name: "Antiga",
      medicatedAtLocal: "2026-08-27T08:00",
    });
    await new Promise((r) => setTimeout(r, 10));
    await createMedication("user-a", {
      ...validMedInput,
      name: "Nova",
      medicatedAtLocal: "2026-08-28T08:00",
    });
    await createMedication("user-b", {
      ...validMedInput,
      name: "Outro",
      medicatedAtLocal: "2026-08-28T09:00",
    });

    const result = await listMedications("user-a");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data.map((m) => m.name)).toEqual(["Nova", "Antiga"]);
    }
  });
});
