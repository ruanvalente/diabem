/**
 * PWA installation UX helper.
 *
 * Surfaces the browser's `beforeinstallprompt` event so the app can offer an
 * install button (instead of relying only on the browser's default prompt).
 * Falls back to a no-op when not installable (e.g. already installed, iOS.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installEventSeen = false;
const listeners = new Set<(available: boolean) => void>();

export function initInstallPrompt(): void {
  if (typeof window === "undefined" || installEventSeen) {
    return;
  }
  installEventSeen = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener(true));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((listener) => listener(false));
  });
}

export function onInstallPromptChange(
  listener: (available: boolean) => void,
): () => void {
  listeners.add(listener);
  listener(Boolean(deferredPrompt));
  return () => {
    listeners.delete(listener);
  };
}

export function isInstallPromptAvailable(): boolean {
  return Boolean(deferredPrompt);
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((listener) => listener(false));
  return choice.outcome === "accepted";
}
