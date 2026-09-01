/**
 * Service Worker update / lifecycle management.
 *
 * Detects when a new version of the application is available (a new Service
 * Worker is waiting) and exposes helpers to trigger an update, without
 * interrupting an in-progress operation (the actual reload is user-initiated).
 */

export type UpdateState =
  | { status: "unknown" }
  | { status: "checking" }
  | { status: "up-to-date" }
  | { status: "update-available"; registration: ServiceWorkerRegistration }
  | { status: "error"; error: string };

/**
 * Returns a promise that resolves to "update-available" when a new Service
 * Worker is found and installed (waiting).
 */
export function checkForUpdates(): Promise<UpdateState> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !navigator.serviceWorker.controller
  ) {
    return Promise.resolve({ status: "unknown" });
  }

  return new Promise((resolve) => {
    let settled = false;

    const settleUpdateFound = (registration: ServiceWorkerRegistration) => {
      if (settled) return;
      settled = true;
      if (registration.waiting) {
        resolve({ status: "update-available", registration });
      } else {
        resolve({ status: "up-to-date" });
      }
    };

    navigator.serviceWorker.ready.then((registration) => {
      // If a "waiting" worker already exists, an update is available.
      if (registration.waiting) {
        settleUpdateFound(registration);
        return;
      }

      const onUpdateFound = () => settleUpdateFound(registration);
      registration.addEventListener("updatefound", onUpdateFound, { once: true });

      // If nothing arrives after a short check, call update() anyway.
      try {
        registration.update();
      } catch {
        /* ignore */
      }

      // Safety timeout in case updatefound does not fire.
      setTimeout(() => {
        if (!settled && registration.waiting) {
          settleUpdateFound(registration);
        }
      }, 4000);
    }).catch((error) => {
      if (!settled) {
        settled = true;
        resolve({
          status: "error",
          error: error instanceof Error ? error.message : "Erro ao verificar atualização",
        });
      }
    });
  });
}

/**
 * Asks the waiting Service Worker to skipWaiting, then reloads the page to
 * apply the new version. Returns true when an update was applied.
 */
export async function applyUpdate(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const { waiting } = registration;
  if (!waiting) {
    return false;
  }

  waiting.postMessage({ type: "SKIP_WAITING" });

  const controllerChange = new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
      once: true,
    });
  });

  await controllerChange;
  window.location.reload();
  return true;
}
