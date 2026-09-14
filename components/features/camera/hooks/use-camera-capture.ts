"use client";

import { useCallback, useState } from "react";
import { useCamera } from "@/lib/browser/hooks/use-camera";
import { cameraService } from "@/lib/browser/services/camera.service";
import type { CameraCaptureResult } from "../types/camera-capture.types";

type UseCameraCaptureOptions = {
  onCapture: (result: CameraCaptureResult) => void;
  onCancel: () => void;
};

/**
 * Orchestrates the full camera capture flow: start, capture a frame,
 * confirm, retake or cancel. Exposes presentation state for
 * `CameraCaptureUI`.
 *
 * - Stops the stream on confirm or cancel.
 * - Never reports a frame until capture succeeds.
 */
export function useCameraCapture({
  onCapture,
  onCancel,
}: UseCameraCaptureOptions) {
  const { state, supported, stream, error, start, stop } = useCamera();
  const [captured, setCaptured] = useState<CameraCaptureResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const result = await cameraService.capture();
      if (result.ok) {
        setCaptured({
          dataUrl: result.dataUrl,
          blob: result.blob,
          width: result.width,
          height: result.height,
        });
      }
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const confirm = useCallback(() => {
    if (captured) {
      onCapture(captured);
    }
    stop();
  }, [captured, onCapture, stop]);

  const retake = useCallback(() => {
    setCaptured(null);
  }, []);

  const cancel = useCallback(() => {
    stop();
    onCancel();
  }, [stop, onCancel]);

  return {
    state,
    supported,
    stream,
    error,
    captured,
    isCapturing,
    start,
    capture,
    confirm,
    retake,
    cancel,
  };
}
