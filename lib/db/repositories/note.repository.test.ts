import { describe, it, expect, beforeEach } from "vitest";
import { getDatabase } from "../database";
import { noteRepository } from "./note.repository";

beforeEach(async () => {
  const db = getDatabase();
  await db.notes.clear();
});

describe("noteRepository", () => {
  it("creates a note with generated id, userId and timestamps", async () => {
    const note = await noteRepository.create({ userId: "user-a", content: "Hoje acordei bem." });
    expect(note.id).toBeTruthy();
    expect(note.userId).toBe("user-a");
    expect(note.content).toBe("Hoje acordei bem.");
    expect(note.createdAt).toBeTruthy();
  });

  it("isolates data per user and orders newest first", async () => {
    await noteRepository.create({ userId: "user-a", content: "Antiga" });
    await new Promise((r) => setTimeout(r, 10));
    await noteRepository.create({ userId: "user-a", content: "Nova" });
    await noteRepository.create({ userId: "user-b", content: "De outro usuário" });

    const userA = await noteRepository.findByUser("user-a");
    expect(userA.map((n) => n.content)).toEqual(["Nova", "Antiga"]);

    const userB = await noteRepository.findByUser("user-b");
    expect(userB.map((n) => n.content)).toEqual(["De outro usuário"]);
  });

  it("updates and deletes notes", async () => {
    const created = await noteRepository.create({ userId: "user-a", content: "Original" });
    const updated = await noteRepository.update(created.id, { content: "Editada" });
    expect(updated?.content).toBe("Editada");
    expect(await noteRepository.deleteById(created.id)).toBe(true);
    expect(await noteRepository.findById(created.id)).toBeUndefined();
  });

  it("counts only the user's notes", async () => {
    await noteRepository.create({ userId: "user-a", content: "1" });
    await noteRepository.create({ userId: "user-a", content: "2" });
    await noteRepository.create({ userId: "user-b", content: "3" });
    expect(await noteRepository.countByUser("user-a")).toBe(2);
  });
});