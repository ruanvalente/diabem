/**
 * In-memory counter of notifications actually presented to the user.
 *
 * The scheduler only delivers reminders while the application is open, so this
 * counter describes the current session and is cleared when a session starts.
 * It intentionally stores no health data and is never persisted: the browser
 * notification centre remains the source of truth for the notifications
 * themselves.
 *
 * The count is owned by a user id, so a read for a different user resolves to
 * zero even before the new session has been announced, and a delivery that
 * resolves after the session changed is dropped instead of being attributed to
 * the next user. Sign-out and sign-in happen across a client-side navigation
 * that keeps this module alive, which would otherwise expose or absorb the
 * previous user's count.
 */
export type DeliveredNotificationLog = {
  subscribe: (listener: () => void) => () => void;
  getCountFor: (userId: string | null) => number;
  beginSession: (userId: string) => void;
  recordFor: (userId: string) => void;
};

export function createDeliveredNotificationLog(): DeliveredNotificationLog {
  let owner: string | null = null;
  let count = 0;
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getCountFor: (userId) => (owner !== null && owner === userId ? count : 0),
    beginSession(userId) {
      owner = userId;
      count = 0;
      notify();
    },
    // Both sides of the counter are scoped to the owner. A delivery that
    // resolves after the session changed belongs to the previous user, so it
    // must not land on whoever opened the application next.
    recordFor(userId) {
      if (owner !== userId) return;
      count += 1;
      notify();
    },
  };
}

export const deliveredNotificationLog = createDeliveredNotificationLog();
