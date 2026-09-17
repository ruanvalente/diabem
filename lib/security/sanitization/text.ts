/**
 * Text sanitization and length policy.
 *
 * Centralized limits and normalization for user-supplied free-text fields
 * (notes, meal descriptions, note content). Every boundary — form schemas,
 * CSV/JSON import and export guards — must honor these constants so the app
 * has a single, consistent text policy.
 *
 * Sanitization here means: type coercion for primitive scalars, trimming and
 * explicit length clamping/validation. It does NOT strip markup from free
 * text — DiaBem renders all user text as React text nodes (auto-escaped), so
 * HTML stripping is unnecessary and would mutate data. There is no rich-text
 * / HTML rendering sink in the application.
 */

/** Maximum length for short annotations (glucose/meal/activity notes). */
export const MAX_NOTE_LENGTH = 500;

/** Maximum length for meal descriptions. */
export const MAX_DESCRIPTION_LENGTH = 500;

/** Maximum length for standalone notes (persisted observations). */
export const MAX_CONTENT_LENGTH = 2_000;

/** Maximum length for medication name. */
export const MAX_MEDICATION_NAME_LENGTH = 100;

/** Maximum length for the free-text dosage value (e.g. "500" or "1,5"). */
export const MAX_MEDICATION_DOSAGE_LENGTH = 30;

/** Maximum length for medication unit / frequency / route fields. */
export const MAX_MEDICATION_TEXT_LENGTH = 100;

/**
 * Coerces a primitive scalar (string/number/boolean) to a trimmed string.
 * Returns `undefined` for anything else (objects, arrays, null), so callers
 * can reject non-text payloads instead of stringifying them into the store.
 */
export function toPlainText(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return undefined;
}

/**
 * Clamps a string to `maxLength` by character count while keeping the
 * original value unmodified when it already fits. Used only where silent
 * truncation is the intended policy (e.g. display formatting).
 */
export function clampText(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

/**
 * Validates that a value is plain text and does not exceed `maxLength`.
 * Returns the normalized string, or `undefined` when invalid (wrong type,
 * empty after trimming, or over the limit).
 */
export function validateText(
  value: unknown,
  maxLength: number,
): string | undefined {
  const text = toPlainText(value);
  if (text === undefined || text.length === 0) return undefined;
  if (text.length > maxLength) return undefined;
  return text;
}