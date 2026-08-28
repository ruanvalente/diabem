"use client";

import { useCallback } from "react";
import type { Note } from "@/lib/db/types";
import type {
  NoteFilter,
  SaveNoteInput,
  ServiceResult,
  UpdateNoteInput,
} from "@/lib/health/types";
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
} from "@/lib/health/note.service";
import { useEntityRecords } from "./use-entity-records";

const UNAUTHENTICATED: ServiceResult<Note> = {
  ok: false,
  error: "Usuário não autenticado",
};

export function useNotes(userId: string | null) {
  const entity = useEntityRecords<Note, NoteFilter>(userId, listNotes);
  const { reload } = entity;

  const create = useCallback(
    async (input: SaveNoteInput): Promise<ServiceResult<Note>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await createNote(userId, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateNoteInput
    ): Promise<ServiceResult<Note>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await updateNote(userId, id, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const remove = useCallback(
    async (id: string): Promise<ServiceResult<{ id: string }>> => {
      if (!userId) return { ok: false, error: "Usuário não autenticado" };
      const result = await deleteNote(userId, id);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  return { ...entity, create, update, remove };
}