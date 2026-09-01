import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "@/lib/db/database";
import {
  clearSessionDataKey,
  getSessionDataKey,
} from "@/lib/db/session-key";
import { decryptPayload, isEncryptedPayload } from "@/lib/crypto/encryption";
import type { EncryptedPayload } from "@/lib/crypto/crypto.types";
import { login, logout, register } from "@/lib/auth/auth.service";
import { mealRepository } from "@/lib/db/repositories/meal.repository";
import { noteRepository } from "@/lib/db/repositories/note.repository";

const ALICE = {
  name: "Alice",
  email: "alice@test.com",
  password: "Senha123",
  confirmPassword: "Senha123",
};

const BOB = {
  name: "Bob",
  email: "bob@test.com",
  password: "Senha123",
  confirmPassword: "Senha123",
};

beforeEach(async () => {
  clearSessionDataKey();
  const db = getDatabase();
  await db.users.clear();
  await db.sessions.clear();
  await db.notes.clear();
  await db.meals.clear();
});

async function registerUser(user: typeof ALICE) {
  const result = await register(user);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

describe("user data isolation", () => {
  it("stores sensitive fields encrypted at rest, never as plaintext", async () => {
    const alice = await registerUser(ALICE);
    const note = await noteRepository.create({
      userId: alice.id,
      content: "Ajuste basal da insulina",
    });
    const meal = await mealRepository.create({
      userId: alice.id,
      type: "lunch",
      description: "Arroz, feijão e frango",
      notes: "almoço pós-treino",
      consumedAt: new Date().toISOString(),
    });

    const db = getDatabase();
    const rawNote = await db.notes.get(note.id);
    const rawMeal = await db.meals.get(meal.id);

    expect(isEncryptedPayload(rawNote?.content)).toBe(true);
    expect((rawNote?.content as unknown as EncryptedPayload).data).not.toContain(
      "insulina"
    );

    expect(isEncryptedPayload(rawMeal?.description)).toBe(true);
    expect(isEncryptedPayload(rawMeal?.notes)).toBe(true);
    expect((rawMeal?.notes as unknown as EncryptedPayload).data).not.toContain(
      "almoço"
    );
  });

  it("scopes every query to the active user", async () => {
    const { alice, note, meal } = await seedAliceData();
    const bob = await registerUser(BOB);

    await expect(noteRepository.findByUser(bob.id)).resolves.toHaveLength(0);
    await expect(mealRepository.findByUser(bob.id)).resolves.toHaveLength(0);
    await expect(noteRepository.countByUser(bob.id)).resolves.toBe(0);
    await expect(mealRepository.countByUser(bob.id)).resolves.toBe(0);

    // Alice's data remains reachable through Alice's scope.
    const aliceNotes = await noteRepository.findByUser(alice.id);
    const aliceMeals = await mealRepository.findByUser(alice.id);
    expect(aliceNotes.map((n) => n.id)).toContain(note.id);
    expect(aliceMeals.map((m) => m.id)).toContain(meal.id);
  });

  it("cannot decrypt another user's ciphertext with the active key", async () => {
    const { note } = await seedAliceData();

    const aliceKey = getSessionDataKey();
    expect(aliceKey).not.toBeNull();

    await registerUser(BOB);
    const bobKey = getSessionDataKey();
    expect(bobKey).not.toBeNull();
    expect(bobKey?.material).not.toBe(aliceKey?.material);

    const db = getDatabase();
    const rawNote = await db.notes.get(note.id);
    expect(isEncryptedPayload(rawNote?.content)).toBe(true);

    const result = await decryptPayload(
      bobKey!,
      rawNote!.content as unknown as EncryptedPayload
    );
    expect(result.ok).toBe(false);
  });

  it("wipes the key on logout and restores readability on re-login", async () => {
    const { note } = await seedAliceData();
    expect(getSessionDataKey()).not.toBeNull();

    await logout();
    expect(getSessionDataKey()).toBeNull();

    const loginResult = await login({
      email: ALICE.email,
      password: ALICE.password,
    });
    expect(loginResult.ok).toBe(true);
    expect(getSessionDataKey()).not.toBeNull();

    const restored = await noteRepository.findById(note.id);
    expect(restored?.content).toBe("Ajuste basal da insulina");
  });
});

async function seedAliceData() {
  const alice = await registerUser(ALICE);
  const note = await noteRepository.create({
    userId: alice.id,
    content: "Ajuste basal da insulina",
  });
  const meal = await mealRepository.create({
    userId: alice.id,
    type: "lunch",
    description: "Arroz, feijão e frango",
    notes: "almoço pós-treino",
    consumedAt: new Date().toISOString(),
  });
  return { alice, note, meal };
}