// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/browser/hooks/use-camera", () => ({
  useCamera: vi.fn(),
}));

vi.mock("@/lib/browser/services/camera.service", () => ({
  cameraService: {
    capture: vi.fn(),
  },
}));

import { useCamera } from "@/lib/browser/hooks/use-camera";
import { cameraService } from "@/lib/browser/services/camera.service";
import { CameraCapture } from "./camera-capture.widget";

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

describe("CameraCapture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCamera.mockReturnValue(createHookReturn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("unsupported state", () => {
    it("renders unavailable message when camera is not supported", () => {
      mockUseCamera.mockReturnValue(createHookReturn({ supported: false }));

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      expect(
        screen.getByText(
          /Câmera não disponível neste dispositivo ou navegador/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("idle state", () => {
    it("renders status text and buttons", () => {
      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByText("Câmera pronta")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Abrir câmera" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("calls start when open camera button is clicked", () => {
      const start = vi.fn();
      mockUseCamera.mockReturnValue(createHookReturn({ start }));

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Abrir câmera" }));

      expect(start).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();
      render(<CameraCapture onCapture={vi.fn()} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("uses custom label in the section aria-label", () => {
      render(
        <CameraCapture
          onCapture={vi.fn()}
          onCancel={vi.fn()}
          label="Foto do paciente"
        />,
      );

      expect(
        screen.getByRole("region", { name: "Foto do paciente" }),
      ).toBeInTheDocument();
    });
  });

  describe("streaming state", () => {
    it("renders streaming status and active badge", () => {
      mockUseCamera.mockReturnValue(createHookReturn({ state: "streaming" }));

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      expect(
        screen.getByText("Câmera ativa — pronto para capturar"),
      ).toBeInTheDocument();
      expect(screen.getByText("Ativa")).toBeInTheDocument();
    });

    it("renders capture and cancel buttons", () => {
      mockUseCamera.mockReturnValue(createHookReturn({ state: "streaming" }));

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      expect(
        screen.getByRole("button", { name: "Capturar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("calls cameraService.capture when capture button is clicked", async () => {
      mockUseCamera.mockReturnValue(createHookReturn({ state: "streaming" }));
      mockCapture.mockResolvedValue({ ok: false, reason: "capture-failed" });

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Capturar" }));
      });

      expect(mockCapture).toHaveBeenCalledTimes(1);
    });
  });

  describe("capture → confirm flow", () => {
    it("shows confirm and retake buttons after successful capture", async () => {
      mockUseCamera.mockReturnValue(createHookReturn({ state: "streaming" }));
      mockCapture.mockResolvedValue({
        ok: true,
        blob: new Blob(),
        dataUrl: "data:image/jpeg;base64,abc",
        width: 1280,
        height: 720,
      });

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Capturar" }));
      });

      expect(screen.getByText("Imagem capturada")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Confirmar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Tirar novamente/ }),
      ).toBeInTheDocument();
    });

    it("calls onCapture with captured result and stops camera on confirm", async () => {
      const onCapture = vi.fn();
      const stop = vi.fn();
      mockUseCamera.mockReturnValue(
        createHookReturn({ state: "streaming", stop }),
      );
      mockCapture.mockResolvedValue({
        ok: true,
        blob: new Blob(),
        dataUrl: "data:image/jpeg;base64,AAA",
        width: 640,
        height: 480,
      });

      render(<CameraCapture onCapture={onCapture} onCancel={vi.fn()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Capturar" }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
      });

      expect(onCapture).toHaveBeenCalledWith(
        expect.objectContaining({
          dataUrl: "data:image/jpeg;base64,AAA",
          width: 640,
          height: 480,
        }),
      );
      expect(onCapture.mock.calls[0][0].blob).toBeInstanceOf(Blob);
      expect(stop).toHaveBeenCalledTimes(1);
    });

    it("calls onRetake to clear captured image", async () => {
      mockUseCamera.mockReturnValue(createHookReturn({ state: "streaming" }));
      mockCapture.mockResolvedValue({
        ok: true,
        blob: new Blob(),
        dataUrl: "data:image/jpeg;base64,BBB",
        width: 100,
        height: 200,
      });

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Capturar" }));
      });

      expect(screen.getByText("Imagem capturada")).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: /Tirar novamente/ }),
        );
      });

      expect(screen.queryByText("Imagem capturada")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Capturar" }),
      ).toBeInTheDocument();
    });
  });

  describe("cancel during streaming", () => {
    it("stops camera and calls onCancel", () => {
      const stop = vi.fn();
      const onCancel = vi.fn();
      mockUseCamera.mockReturnValue(
        createHookReturn({ state: "streaming", stop }),
      );

      render(<CameraCapture onCapture={vi.fn()} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(stop).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("error state", () => {
    it("renders error message with role=alert", () => {
      mockUseCamera.mockReturnValue(
        createHookReturn({ error: "permission-denied" }),
      );

      render(<CameraCapture onCapture={vi.fn()} onCancel={vi.fn()} />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/Permissão da câmera negada/);
    });
  });
});
