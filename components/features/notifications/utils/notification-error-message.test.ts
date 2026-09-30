import { describe, expect, it } from "vitest";
import { messageFromCause } from "./notification-error-message";

describe("messageFromCause", () => {
  it("uses the repository message so the user reads the reason the data layer produced", () => {
    expect(messageFromCause(new Error("Lembrete sobreposto."), "fallback")).toBe(
      "Lembrete sobreposto.",
    );
  });

  it("uses the validation message when the cause is a subclass of Error", () => {
    class ValidationError extends Error {}

    expect(messageFromCause(new ValidationError("Horário inválido."), "fallback")).toBe(
      "Horário inválido.",
    );
  });

  it("falls back when the cause is not an Error", () => {
    expect(messageFromCause("boom", "Não foi possível salvar.")).toBe("Não foi possível salvar.");
    expect(messageFromCause(null, "Não foi possível salvar.")).toBe("Não foi possível salvar.");
    expect(messageFromCause(undefined, "Não foi possível salvar.")).toBe(
      "Não foi possível salvar.",
    );
  });

  it("falls back when an Error carries no message, so the user never reads an empty toast", () => {
    expect(messageFromCause(new Error(""), "Não foi possível salvar.")).toBe(
      "Não foi possível salvar.",
    );
  });
});
