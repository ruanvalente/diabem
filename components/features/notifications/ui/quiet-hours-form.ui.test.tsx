// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { QuietHoursForm } from "./quiet-hours-form.ui";
import { NOTIFICATION_DEFAULT_QUIET_HOURS } from "@/lib/notifications/types";

const onChange = vi.fn();

function renderForm(
  overrides: Partial<typeof NOTIFICATION_DEFAULT_QUIET_HOURS> = {},
  disabled = false,
) {
  return render(
    <QuietHoursForm
      value={{ ...NOTIFICATION_DEFAULT_QUIET_HOURS, ...overrides }}
      onChange={onChange}
      disabled={disabled}
    />,
  );
}

describe("QuietHoursForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes the silent window inside a labelled group", () => {
    renderForm();

    expect(
      screen.getByRole("group", { name: "Período silencioso" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Início")).toHaveValue("22:00");
    expect(screen.getByLabelText("Fim")).toHaveValue("07:00");
  });

  it("explains that the window may cross midnight", () => {
    renderForm();

    expect(screen.getByText(/inclusive quando ele\s+atravessa a meia-noite/i)).toBeInTheDocument();
  });

  it("enables or disables the silent window", () => {
    const value = { ...NOTIFICATION_DEFAULT_QUIET_HOURS };
    renderForm();

    fireEvent.click(screen.getByLabelText("Ativar período silencioso"));
    expect(onChange).toHaveBeenCalledWith({ ...value, enabled: true });
  });

  it("emits the edited start and end times", () => {
    const value = { enabled: true, start: "22:00", end: "07:00" };
    renderForm({ enabled: true });

    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "23:00" } });
    expect(onChange).toHaveBeenCalledWith({ ...value, start: "23:00" });

    fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "06:30" } });
    expect(onChange).toHaveBeenCalledWith({ ...value, end: "06:30" });
  });

  it("keeps the time inputs disabled while the window is off", () => {
    renderForm();

    expect(screen.getByLabelText("Início")).toBeDisabled();
    expect(screen.getByLabelText("Fim")).toBeDisabled();
  });

  it("disables the whole group while a save is in flight", () => {
    renderForm({ enabled: true }, true);

    expect(screen.getByLabelText("Ativar período silencioso")).toBeDisabled();
    expect(screen.getByLabelText("Início")).toBeDisabled();
  });
});
