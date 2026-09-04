// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/browser/hooks/use-speech-recognition", () => ({
  useSpeechRecognition: vi.fn(),
}));

import { VoiceInputWidget } from "./voice-input.widget";
import {
  useSpeechRecognition,
} from "@/lib/browser/hooks/use-speech-recognition";

const mockUseSpeechRecognition = vi.mocked(useSpeechRecognition);

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

function createMockProps() {
  return {
    onTranscript: vi.fn(),
    label: "Gravar áudio",
  };
}

describe("VoiceInputWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not supported", () => {
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ supported: false })
    );

    const { container } = render(
      <VoiceInputWidget {...createMockProps()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("calls start when idle button clicked", () => {
    const start = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(createMockHookReturn({ start }));

    render(<VoiceInputWidget {...createMockProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Gravar áudio" }));

    expect(start).toHaveBeenCalled();
  });

  it("calls stop when recording button clicked", () => {
    const stop = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "listening", isListening: true, stop })
    );

    render(<VoiceInputWidget {...createMockProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Gravando áudio, clique para parar",
      })
    );

    expect(stop).toHaveBeenCalled();
  });

  it("calls onTranscript and reset when 'Usar texto' clicked", () => {
    const onTranscript = vi.fn();
    const reset = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ transcript: "Minha observação", reset })
    );

    render(
      <VoiceInputWidget
        {...createMockProps()}
        onTranscript={onTranscript}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Usar texto reconhecido" })
    );

    expect(onTranscript).toHaveBeenCalledWith("Minha observação");
    expect(reset).toHaveBeenCalled();
  });

  it("calls reset when 'Descartar' clicked", () => {
    const reset = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ transcript: "Minha observação", reset })
    );

    render(<VoiceInputWidget {...createMockProps()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Descartar texto reconhecido" })
    );

    expect(reset).toHaveBeenCalled();
  });

  it("calls reset and start when retry clicked on error", () => {
    const reset = vi.fn();
    const start = vi.fn();
    mockUseSpeechRecognition.mockReturnValue(
      createMockHookReturn({ state: "error", reset, start })
    );

    render(<VoiceInputWidget {...createMockProps()} />);

    fireEvent.click(
      screen.getByRole("button", { name: /erro ao gravar áudio/i })
    );

    expect(reset).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
  });

  it("does not render confirm/discard when idle with no transcript", () => {
    mockUseSpeechRecognition.mockReturnValue(createMockHookReturn());

    render(<VoiceInputWidget {...createMockProps()} />);

    expect(
      screen.queryByRole("button", { name: "Usar texto reconhecido" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Descartar texto reconhecido" })
    ).not.toBeInTheDocument();
  });
});
