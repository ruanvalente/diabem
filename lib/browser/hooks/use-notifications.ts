"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationService } from "../services/notification.service";
import { notificationsSupported } from "../capabilities/notifications";

export type PermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied"
  | "requesting";

export function useNotificationPermission(): {
  state: PermissionState;
  supported: boolean;
  request: () => Promise<void>;
} {
  const [state, setState] = useState<PermissionState>(() =>
    notificationService.getPermission()
  );

  useEffect(() => {
    if (notificationsSupported()) {
      setState(notificationService.getPermission());
    }
  }, []);

  const request = useCallback(async () => {
    if (!notificationsSupported()) {
      setState("unsupported");
      return;
    }
    setState("requesting");
    const result = await notificationService.requestPermission();
    if (result.ok) {
      setState(result.permission);
    } else {
      setState(notificationService.getPermission());
    }
  }, []);

  return { state, supported: notificationsSupported(), request };
}