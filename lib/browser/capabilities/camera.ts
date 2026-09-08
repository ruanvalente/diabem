/**
 * Capability detection for the Camera / MediaDevices API.
 *
 * Detection must be safe during SSR. `navigator.mediaDevices.getUserMedia` is
 * required for camera access. Whether the permission is already granted is
 * evaluated lazily through `permissions.query` when available.
 */

import { isBrowser, isSecureContext } from "../environment";

/**
 * Result of the capability check for camera access.
 */
export type CameraCapability = {
  supported: boolean;
  secureContext: boolean;
};

/**
 * Whether camera access is available in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires a secure context.
 * - Requires `navigator.mediaDevices?.getUserMedia`.
 */
export function cameraCapability(): CameraCapability {
  if (!isBrowser) {
    return { supported: false, secureContext: false };
  }

  const secureContext = isSecureContext();

  const supported =
    secureContext &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  return { supported, secureContext };
}

export const cameraSupported = (): boolean => cameraCapability().supported;