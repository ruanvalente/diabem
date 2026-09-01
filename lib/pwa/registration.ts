/**
 * PWA / Service Worker registration.
 *
 * Registers the Service Worker only on supported secure origins (https or
 * localhost) and only in the browser. It is a pure client concern.
 */

const SW_PATH = "/sw.js";

type RegistrationResult =
  | { ok: true; registration: ServiceWorkerRegistration }
  | { ok: false; error: string };

export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

export async function registerServiceWorker(): Promise<RegistrationResult> {
  if (!isServiceWorkerSupported()) {
    return { ok: false, error: "Service Worker não suportado" };
  }

  if (!isSecureContext()) {
    return { ok: false, error: "Service Worker requer um contexto seguro" };
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);
    return { ok: true, registration };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao registrar Service Worker",
    };
  }
}
