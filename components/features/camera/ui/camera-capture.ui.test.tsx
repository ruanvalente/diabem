// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { alt, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element -- plain <img> is required for the mock
    return <img {...rest} alt={String(alt)} />;
  },
}));

import { CameraCaptureUI, getCameraErrorMessage } from "./camera-capture.ui";
import type { CameraCaptureResult } from "../types/camera-capture.types";

const BASE_PROPS = {
  label: "Câmera",
  supported: true,
  state: "idle" as const,
  stream: null,
  error: null,
  captured: null,
  isCapturing: false,
  onStart: vi.fn(),
  onCapture: vi.fn(),
  onConfirm: vi.fn(),
  onRetake: vi.fn(),
  onCancel: vi.fn(),
};

function createCapturedData(
  overrides: Partial<CameraCaptureResult> = {},
): CameraCaptureResult {
  return {
    dataUrl: "data:image/jpeg;base64,TEST",
    blob: new Blob(["img"], { type: "image/jpeg" }),
    width: 640,
    height: 480,
    ...overrides,
  };
}

describe("getCameraErrorMessage", () => {
  it("returns permission denied message", () => {
    expect(getCameraErrorMessage("permission-denied")).toMatch(
      /Permissão da câmera negada/,
    );
  });

  it("returns camera unavailable message", () => {
    expect(getCameraErrorMessage("camera-unavailable")).toMatch(
      /Nenhuma câmera encontrada/,
    );
  });

  it("returns unsupported message", () => {
    expect(getCameraErrorMessage("unsupported")).toMatch(
      /Câmera não suportada/,
    );
  });

  it("returns generic error for unknown reasons", () => {
    expect(getCameraErrorMessage("unknown")).toMatch(
      /Erro ao acessar a câmera/,
    );
    expect(getCameraErrorMessage("capture-failed")).toMatch(
      /Erro ao acessar a câmera/,
    );
  });
});

describe("CameraCaptureUI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unsupported state", () => {
    it("renders unavailable message when not supported", () => {
      render(<CameraCaptureUI {...BASE_PROPS} supported={false} />);

      expect(
        screen.getByText(
          /Câmera não disponível neste dispositivo ou navegador/,
        ),
      ).toBeInTheDocument();
    });

    it("does not render any buttons when not supported", () => {
      render(<CameraCaptureUI {...BASE_PROPS} supported={false} />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("idle state", () => {
    it("renders status text 'Câmera pronta'", () => {
      render(<CameraCaptureUI {...BASE_PROPS} />);

      expect(screen.getByText("Câmera pronta")).toBeInTheDocument();
    });

    it("renders open camera and cancel buttons", () => {
      render(<CameraCaptureUI {...BASE_PROPS} />);

      expect(
        screen.getByRole("button", { name: "Abrir câmera" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("calls onStart when open camera button is clicked", () => {
      const onStart = vi.fn();
      render(<CameraCaptureUI {...BASE_PROPS} onStart={onStart} />);

      fireEvent.click(screen.getByRole("button", { name: "Abrir câmera" }));

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when cancel button is clicked", () => {
      const onCancel = vi.fn();
      render(<CameraCaptureUI {...BASE_PROPS} onCancel={onCancel} />);

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("does not render video element", () => {
      const { container } = render(<CameraCaptureUI {...BASE_PROPS} />);

      expect(container.querySelector("video")).not.toBeInTheDocument();
    });
  });

  describe("streaming state", () => {
    it("renders streaming status and active badge", () => {
      render(<CameraCaptureUI {...BASE_PROPS} state="streaming" />);

      expect(
        screen.getByText("Câmera ativa — pronto para capturar"),
      ).toBeInTheDocument();
      expect(screen.getByText("Ativa")).toBeInTheDocument();
    });

    it("renders capture and cancel buttons", () => {
      render(<CameraCaptureUI {...BASE_PROPS} state="streaming" />);

      expect(
        screen.getByRole("button", { name: "Capturar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("calls onCapture when capture button is clicked", () => {
      const onCapture = vi.fn();
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          onCapture={onCapture}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Capturar" }));

      expect(onCapture).toHaveBeenCalledTimes(1);
    });

    it("disables capture button when isCapturing is true", () => {
      render(<CameraCaptureUI {...BASE_PROPS} state="streaming" isCapturing />);

      const captureBtn = screen.getByRole("button", { name: "Capturar" });
      expect(captureBtn).toBeDisabled();
    });

    it("renders video element when stream is provided", () => {
      const mockStream = { id: "mock" } as unknown as MediaStream;
      const { container } = render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          stream={mockStream}
        />,
      );

      expect(container.querySelector("video")).toBeInTheDocument();
    });

    it("does not render video element when stream is null", () => {
      const { container } = render(
        <CameraCaptureUI {...BASE_PROPS} state="streaming" stream={null} />,
      );

      expect(container.querySelector("video")).not.toBeInTheDocument();
    });
  });

  describe("captured state", () => {
    it("shows 'Imagem capturada' status", () => {
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          captured={createCapturedData()}
        />,
      );

      expect(screen.getByText("Imagem capturada")).toBeInTheDocument();
    });

    it("renders confirm, retake and cancel buttons", () => {
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          captured={createCapturedData()}
        />,
      );

      expect(
        screen.getByRole("button", { name: "Confirmar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Tirar novamente" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancelar" }),
      ).toBeInTheDocument();
    });

    it("calls onConfirm when confirm is clicked", () => {
      const onConfirm = vi.fn();
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          captured={createCapturedData()}
          onConfirm={onConfirm}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onRetake when retake is clicked", () => {
      const onRetake = vi.fn();
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          captured={createCapturedData()}
          onRetake={onRetake}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Tirar novamente" }));

      expect(onRetake).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when cancel is clicked", () => {
      const onCancel = vi.fn();
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          captured={createCapturedData()}
          onCancel={onCancel}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("displays captured image with correct src", () => {
      const captured = createCapturedData({
        dataUrl: "data:image/jpeg;base64,XYZ",
      });
      render(
        <CameraCaptureUI
          {...BASE_PROPS}
          state="streaming"
          captured={captured}
        />,
      );

      const img = screen.getByRole("img", { name: "Imagem capturada" });
      expect(img).toHaveAttribute("src", "data:image/jpeg;base64,XYZ");
    });
  });

  describe("error state", () => {
    it("renders role=alert with permission denied message", () => {
      render(<CameraCaptureUI {...BASE_PROPS} error="permission-denied" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/Permissão da câmera negada/);
    });

    it("renders camera unavailable message", () => {
      render(<CameraCaptureUI {...BASE_PROPS} error="camera-unavailable" />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        /Nenhuma câmera encontrada/,
      );
    });

    it("renders unsupported message", () => {
      render(<CameraCaptureUI {...BASE_PROPS} error="unsupported" />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        /Câmera não suportada/,
      );
    });
  });
});
