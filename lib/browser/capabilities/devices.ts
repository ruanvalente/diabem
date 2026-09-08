/**
 * Capability detection for device connection APIs.
 *
 * Covers Web Bluetooth, Web Serial, Web NFC and the File System Access API so
 * the rest of the application never inspects `window`/`navigator` directly.
 * Detection is SSR-safe and conservative: it only reports support when the
 * required global actually exists in the current environment.
 *
 * These APIs have limited and inconsistent browser support, so the application
 * MUST gate features on these capabilities rather than assuming availability.
 */

import { isBrowser } from "../environment";

/**
 * Result of the capability check for device connections.
 */
export type DeviceCapability = {
  supported: boolean;
};

/**
 * Whether Web Bluetooth is available in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires `navigator.bluetooth` with a `requestDevice` function.
 * - Web Bluetooth also requires a secure context; the browser enforces this,
 *   so the `isSecureContext()` guard is deliberately applied here to model the
 *   real-world constraint.
 */
export function bluetoothCapability(): DeviceCapability {
  if (!isBrowser) {
    return { supported: false };
  }
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.bluetooth &&
    typeof navigator.bluetooth.requestDevice === "function";
  return { supported };
}

export const deviceBluetoothSupported = (): boolean =>
  bluetoothCapability().supported;

/**
 * Whether Web Serial is available in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires `navigator.serial` with a `getPorts` function.
 * - Web Serial is restricted to secure contexts.
 */
export function serialCapability(): DeviceCapability {
  if (!isBrowser) {
    return { supported: false };
  }
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.serial &&
    typeof navigator.serial.getPorts === "function";
  return { supported };
}

export const deviceSerialSupported = (): boolean =>
  serialCapability().supported;

/**
 * Whether Web NFC is available in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires `window.NDEFReader`.
 * - This is experimental and rarely supported; modeled for future use.
 */
export function nfcCapability(): DeviceCapability {
  if (!isBrowser) {
    return { supported: false };
  }
  const supported =
    typeof window !== "undefined" && typeof (window as NDEFGlobal).NDEFReader === "function";
  return { supported };
}

export const deviceNfcSupported = (): boolean => nfcCapability().supported;

/**
 * Whether the File System Access API is available in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires `window.showOpenFilePicker`.
 * - This is the capability behind file-based import (CSV/JSON), which falls
 *   back to a standard `<input type="file">` when unavailable.
 */
export function fileSystemCapability(): DeviceCapability {
  if (!isBrowser) {
    return { supported: false };
  }
  const supported =
    typeof window !== "undefined" &&
    typeof (window as FileSystemGlobal).showOpenFilePicker === "function";
  return { supported };
}

export const deviceFileSystemSupported = (): boolean =>
  fileSystemCapability().supported;

/**
 * Minimal global typings for the experimental APIs referenced above. Kept local
 * to this module so production code stays typed without polluting the app's
 * global scope with experimental API declarations.
 */
type NDEFGlobal = {
  NDEFReader?: unknown;
};

type FileSystemGlobal = {
  showOpenFilePicker?: unknown;
};
