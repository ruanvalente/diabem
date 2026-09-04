"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cameraService,
  type CameraErrorReason,
} from "../services/camera.service";
import { cameraSupported } from "../capabilities/camera";

export type CameraState = "idle" | "starting" | "streaming" | "error";

/**
 * React hook wrapping `CameraService`.
 *
 * Manages lifecycle safety: the stream is stopped when the component unmounts,
 * when the tab loses focus, and when a new capture session ends. The camera
 * only starts through `start()`, which must run from a user gesture.
 */
export function useCamera(): {
  state: CameraState;
  supported: boolean;
  stream: MediaStream | null;
  error: CameraErrorReason | null;
  start: () => Promise<void>;
  stop: () => void;
} {
  const [state, setState] = useState<CameraState>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraErrorReason | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    cameraService.stop();
    streamRef.current = null;
    setStream(null);
    setState("idle");
    setError(null);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      cameraService.stop();
    };
  }, [stop]);

  const start = useCallback(async () => {
    if (!cameraSupported()) {
      setError("unsupported");
      setState("error");
      return;
    }
    setState("starting");
    setError(null);
    const result = await cameraService.start();
    if (result.ok) {
      streamRef.current = result.stream;
      setStream(result.stream);
      setState("streaming");
    } else {
      setError(result.reason);
      setState(result.reason === "permission-denied" ? "idle" : "error");
    }
  }, []);

  return { state, supported: cameraSupported(), stream, error, start, stop };
}