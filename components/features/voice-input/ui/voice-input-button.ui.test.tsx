// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/browser/hooks/use-speech-recognition", () => ({
  useSpeechRecognition: vi.fn(),
}));

import { VoiceInputButton } from "./voice-input-button.ui";
import { useSpeechRecognition } from "@/lib/browser/hooks/use-speech-recognition";

const mockUseSpeechRecognition = vi.mocked(useSpeechRecognition);

function createMockProps(overrides = {}) {
  return {
    onTranscript: vi.fn(),
    label: "Gravar áudio",
    ...overrides,
  };
}

function createMockHookReturn(overrides = {}) {
  return {
    state: "idle" as const,
    supported: true,
    transcript: "",
    isListening: false,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    reset: vi.fn(),
    onUserTranscript: vi.fn(),
    resultRef: { current: "" },
    ...overrides,
  };
}

describe("VoiceInputButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not supported", () => {
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ supported: false })
    );

    const { container } = render(
      <VoiceInputButton {...createMockProps()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders mic icon and label when idle", () => {
    mockUseSpeechRecognition.mockReturnValue(createMockHookReturn());

    render(<VoiceInputButton {...createMockProps()} />);

    const button = screen.getByRole("button", { name: "Gravar áudio" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("renders stop icon and recording label when listening", () => {
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "listening", isListening: true })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    const button = screen.getByRole("button", { name: "Gravando áudio, clique para parar" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Gravando...")).toBeInTheDocument();
  });

  it("shows status text when recording", () => {
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "listening", isListening: true })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    expect(screen.getByText("Ouvindo... Fale sua observação.")).toBeInTheDocument();
  });

  it("shows spinner when starting", () => {
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "starting", isListening: true })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    expect(screen.getByText("Iniciando...")).toBeInTheDocument();
  });

  it("shows transcript and action buttons when transcript available", () => {
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ transcript: "Minha observação" })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    expect(screen.getByText(/Texto reconhecido/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar texto reconhecido" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartar texto reconhecido" })).toBeInTheDocument();
  });

  it("calls onTranscript when 'Usar texto' clicked", () => {
    const onTranscript = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ transcript: "Minha observação" })
    );

    render(
      <VoiceInputButton {...createMockProps({ onTranscript })} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Usar texto reconhecido" }));

    expect(onTranscript).toHaveBeenCalledWith("Minha observação");
  });

  it("calls reset when 'Descartar' clicked", () => {
    const reset = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ transcript: "Minha observação", reset })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Descartar texto reconhecido" }));

    expect(reset).toHaveBeenCalled();
  });

  it("shows error state and retry button", () => {
    const reset = vi.fn();
    const start = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "error", reset, start })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    expect(screen.getByText("Não foi possível capturar áudio.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /erro ao gravar áudio/i })).toBeInTheDocument();
  });

  it("calls reset and start when retry clicked", () => {
    const reset = vi.fn();
    const start = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "error", reset, start })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    fireEvent.click(screen.getByRole("button", { name: /erro ao gravar áudio/i }));

    expect(reset).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
  });

  it("calls start when idle button clicked", () => {
    const start = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ start })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Gravar áudio" }));

    expect(start).toHaveBeenCalled();
  });

  it("calls stop when recording button clicked", () => {
    const stop = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "listening", isListening: true, stop })
    );

    render(<VoiceInputButton {...createMockProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Gravando áudio, clique para parar" }));

    expect(stop).toHaveBeenCalled();
  });
});
