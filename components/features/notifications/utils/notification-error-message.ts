/**
 * Returns the copy the user reads for a caught value: the cause's own message
 * when it is an `Error` carrying one, and `fallback` otherwise.
 *
 * The function does not classify the failure. Validators reject with messages
 * written for the user, which is why this is safe for them, but a storage
 * failure rejects with an `Error` too and its technical message would be shown
 * as well. Callers that must never surface technical text must not read the
 * cause at all and use a fixed message instead, as the `setEnabled` mutation
 * does.
 */
export function messageFromCause(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}