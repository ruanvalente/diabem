import { getDatabase } from "../database";
import type { User } from "../types";

function getTable() {
  return getDatabase().users;
}

async function create(
  data: Omit<User, "id" | "createdAt" | "updatedAt">
): Promise<User> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const user: User = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await getTable().add(user);
  return user;
}

async function findById(id: string): Promise<User | undefined> {
  return getTable().get(id);
}

async function findByEmail(email: string): Promise<User | undefined> {
  return getTable().where("email").equals(email).first();
}

async function update(
  id: string,
  data: Partial<Pick<User, "name" | "email" | "passwordHash" | "passwordSalt">>
): Promise<User | undefined> {
  const existing = await getTable().get(id);
  if (!existing) return undefined;

  const updated: User = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await getTable().put(updated);
  return updated;
}

async function deleteById(id: string): Promise<boolean> {
  const deleted = await getTable().delete(id);
  return deleted === undefined;
}

async function count(): Promise<number> {
  return getTable().count();
}

export const userRepository = {
  create,
  findById,
  findByEmail,
  update,
  deleteById,
  count,
};
