"use client";

import { useCameraCapture } from "../hooks/use-camera-capture";
import { CameraCaptureUI } from "../ui/camera-capture.ui";
import type { CameraCaptureProps } from "../types/camera-capture.types";

export type {
  CameraCaptureResult,
  CameraCaptureProps,
} from "../types/camera-capture.types";

/**
 * Progressive-enhancement camera capture component.
 *
 * Delegates presentation to `CameraCaptureUI` and orchestration to
 * `useCameraCapture`. The camera only starts through a user gesture and
 * tracks are always stopped on confirm, cancel or unmount.
 */
export function CameraCapture({
  onCapture,
  onCancel,
  label = "Câmera",
}: CameraCaptureProps) {
  const {
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
  } = useCameraCapture({ onCapture, onCancel });

  return (
    <CameraCaptureUI
      label={label}
      supported={supported}
      state={state}
      stream={stream}
      error={error}
      captured={captured}
      isCapturing={isCapturing}
      onStart={start}
      onCapture={capture}
      onConfirm={confirm}
      onRetake={retake}
      onCancel={cancel}
    />
  );
}
