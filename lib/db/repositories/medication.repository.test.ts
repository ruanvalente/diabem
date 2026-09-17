import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { medicationRepository } from "./medication.repository";
import { setSessionDataKey, clearSessionDataKey } from "../session-key";
import { cryptoService } from "../../crypto/crypto.service";
import { isEncryptedPayload } from "../../crypto/encryption";

const validInput = {
  userId: "user-a",
  name: "Metformina",
  dosage: "500",
  unit: "mg",
  frequency: "2x ao dia",
  route: "oral",
  medicatedAt: new Date(2026, 7, 28, 8, 0).toISOString(),
  notes: "Tomar com café",
};

beforeEach(async () => {
  clearSessionDataKey();
  const db = getDatabase();
  await db.medications.clear();
});

describe("medicationRepository", () => {
  it("creates a medication with generated id, userId and timestamps", async () => {
    const med = await medicationRepository.create(validInput);
    expect(med.id).toBeTruthy();
    expect(med.userId).toBe("user-a");
    expect(med.name).toBe("Metformina");
    expect(med.dosage).toBe("500");
    expect(med.unit).toBe("mg");
    expect(med.frequency).toBe("2x ao dia");
    expect(med.route).toBe("oral");
    expect(med.notes).toBe("Tomar com café");
    expect(med.createdAt).toBeTruthy();
    expect(med.updatedAt).toBeTruthy();
  });

  it("creates a medication with only required fields (dosage/unit/frequency/route/notes optional)", async () => {
    const med = await medicationRepository.create({
      userId: "user-a",
      name: "Ibuprofeno",
      medicatedAt: new Date(2026, 7, 28, 14, 0).toISOString(),
    });
    expect(med.name).toBe("Ibuprofeno");
    expect(med.dosage).toBeUndefined();
    expect(med.unit).toBeUndefined();
    expect(med.frequency).toBeUndefined();
    expect(med.route).toBeUndefined();
    expect(med.notes).toBeUndefined();
  });

  it("finds a medication by id", async () => {
    const created = await medicationRepository.create(validInput);
    const found = await medicationRepository.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Metformina");
  });

  it("returns undefined for a non-existent id", async () => {
    const found = await medicationRepository.findById("non-existent-id");
    expect(found).toBeUndefined();
  });

  it("isolates data per user and orders newest first", async () => {
    await medicationRepository.create({
      ...validInput,
      name: "Antiga",
      medicatedAt: new Date(2026, 7, 27, 8, 0).toISOString(),
    });
    await new Promise((r) => setTimeout(r, 10));
    await medicationRepository.create({
      ...validInput,
      name: "Nova",
      medicatedAt: new Date(2026, 7, 28, 8, 0).toISOString(),
    });
    await medicationRepository.create({
      userId: "user-b",
      name: "De outro usuário",
      medicatedAt: new Date(2026, 7, 28, 9, 0).toISOString(),
    });

    const userA = await medicationRepository.findByUser("user-a");
    expect(userA.map((m) => m.name)).toEqual(["Nova", "Antiga"]);

    const userB = await medicationRepository.findByUser("user-b");
    expect(userB.map((m) => m.name)).toEqual(["De outro usuário"]);
  });

  it("returns recent medications limited by count", async () => {
    for (let i = 0; i < 7; i++) {
      await medicationRepository.create({
        ...validInput,
        name: `Med ${i}`,
        medicatedAt: new Date(2026, 7, 20 + i, 8, 0).toISOString(),
      });
    }
    const recent = await medicationRepository.findRecentByUser("user-a", 3);
    expect(recent).toHaveLength(3);
    expect(recent[0].name).toBe("Med 6");
  });

  it("counts only the user's medications", async () => {
    await medicationRepository.create({ ...validInput, name: "1" });
    await medicationRepository.create({ ...validInput, name: "2" });
    await medicationRepository.create({ ...validInput, userId: "user-b", name: "3" });
    expect(await medicationRepository.countByUser("user-a")).toBe(2);
    expect(await medicationRepository.countByUser("user-b")).toBe(1);
  });

  it("updates and deletes medications", async () => {
    const created = await medicationRepository.create(validInput);
    const updated = await medicationRepository.update(created.id, {
      name: "Metformina Editada",
      notes: "Nova posologia",
    });
    expect(updated?.name).toBe("Metformina Editada");
    expect(updated?.notes).toBe("Nova posologia");

    expect(await medicationRepository.deleteById(created.id)).toBe(true);
    expect(await medicationRepository.findById(created.id)).toBeUndefined();
  });

  it("returns false when deleting a non-existent medication", async () => {
    expect(await medicationRepository.deleteById("non-existent-id")).toBe(false);
  });

  it("preserves id, userId and createdAt on update", async () => {
    const created = await medicationRepository.create(validInput);
    const originalId = created.id;
    const originalUserId = created.userId;
    const originalCreatedAt = created.createdAt;

    const updated = await medicationRepository.update(created.id, {
      name: "Updated",
    });
    expect(updated?.id).toBe(originalId);
    expect(updated?.userId).toBe(originalUserId);
    expect(updated?.createdAt).toBe(originalCreatedAt);
  });

  it("updates updatedAt on update", async () => {
    const created = await medicationRepository.create(validInput);
    await new Promise((r) => setTimeout(r, 10));
    const updated = await medicationRepository.update(created.id, {
      name: "Updated",
    });
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("respects from/to date bounds on findByUser", async () => {
    await medicationRepository.create({
      ...validInput,
      medicatedAt: new Date(2026, 7, 25, 8, 0).toISOString(),
    });
    await medicationRepository.create({
      ...validInput,
      name: "Dentro",
      medicatedAt: new Date(2026, 7, 28, 8, 0).toISOString(),
    });
    await medicationRepository.create({
      ...validInput,
      name: "Depois",
      medicatedAt: new Date(2026, 8, 1, 8, 0).toISOString(),
    });

    const result = await medicationRepository.findByUser("user-a", {
      from: new Date(2026, 7, 26, 0, 0).toISOString(),
      to: new Date(2026, 7, 29, 0, 0).toISOString(),
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Dentro");
  });
});

describe("medicationRepository — notes encryption at rest", () => {
  it("encrypts notes on create and decrypts on read", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) throw new Error("key derivation failed");
    setSessionDataKey(keys.data.dataKey);

    const created = await medicationRepository.create(validInput);
    const raw = await getDatabase().medications.get(created.id);
    expect(raw?.notes).toSatisfy(isEncryptedPayload);

    const read = await medicationRepository.findById(created.id);
    expect(read?.notes).toBe("Tomar com café");
  });

  it("leaves notes plaintext when no key is set", async () => {
    const created = await medicationRepository.create(validInput);
    const raw = await getDatabase().medications.get(created.id);
    expect(raw?.notes).toBe("Tomar com café");

    const read = await medicationRepository.findById(created.id);
    expect(read?.notes).toBe("Tomar com café");
  });

  it("returns undefined for notes when read without the key", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) throw new Error("key derivation failed");
    setSessionDataKey(keys.data.dataKey);

    const created = await medicationRepository.create(validInput);
    clearSessionDataKey();

    const read = await medicationRepository.findById(created.id);
    expect(read?.notes).toBeUndefined();
  });

  it("re-encrypts notes on update", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) throw new Error("key derivation failed");
    setSessionDataKey(keys.data.dataKey);

    const created = await medicationRepository.create(validInput);
    const updated = await medicationRepository.update(created.id, {
      notes: "Nova nota",
    });
    expect(updated?.notes).toBe("Nova nota");

    const raw = await getDatabase().medications.get(created.id);
    expect(raw?.notes).toSatisfy(isEncryptedPayload);

    const read = await medicationRepository.findById(created.id);
    expect(read?.notes).toBe("Nova nota");
  });
});
