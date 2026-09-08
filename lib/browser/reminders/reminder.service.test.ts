import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../environment", () => ({
  isBrowser: true,
  isSecureContext: () => true,
}));

import { reminderService } from "./reminder.service";

describe("reminderService", () => {
  let store: Record<string, string>;
  let mockGetItem: ReturnType<typeof vi.fn>;
  let mockSetItem: ReturnType<typeof vi.fn>;
  let mockClear: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = {};
    mockGetItem = vi.fn((key: string) => store[key] ?? null);
    mockSetItem = vi.fn((key: string, value: string) => {
      store[key] = value;
    });
    mockClear = vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        clear: mockClear,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("list", () => {
    it("returns empty array when no reminders exist", () => {
      expect(reminderService.list()).toEqual([]);
    });
  });

  describe("save", () => {
    it("creates a reminder with id and createdAt", () => {
      const reminder = reminderService.save({
        title: "Test reminder",
        scheduledAt: new Date().toISOString(),
      });
      expect(reminder.id).toBeDefined();
      expect(reminder.title).toBe("Test reminder");
      expect(reminder.createdAt).toBeDefined();
    });

    it("persists reminders to localStorage", () => {
      reminderService.save({
        title: "First",
        scheduledAt: new Date().toISOString(),
      });
      reminderService.save({
        title: "Second",
        scheduledAt: new Date().toISOString(),
      });
      const reminders = reminderService.list();
      expect(reminders).toHaveLength(2);
      expect(reminders[0].title).toBe("First");
      expect(reminders[1].title).toBe("Second");
    });
  });

  describe("remove", () => {
    it("removes a reminder by id", () => {
      const r1 = reminderService.save({
        title: "First",
        scheduledAt: new Date().toISOString(),
      });
      const r2 = reminderService.save({
        title: "Second",
        scheduledAt: new Date().toISOString(),
      });
      reminderService.remove(r1.id);
      const reminders = reminderService.list();
      expect(reminders).toHaveLength(1);
      expect(reminders[0].id).toBe(r2.id);
    });
  });

  describe("clear", () => {
    it("removes all reminders", () => {
      reminderService.save({
        title: "First",
        scheduledAt: new Date().toISOString(),
      });
      reminderService.save({
        title: "Second",
        scheduledAt: new Date().toISOString(),
      });
      reminderService.clear();
      expect(reminderService.list()).toEqual([]);
    });
  });
});
