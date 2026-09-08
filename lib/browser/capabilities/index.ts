/**
 * Central capability detection for browser/device APIs.
 *
 * UI components and features MUST NOT inspect `window`, `navigator` or browser
 * globals directly. They should consult this module (or the individual
 * capability helpers) instead, so capability detection is consistent, SSR-safe
 * and testable.
 */

import {
  notificationsCapability,
  notificationsSupported,
  type NotificationCapability,
} from "./notifications";
import {
  speechRecognitionCapability,
  speechRecognitionSupported,
  type SpeechRecognitionCapability,
} from "./speech-recognition";
import {
  cameraCapability,
  cameraSupported,
  type CameraCapability,
} from "./camera";
import {
  bluetoothCapability,
  serialCapability,
  nfcCapability,
  fileSystemCapability,
  deviceBluetoothSupported,
  deviceSerialSupported,
  deviceNfcSupported,
  deviceFileSystemSupported,
  type DeviceCapability,
} from "./devices";

/**
 * Snapshot of the capabilities of the current environment for the browser APIs
 * used by the application.
 */
export type BrowserCapabilities = {
  notifications: NotificationCapability;
  speechRecognition: SpeechRecognitionCapability;
  camera: CameraCapability;
  /** Device connection capabilities (Sprint 9 — Device Integrations). */
  devices: DeviceCapabilities;
};

/**
 * Device connection capabilities grouped together. No code in the domain should
 * inspect the underlying browser globals directly; it should consume these.
 */
export type DeviceCapabilities = {
  bluetooth: DeviceCapability;
  serial: DeviceCapability;
  nfc: DeviceCapability;
  fileSystem: DeviceCapability;
};

/**
 * Resolve the full set of capabilities. Safe to call during SSR and from any
 * module; individual detection helpers short-circuit outside a browser.
 */
export function browserCapabilities(): BrowserCapabilities {
  return {
    notifications: notificationsCapability(),
    speechRecognition: speechRecognitionCapability(),
    camera: cameraCapability(),
    devices: {
      bluetooth: bluetoothCapability(),
      serial: serialCapability(),
      nfc: nfcCapability(),
      fileSystem: fileSystemCapability(),
    },
  };
}

export {
  notificationsCapability,
  notificationsSupported,
  speechRecognitionCapability,
  speechRecognitionSupported,
  cameraCapability,
  cameraSupported,
  bluetoothCapability,
  serialCapability,
  nfcCapability,
  fileSystemCapability,
  deviceBluetoothSupported,
  deviceSerialSupported,
  deviceNfcSupported,
  deviceFileSystemSupported,
};

export type {
  NotificationCapability,
  SpeechRecognitionCapability,
  CameraCapability,
  DeviceCapability,
};