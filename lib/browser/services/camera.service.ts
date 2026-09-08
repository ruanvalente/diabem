/**
 * CameraService
 *
 * Encapsulates access to the device camera via MediaDevices / getUserMedia so
 * UI components never touch `navigator.mediaDevices` directly. The service is
 * responsible for:
 * - capability detection;
 * - requesting permission (on explicit user action);
 * - starting/stopping a MediaStream;
 * - capturing a frame as a Blob / image data URL.
 *
 * Privacy contract:
 * - the camera only starts after an explicit user action;
 * - tracks are stopped when no longer needed (stop / capture / dispose);
 * - no image is sent automatically; only handled by the caller after
 *   user confirmation.
 */

import { cameraSupported } from "../capabilities/camera";
import { isBrowser } from "../environment";

export type CameraResult =
  | { ok: true; blob: Blob; dataUrl: string; width: number; height: number }
  | { ok: false; reason: CameraErrorReason };

export type CameraErrorReason =
  | "unsupported"
  | "permission-denied"
  | "camera-unavailable"
  | "capture-failed"
  | "unknown";

export type CameraStartResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; reason: CameraErrorReason };

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "environment",
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

class CameraService {
  private stream: MediaStream | null = null;

  isSupported(): boolean {
    return cameraSupported();
  }

  isStreaming(): boolean {
    return this.stream !== null;
  }

  async start(): Promise<CameraStartResult> {
    if (!this.isSupported() || !isBrowser) {
      return { ok: false, reason: "unsupported" };
    }

    if (this.stream) {
      return { ok: true, stream: this.stream };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: VIDEO_CONSTRAINTS,
        audio: false,
      });
      this.stream = stream;
      return { ok: true, stream };
    } catch (error) {
      return { ok: false, reason: this.mapStartError(error) };
    }
  }

  /**
   * Stop the current stream and release camera resources.
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Capture a single frame from the active stream as a Blob and a data URL.
   * The stream is left running so the user can retake if needed.
   */
  async capture(width = 1280): Promise<CameraResult> {
    const stream = this.stream;
    if (!stream) {
      return { ok: false, reason: "camera-unavailable" };
    }

    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("playsinline", "");
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
      video.muted = true;
      void video.load();
    });
    await video.play();

    const canvas = document.createElement("canvas");
    const ratio = video.videoHeight / (video.videoWidth || 1) || 1;
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ok: false, reason: "capture-failed" };
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );
      if (!blob) {
        return { ok: false, reason: "capture-failed" };
      }
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      return {
        ok: true,
        blob,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
      };
    } catch {
      return { ok: false, reason: "capture-failed" };
    }
  }

  /**
   * Convenience: capture a frame and immediately stop the stream.
   */
  async captureAndStop(width = 1280): Promise<CameraResult> {
    const result = await this.capture(width);
    this.stop();
    return result;
  }

  private mapStartError(error: unknown): CameraErrorReason {
    const name = (error as DOMException)?.name ?? "";
    switch (name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "permission-denied";
      case "NotFoundError":
      case "OverconstrainedError":
        return "camera-unavailable";
      default:
        return "unknown";
    }
  }
}

export const cameraService = new CameraService();

export type CameraServiceInstance = CameraService;