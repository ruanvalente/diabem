/**
 * URL validation for user-supplied links.
 *
 * DiaBem never renders user text as HTML, but defense-in-depth requires any
 * URL sourced from imported data or user input to be validated before it is
 * used in an `href`/navigation context. This guards against dangerous schemes
 * (`javascript:`, `data:`, `vbscript:`) and open-redirect style abuse.
 */

const SAFE_HTTP_SCHEME = /^https?:$/i;

const BLOCKED_SCHEMES = /^(javascript|vbscript|data):/i;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * Returns `true` when a string is a safe navigation target:
 * - a relative path (`/foo`, `#anchor`, `?query`, bare segment), or
 * - an absolute `http:` / `https:` URL.
 *
 * Values containing control characters, dangerous schemes (`javascript:`,
 * `data:`, `vbscript:`), empty strings or oversized strings are rejected.
 */
export function isSafeUrl(value: string): boolean {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 2048) return false;
  if (CONTROL_CHARS.test(trimmed)) return false;
  if (BLOCKED_SCHEMES.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed, "https://localhost");
    if (parsed.origin === "https://localhost") return true;
    return SAFE_HTTP_SCHEME.test(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Returns `value` when it is a safe URL, otherwise `null`. Intended for
 * constructing an `href` only when the value is known to be safe.
 */
export function safeHref(value: string): string | null {
  return isSafeUrl(value) ? value : null;
}