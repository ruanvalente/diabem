// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { VoiceInputButton } from "./voice-input-button.ui";

const BASE_PROPS = {
  state: "idle" as const,
  transcript: "",
  label: "Gravar áudio",
  onToggle: vi.fn(),
  onUseTranscript: vi.fn(),
  onDiscard: vi.fn(),
};

describe("VoiceInputButton", () => {
  it("renders label when idle", () => {
    const { container } = render(<VoiceInputButton {...BASE_PROPS} />);

    const button = screen.getByRole("button", { name: "Gravar áudio" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  it("renders recording label when recording", () => {
    render(<VoiceInputButton {...BASE_PROPS} state="listening" />);

    const button = screen.getByRole("button", {
      name: "Gravando áudio, clique para parar",
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Gravando...")).toBeInTheDocument();
  });

  it("shows status text when recording", () => {
    render(<VoiceInputButton {...BASE_PROPS} state="listening" />);

    expect(
      screen.getByText("Ouvindo... Fale sua observação.")
    ).toBeInTheDocument();
  });

  it("shows starting label and spinner while starting", () => {
    const { container } = render(
      <VoiceInputButton {...BASE_PROPS} state="starting" />
    );

    expect(screen.getByText("Iniciando...")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows processing label and spinner while processing", () => {
    const { container } = render(
      <VoiceInputButton {...BASE_PROPS} state="processing" />
    );

    expect(screen.getByText("Processando...")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows transcript and action buttons when transcript available", () => {
    render(
      <VoiceInputButton {...BASE_PROPS} transcript="Minha observação" />
    );

    expect(
      screen.getByText('Texto reconhecido: "Minha observação"')
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Usar texto reconhecido" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Descartar texto reconhecido" })
    ).toBeInTheDocument();
  });

  it("hides the transcript while recording", () => {
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        state="listening"
        transcript="Minha observação"
      />
    );

    expect(screen.queryByText(/Texto reconhecido/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Usar texto reconhecido" })
    ).not.toBeInTheDocument();
  });

  it("hides the transcript when it contains only whitespace", () => {
    render(<VoiceInputButton {...BASE_PROPS} transcript="   " />);

    expect(screen.queryByText(/Texto reconhecido/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Descartar texto reconhecido" })
    ).not.toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<VoiceInputButton {...BASE_PROPS} state="error" />);

    expect(
      screen.getByText("Não foi possível capturar áudio.")
    ).toBeInTheDocument();
    const button = screen.getByRole("button", {
      name: /erro ao gravar áudio/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Tente novamente")).toBeInTheDocument();
  });

  it("calls onToggle when idle button clicked", () => {
    const onToggle = vi.fn();
    render(<VoiceInputButton {...BASE_PROPS} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole("button", { name: "Gravar áudio" }));

    expect(onToggle).toHaveBeenCalled();
  });

  it("calls onToggle when recording button clicked", () => {
    const onToggle = vi.fn();
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        state="listening"
        onToggle={onToggle}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /clique para parar/i })
    );

    expect(onToggle).toHaveBeenCalled();
  });

  it("calls onToggle when error button clicked", () => {
    const onToggle = vi.fn();
    render(
      <VoiceInputButton {...BASE_PROPS} state="error" onToggle={onToggle} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /erro ao gravar áudio/i })
    );

    expect(onToggle).toHaveBeenCalled();
  });

  it("calls onUseTranscript when 'Usar texto' clicked", () => {
    const onUseTranscript = vi.fn();
    render(
      <VoiceInputButton
        {...BASE_PROPS}
        transcript="Minha observação"
        onUseTranscript={onUseTranscript}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Usar texto reconhecido" })
    );

    expect(onUseTranscript).toHaveBeenCalled();
  });

  it("calls onDiscard when 'Descartar' clicked", () => {
    const onDiscard = vi.fn();
    render(
      <VoiceInputButton
        {...BASE_PROPS}
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
