/**
 * Environment detection helpers that are safe to call during Server-Side
 * Rendering. They never throw and never access browser-only globals outside a
 * browser context.
 */

export const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

/**
 * Whether the current document runs in a secure context (HTTPS or localhost).
 *
 * Returns `false` during SSR and in insecure contexts. Several Progressive Web
 * APIs (Notifications, Camera, Speech Recognition) require a secure context.
 */
export function isSecureContext(): boolean {
  if (!isBrowser) return false;
  return (
    typeof window.isSecureContext === "boolean" ? window.isSecureContext : false
  );
}