// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import {
  NotificationPreferencesPanel,
  type NotificationPreferencesDraft,
} from "./notification-preferences-panel.ui";

const QUIET_HOURS = { enabled: false, start: "22:00", end: "06:00" };

const draft: NotificationPreferencesDraft = { enabled: true, quietHours: QUIET_HOURS };

function renderPanel(
  overrides: Partial<Parameters<typeof NotificationPreferencesPanel>[0]> = {},
) {
  const handlers = {
    onChange: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };

  return {
    ...handlers,
    ...render(
      <NotificationPreferencesPanel
        value={draft}
        isDirty={false}
        isSaving={false}
        {...handlers}
      />,
    ),
  };
}

const masterSwitch = { name: "Ativar lembretes" } as const;
const saveButton = { name: /Salvar preferências/ } as const;

describe("NotificationPreferencesPanel", () => {
  it("is labelled as the preferences section", () => {
    renderPanel();

    expect(screen.getByRole("region", { name: "Preferências" })).toBeInTheDocument();
  });

  it("emits the whole draft when the master switch is toggled", () => {
    const { onChange } = renderPanel();

    screen.getByRole("checkbox", masterSwitch).click();

    expect(onChange).toHaveBeenCalledWith({ enabled: false, quietHours: QUIET_HOURS });
  });

  it("emits the whole draft when the quiet hours change, keeping the master switch", () => {
    const { onChange } = renderPanel();

    screen.getByRole("checkbox", { name: "Ativar período silencioso" }).click();

    expect(onChange).toHaveBeenCalledWith({
      enabled: true,
      quietHours: { enabled: true, start: "22:00", end: "06:00" },
    });
  });

  it("keeps the save action disabled until the draft is dirty", () => {
    renderPanel();

    expect(screen.getByRole("button", saveButton)).toBeDisabled();
  });

  it("enables the save action once the draft is dirty", () => {
    const { onSave } = renderPanel({ isDirty: true });

    screen.getByRole("button", saveButton).click();

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("locks every control while saving so the draft cannot change mid-request", () => {
    renderPanel({ isDirty: true, isSaving: true });

    expect(screen.getByRole("checkbox", masterSwitch)).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Ativar período silencioso" })).toBeDisabled();
    expect(screen.getByRole("button", saveButton)).toBeDisabled();
  });
});