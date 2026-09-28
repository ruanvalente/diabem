// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { pickSelectOption } from "@/components/test-utils/select";
import { NotificationScheduleForm, type NotificationScheduleFormValue } from "./notification-schedule-form.ui";
import type { NotificationWeekdayPreset } from "@/lib/notifications/types";

function value(
  overrides: Partial<NotificationScheduleFormValue> = {},
): NotificationScheduleFormValue {
  return {
    label: "",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    reminderTypes: ["glucose"],
    ...overrides,
  };
}

const onChange = vi.fn();
const onWeekdayPresetChange = vi.fn();

function renderForm(
  current: NotificationScheduleFormValue = value(),
  preset: NotificationWeekdayPreset = "everyDay",
) {
  return render(
    <NotificationScheduleForm
      value={current}
      onChange={onChange}
      weekdayPreset={preset}
      onWeekdayPresetChange={onWeekdayPresetChange}
    />,
  );
}

describe("NotificationScheduleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("associates a label with every control", () => {
    renderForm();

    expect(screen.getByLabelText("Nome do lembrete (opcional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Período")).toBeInTheDocument();
    expect(screen.getByLabelText("Horário")).toBeInTheDocument();
    expect(screen.getByLabelText("Repetir")).toBeInTheDocument();
  });

  it("groups days and reminder types in labelled fieldsets", () => {
    renderForm();

    expect(screen.getByRole("group", { name: "Dias da semana" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Lembrar de" })).toBeInTheDocument();
  });

  it("emits the edited label and time", () => {
    const current = value();
    renderForm(current);

    fireEvent.change(screen.getByLabelText("Nome do lembrete (opcional)"), {
      target: { value: "Medição da manhã" },
    });
    expect(onChange).toHaveBeenCalledWith({ ...current, label: "Medição da manhã" });

    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "09:00" } });
    expect(onChange).toHaveBeenCalledWith({ ...current, time: "09:00" });
  });

  it("adds and removes a day, re-emitting the whole value", () => {
    const current = value({ daysOfWeek: ["monday"] });
    renderForm(current, "custom");

    fireEvent.click(screen.getByRole("checkbox", { name: "Ter" }));
    expect(onChange).toHaveBeenCalledWith({
      ...current,
      daysOfWeek: ["monday", "tuesday"],
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Seg" }));
    expect(onChange).toHaveBeenCalledWith({ ...current, daysOfWeek: [] });
  });

  it("adds and removes a reminder type", () => {
    const current = value({ reminderTypes: ["glucose"] });
    renderForm(current);

    fireEvent.click(screen.getByRole("checkbox", { name: "Alimentação" }));
    expect(onChange).toHaveBeenCalledWith({
      ...current,
      reminderTypes: ["glucose", "meal"],
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Medições" }));
    expect(onChange).toHaveBeenCalledWith({ ...current, reminderTypes: [] });
  });

  it("exposes the current recurrence through the Repetir control", () => {
    const { rerender } = renderForm(value(), "everyDay");

    expect(screen.getByRole("combobox", { name: "Repetir" })).toHaveTextContent(
      "Todos os dias",
    );

    rerender(
      <NotificationScheduleForm
        value={value()}
        onChange={onChange}
        weekdayPreset="weekend"
        onWeekdayPresetChange={onWeekdayPresetChange}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Repetir" })).toHaveTextContent(
      "Fim de semana",
    );
  });

  it("reports the period picked from the popup", () => {
    const current = value();
    renderForm(current);

    pickSelectOption("Período", "Noite");

    expect(onChange).toHaveBeenCalledWith({ ...current, period: "evening" });
  });

  it("reports the recurrence picked from the popup", () => {
    renderForm(value(), "everyDay");

    pickSelectOption("Repetir", "Dias úteis");

    expect(onWeekdayPresetChange).toHaveBeenCalledWith("weekdays");
  });

  it("closes each popup after a selection", () => {
    renderForm(value(), "everyDay");

    pickSelectOption("Período", "Tarde");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    pickSelectOption("Repetir", "Personalizado");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("toggles whether the reminder itself is active", () => {
    const current = value();
    renderForm(current);

    fireEvent.click(screen.getByLabelText("Ativar este lembrete"));
    expect(onChange).toHaveBeenCalledWith({ ...current, enabled: false });
  });
});
