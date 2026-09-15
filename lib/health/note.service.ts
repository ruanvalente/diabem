import { noteSchema } from "../db/schema";
import { noteRepository } from "../db/repositories/note.repository";
import type { Note } from "../db/types";
import type {
  NoteFilter,
  SaveNoteInput,
  ServiceResult,
  UpdateNoteInput,
} from "./types";
import { firstErrorMessage } from "./validation";
import { recordAuditAsync } from "../audit";

export async function createNote(
  userId: string,
  input: SaveNoteInput
): Promise<ServiceResult<Note>> {
  const validation = noteSchema.safeParse(input);
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const now = new Date().toISOString();
  const record = await noteRepository.create({
    userId,
    content: validation.data.content,
    provenance: {
      source: input.provenanceSource ?? "manual",
      recordedAt: now,
    },
  });

  recordAuditAsync("record.created", "note", userId, record.id);

  return { ok: true, data: record };
}

export async function updateNote(
  userId: string,
  id: string,
  input: UpdateNoteInput
): Promise<ServiceResult<Note>> {
  const existing = await noteRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  const validation = noteSchema.partial().safeParse(input);
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const updated = await noteRepository.update(id, validation.data);
  if (!updated) {
    return { ok: false, error: "Registro não encontrado" };
  }

  recordAuditAsync("record.updated", "note", userId, id);

  return { ok: true, data: updated };
}

export async function listNotes(
  userId: string,
  filter: NoteFilter = {}
): Promise<ServiceResult<Note[]>> {
  const records = await noteRepository.findByUser(userId, filter);
  return { ok: true, data: records };
}

export async function deleteNote(
  userId: string,
  id: string
): Promise<ServiceResult<{ id: string }>> {
  const existing = await noteRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  await noteRepository.deleteById(id);
  recordAuditAsync("record.deleted", "note", userId, id);
  return { ok: true, data: { id } };
}