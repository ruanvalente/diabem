// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/browser/hooks/use-camera", () => ({
  useCamera: vi.fn(),
}));

vi.mock("@/lib/browser/services/camera.service", () => ({
  cameraService: {
    capture: vi.fn(),
  },
}));

import { useCameraCapture } from "./use-camera-capture";
import { useCamera } from "@/lib/browser/hooks/use-camera";
import { cameraService } from "@/lib/browser/services/camera.service";

const mockUseCamera = vi.mocked(useCamera);
const mockCapture = vi.mocked(cameraService.capture);

function createHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    state: "idle" as const,
    supported: true,
    stream: null as MediaStream | null,
    error: null as null,
    start: vi.fn(),
    stop: vi.fn(),
    ...overrides,
  };
}

describe("useCameraCapture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCamera.mockReturnValue(createHookReturn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes camera state and supported flag from useCamera", () => {
    mockUseCamera.mockReturnValue(
      createHookReturn({ state: "streaming", supported: true }),
    );

    const { result } = renderHook(() =>
      useCameraCapture({ onCapture: vi.fn(), onCancel: vi.fn() }),
    );

    expect(result.current.state).toBe("streaming");
    expect(result.current.supported).toBe(true);
  });

  describe("capture", () => {
    it("sets isCapturing while awaiting the service and stores result on success", async () => {
      const resultBlob = new Blob(["img"], { type: "image/jpeg" });
      mockCapture.mockResolvedValue({
        ok: true,
        blob: resultBlob,
        dataUrl: "data:image/jpeg;base64,AAA",
        width: 640,
        height: 480,
      });

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture: vi.fn(), onCancel: vi.fn() }),
      );

      expect(result.current.captured).toBeNull();
      expect(result.current.isCapturing).toBe(false);

      await act(async () => {
        await result.current.capture();
      });

      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.captured).toEqual({
        dataUrl: "data:image/jpeg;base64,AAA",
        blob: resultBlob,
        width: 640,
        height: 480,
      });
    });

    it("does not store captured when capture fails", async () => {
      mockCapture.mockResolvedValue({
        ok: false,
        reason: "capture-failed",
      });

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture: vi.fn(), onCancel: vi.fn() }),
      );

      await act(async () => {
        await result.current.capture();
      });

      expect(result.current.captured).toBeNull();
      expect(result.current.isCapturing).toBe(false);
    });

    it("resets isCapturing when capture rejects", async () => {
      mockCapture.mockRejectedValue(new Error("boom"));

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture: vi.fn(), onCancel: vi.fn() }),
      );

      await act(async () => {
        await expect(result.current.capture()).rejects.toThrow("boom");
      });

      expect(result.current.captured).toBeNull();
      expect(result.current.isCapturing).toBe(false);
    });
  });

  describe("confirm", () => {
    it("calls onCapture with captured result and stops the camera", async () => {
      const onCapture = vi.fn();
      const stop = vi.fn();
      mockUseCamera.mockReturnValue(createHookReturn({ stop }));

      const resultBlob = new Blob(["data"], { type: "image/jpeg" });
      mockCapture.mockResolvedValue({
        ok: true,
        blob: resultBlob,
        dataUrl: "data:image/jpeg;base64,BBB",
        width: 100,
        height: 200,
      });

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture, onCancel: vi.fn() }),
      );

      await act(async () => {
        await result.current.capture();
      });

      act(() => {
        result.current.confirm();
      });

      expect(onCapture).toHaveBeenCalledWith({
        dataUrl: "data:image/jpeg;base64,BBB",
        blob: resultBlob,
        width: 100,
        height: 200,
      });
      expect(stop).toHaveBeenCalledTimes(1);
    });

    it("calls stop even when no image has been captured", () => {
      const stop = vi.fn();
      mockUseCamera.mockReturnValue(createHookReturn({ stop }));

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture: vi.fn(), onCancel: vi.fn() }),
      );

      act(() => {
        result.current.confirm();
      });

      expect(stop).toHaveBeenCalledTimes(1);
    });
  });

  describe("retake", () => {
    it("clears captured image without stopping the stream", async () => {
      const stop = vi.fn();
      mockUseCamera.mockReturnValue(createHookReturn({ stop }));
      mockCapture.mockResolvedValue({
        ok: true,
        blob: new Blob(),
        dataUrl: "data:image/jpeg;base64,CCC",
        width: 100,
        height: 200,
      });

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture: vi.fn(), onCancel: vi.fn() }),
      );

      await act(async () => {
        await result.current.capture();
      });

      expect(result.current.captured).not.toBeNull();

      act(() => {
        result.current.retake();
      });

      expect(result.current.captured).toBeNull();
      expect(stop).not.toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("stops the camera and calls onCancel", () => {
      const stop = vi.fn();
      const onCancel = vi.fn();
      mockUseCamera.mockReturnValue(createHookReturn({ stop }));

      const { result } = renderHook(() =>
        useCameraCapture({ onCapture: vi.fn(), onCancel }),
      );

      act(() => {
        result.current.cancel();
      });

      expect(stop).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
