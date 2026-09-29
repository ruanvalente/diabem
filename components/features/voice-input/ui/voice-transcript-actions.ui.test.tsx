// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { VoiceTranscriptActions } from "./voice-transcript-actions.ui";

const BASE_PROPS = {
  transcript: "Minha observação",
  onUse: vi.fn(),
  onDiscard: vi.fn(),
};

describe("VoiceTranscriptActions", () => {
  it("shows the recognized text", () => {
    render(<VoiceTranscriptActions {...BASE_PROPS} />);

    expect(
      screen.getByText('Texto reconhecido: "Minha observação"')
    ).toBeInTheDocument();
  });

  it("calls onUse when 'Usar texto' clicked", () => {
    const onUse = vi.fn();
    render(<VoiceTranscriptActions {...BASE_PROPS} onUse={onUse} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Usar texto reconhecido" })
    );

    expect(onUse).toHaveBeenCalled();
  });

  it("calls onDiscard when 'Descartar' clicked", () => {
    const onDiscard = vi.fn();
    render(<VoiceTranscriptActions {...BASE_PROPS} onDiscard={onDiscard} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Descartar texto reconhecido" })
    );

    expect(onDiscard).toHaveBeenCalled();
  });
});
