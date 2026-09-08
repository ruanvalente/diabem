"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBrowserCapabilities } from "@/lib/browser/hooks/use-browser-capabilities";
import type { DeviceCapabilities } from "@/lib/browser/capabilities";
import {
  deviceIntegrationService,
  type ConnectedDevice,
  type SyncHistoryEntry,
} from "@/lib/devices";

export type LoadState = "loading" | "ready" | "error";

/**
 * Loads the device integration state for the current user: the browser device
 * capabilities, the registered devices and the sync history. Also exposes the
 * mutation actions (remove device) so the widget stays thin.
 */
export function useDevices(userId: string) {
  const capabilities = useBrowserCapabilities();
  const deviceCaps = capabilities?.devices ?? emptyCapabilities();

  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    try {
      const [deviceList, syncHistory] = await Promise.all([
        deviceIntegrationService.listDevices(userId),
        deviceIntegrationService.getSyncHistory(userId),
      ]);
      setDevices(deviceList);
      setHistory(syncHistory);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [userId]);

  const refresh = useCallback(() => {
    setState("loading");
    return load();
  }, [load]);

  useEffect(() => {
    // Initial fetch on mount. IndexedDB reads are local and there is no
    // external store to synchronize with, so the synchronous setState is
    // required.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load();
  }, [load]);

  const removeDevice = useCallback(
    async (deviceId: string) => {
      if (!userId) return;
      await deviceIntegrationService.removeDevice(userId, deviceId);
      await refresh();
    },
    [userId, refresh]
  );

  const anySupported = useMemo(
    () =>
      deviceCaps.bluetooth.supported ||
      deviceCaps.serial.supported ||
      deviceCaps.fileSystem.supported,
    [deviceCaps]
  );

  return {
    capabilities: deviceCaps,
    anySupported,
    devices,
    history,
    state,
    refresh,
    removeDevice,
  };
}

function emptyCapabilities(): DeviceCapabilities {
  return {
    bluetooth: { supported: false },
    serial: { supported: false },
    nfc: { supported: false },
    fileSystem: { supported: false },
  };
}
