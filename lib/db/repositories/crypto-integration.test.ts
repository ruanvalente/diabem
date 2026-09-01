import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { setSessionDataKey, clearSessionDataKey } from "../session-key";
import { cryptoService } from "../../crypto/crypto.service";
import { isEncryptedPayload } from "../../crypto/encryption";
import { glucoseRepository } from "./glucose.repository";
import { mealRepository } from "./meal.repository";
import { activityRepository } from "./activity.repository";
import { noteRepository } from "./note.repository";

beforeEach(async () => {
  clearSessionDataKey();
  const db = getDatabase();
  await Promise.all([
    db.glucoseReadings.clear(),
    db.meals.clear(),
    db.activities.clear(),
    db.notes.clear(),
  ]);
});

describe("repositories encrypt sensitive fields at rest", () => {
  it("encrypts glucose notes and decrypts them on read", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) return;
    setSessionDataKey(keys.data.dataKey);

    const created = await glucoseRepository.create({
      userId: "u1",
      value: 128,
      unit: "mg/dL",
      context: "fasting",
      measuredAt: new Date().toISOString(),
      notes: "nota sensível",
    });

    const raw = await getDatabase().glucoseReadings.get(created.id);
    expect(raw?.notes).toSatisfy(isEncryptedPayload);

    const read = await glucoseRepository.findById(created.id);
    expect(read?.notes).toBe("nota sensível");
  });

  it("encrypts meal description/notes and leafs queryable fields plaintext", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) return;
    setSessionDataKey(keys.data.dataKey);

    const created = await mealRepository.create({
      userId: "u1",
      type: "breakfast",
      description: "descrição sensível",
      consumedAt: new Date().toISOString(),
      notes: "nota da refeição",
    });

    const raw = await getDatabase().meals.get(created.id);
    expect(raw?.description).toSatisfy(isEncryptedPayload);
    expect(raw?.notes).toSatisfy(isEncryptedPayload);
    // Queryable/indexed fields stay plaintext.
    expect(raw?.type).toBe("breakfast");
    expect(raw?.userId).toBe("u1");

    const read = await mealRepository.findById(created.id);
    expect(read?.description).toBe("descrição sensível");
    expect(read?.notes).toBe("nota da refeição");
  });

  it("encrypts activity notes", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) return;
    setSessionDataKey(keys.data.dataKey);

    const created = await activityRepository.create({
      userId: "u1",
      type: "walking",
      durationMinutes: 30,
      startedAt: new Date().toISOString(),
      notes: "atividade sensível",
    });

    const raw = await getDatabase().activities.get(created.id);
    expect(raw?.notes).toSatisfy(isEncryptedPayload);

    const read = await activityRepository.findById(created.id);
    expect(read?.notes).toBe("atividade sensível");
  });

  it("encrypts note content", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) return;
    setSessionDataKey(keys.data.dataKey);

    const created = await noteRepository.create({
      userId: "u1",
      content: "conteúdo sensível",
    });

    const raw = await getDatabase().notes.get(created.id);
    expect(raw?.content).toSatisfy(isEncryptedPayload);

    const read = await noteRepository.findById(created.id);
    expect(read?.content).toBe("conteúdo sensível");
  });

  it("leaves data plaintext when no key is set", async () => {
    const created = await noteRepository.create({
      userId: "u1",
      content: "sem chave",
    });

    const raw = await getDatabase().notes.get(created.id);
    expect(raw?.content).toBe("sem chave");

    const read = await noteRepository.findById(created.id);
    expect(read?.content).toBe("sem chave");
  });

  it("returns undefined for encrypted fields when read without the key", async () => {
    const keys = await cryptoService.createUserKeys("senha");
    if (!keys.ok) return;
    setSessionDataKey(keys.data.dataKey);

    const created = await glucoseRepository.create({
      userId: "u1",
      value: 100,
      unit: "mg/dL",
      context: "before_meal",
      measuredAt: new Date().toISOString(),
      notes: "segredo",
    });

    clearSessionDataKey();

    const read = await glucoseRepository.findById(created.id);
    expect(read?.notes).toBeUndefined();
  });
});
