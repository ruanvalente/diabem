import { describe, it, expect } from "vitest";
import { formatDateTime } from "./format-date-time";

describe("formatDateTime", () => {
  it("formats a valid ISO date as dd/mm às hh:mm in the pt-BR locale", () => {
    const iso = "2026-09-23T14:05:00.000Z";
    const out = formatDateTime(iso);
    expect(out).toContain(" às ");
    expect(out).toMatch(/^\d{2}\/\d{2}/);
  });

  it("returns the input unchanged when the date is invalid", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });
});