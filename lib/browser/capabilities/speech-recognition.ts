/**
 * Capability detection for the Speech Recognition API.
 *
 * The API is not standardized and is exposed under vendor prefixes
 * (`webkitSpeechRecognition`). Detection must be safe during SSR and must also
 * respect the mic permission so the UI can distinguish "supported but not
 * permitted" from "not supported".
 */

import { isBrowser, isSecureContext } from "../environment";

/**
 * Result of the capability check for speech recognition.
 */
export type SpeechRecognitionCapability = {
  supported: boolean;
  secureContext: boolean;
};

/**
 * Whether the Speech Recognition API is available in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires a secure context.
 * - Accepts either `SpeechRecognition` or the `webkitSpeechRecognition` prefix.
 */
export function speechRecognitionCapability(): SpeechRecognitionCapability {
  if (!isBrowser) {
    return { supported: false, secureContext: false };
  }

  const secureContext = isSecureContext();

  const lookup =
    (window as unknown as Record<string, unknown>) ?? {};

  const supported =
    secureContext &&
    (lookup.SpeechRecognition !== undefined ||
      lookup.webkitSpeechRecognition !== undefined);

  return { supported, secureContext };
}

export const speechRecognitionSupported = (): boolean =>
  speechRecognitionCapability().supported;