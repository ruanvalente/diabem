import type { Medication } from "../db/types";

/**
 * Joins a medication's optional clinical fields into a compact, single-line
 * summary ("500 mg · 2x ao dia · oral"). Dosage and unit are kept together and
 * the unit is only shown when a dosage is present. Returns an empty string when
 * no clinical detail was recorded.
 */
export function formatMedicationDetails(record: Medication): string {
  const parts: string[] = [];
  if (record.dosage) {
    parts.push(record.unit ? `${record.dosage} ${record.unit}` : record.dosage);
  }
  if (record.frequency) parts.push(record.frequency);
  if (record.route) parts.push(record.route);
  return parts.join(" · ");
}