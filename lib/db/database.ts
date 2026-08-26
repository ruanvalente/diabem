import Dexie, { type Table } from "dexie";
import type { User, LocalSession } from "./types";

const DB_NAME = "diabem";
const DB_VERSION = 1;

class DiaBemDatabase extends Dexie {
  users!: Table<User, string>;
  sessions!: Table<LocalSession, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      users: "id, email, createdAt",
      sessions: "id, userId, createdAt",
    });
  }
}

let dbInstance: DiaBemDatabase | null = null;

export function getDatabase(): DiaBemDatabase {
  if (!dbInstance) {
    dbInstance = new DiaBemDatabase();
  }
  return dbInstance;
}

export type { DiaBemDatabase };
