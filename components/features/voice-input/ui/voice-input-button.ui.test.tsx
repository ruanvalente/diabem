// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { VoiceInputButton } from "./voice-input-button.ui";

const BASE_PROPS = {
  state: "idle" as const,
  isRecording: false,
  hasTranscript: false,
  hasError: false,
  transcript: "",
  label: "Gravar áudio",
  onToggleRecording: vi.fn(),
  onUseText: vi.fn(),
  onDiscard: vi.fn(),
  onRetry: vi.fn(),
};

describe("VoiceInputButton", () => {
  it("renders label when idle", () => {
    render(<VoiceInputButton {...BASE_PROPS} />);

    const button = screen.getByRole("button", { name: "Gravar áudio" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("renders recording label when recording", () => {
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        state="listening"
        isRecording
      />
    );

    const button = screen.getByRole("button", {
      name: "Gravando áudio, clique para parar",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Gravando...")).toBeInTheDocument();
  });

  it("shows status text when recording", () => {
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        state="listening"
        isRecording
      />
    );

    expect(
      screen.getByText("Ouvindo... Fale sua observação.")
    ).toBeInTheDocument();
  });

  it("shows spinner when starting", () => {
    render(
      <VoiceInputButton {...BASE_PROPS} state="starting" isRecording />
    );

    expect(screen.getByText("Iniciando...")).toBeInTheDocument();
  });

  it("shows transcript and action buttons when transcript available", () => {
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        hasTranscript
        transcript="Minha observação"
      />
    );

    expect(screen.getByText(/Texto reconhecido/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Usar texto reconhecido" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Descartar texto reconhecido" })
    ).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<VoiceInputButton {...BASE_PROPS} hasError />);

    expect(
      screen.getByText("Não foi possível capturar áudio.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /erro ao gravar áudio/i })
    ).toBeInTheDocument();
  });

  it("calls onToggleRecording when idle button clicked", () => {
    const onToggleRecording = vi.fn();
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        onToggleRecording={onToggleRecording}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Gravar áudio" }));

    expect(onToggleRecording).toHaveBeenCalled();
  });

  it("calls onRetry when error button clicked", () => {
    const onRetry = vi.fn();
    render(
      <VoiceInputButton {...BASE_PROPS} hasError onRetry={onRetry} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /erro ao gravar áudio/i })
    );

    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onUseText when 'Usar texto' clicked", () => {
    const onUseText = vi.fn();
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        hasTranscript
        transcript="Minha observação"
        onUseText={onUseText}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Usar texto reconhecido" })
    );

    expect(onUseText).toHaveBeenCalled();
  });

  it("calls onDiscard when 'Descartar' clicked", () => {
    const onDiscard = vi.fn();
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        hasTranscript
        transcript="Minha observação"
        onDiscard={onDiscard}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Descartar texto reconhecido" })
    );

    expect(onDiscard).toHaveBeenCalled();
  });
});
