import { describe, it, expect } from "vitest";
import type { Medication } from "../db/types";
import { formatMedicationDetails } from "./medication-display";

const base: Medication = {
  id: "m1",
  userId: "user-a",
  name: "Metformina",
  medicatedAt: "2026-08-28T08:30:00.000Z",
  createdAt: "2026-08-28T08:30:00.000Z",
  updatedAt: "2026-08-28T08:30:00.000Z",
};

describe("formatMedicationDetails", () => {
  it("returns an empty string when no clinical detail is recorded", () => {
    expect(formatMedicationDetails(base)).toBe("");
  });

  it("joins dosage and unit together", () => {
    expect(formatMedicationDetails({ ...base, dosage: "500", unit: "mg" })).toBe(
      "500 mg",
    );
  });

  it("shows dosage without a unit when no unit is recorded", () => {
    expect(formatMedicationDetails({ ...base, dosage: "500" })).toBe("500");
  });

  it("joins all clinical fields in order", () => {
    expect(
      formatMedicationDetails({
        ...base,
        dosage: "500",
        unit: "mg",
        frequency: "2x ao dia",
        route: "oral",
      }),
    ).toBe("500 mg · 2x ao dia · oral");
  });
});