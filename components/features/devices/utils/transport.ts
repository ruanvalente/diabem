import type { DeviceTransport } from "@/lib/devices";

/**
 * Human-friendly PT-BR labels for each device transport.
 */
export const TRANSPORT_LABEL: Record<DeviceTransport, string> = {
  bluetooth: "Bluetooth",
  serial: "USB / Serial",
};