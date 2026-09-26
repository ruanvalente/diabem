// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NotificationScheduleDialog } from "./notification-schedule-dialog.widget";
import type { NotificationSchedule } from "@/lib/notifications/types";

function schedule(overrides: Partial<NotificationSchedule> = {}): NotificationSchedule {
  return {
    id: "sched-1",
    userId: "u1",
    label: "Medição da manhã",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: ["saturday", "sunday"],
    reminderTypes: ["glucose", "meal"],
    timeZone: "America/Belem",
    lastOccurrenceKey: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

const onOpenChange = vi.fn();
const onSubmit = vi.fn();

function renderDialog(scheduleValue: NotificationSchedule | null = null) {
  return render(
    <NotificationScheduleDialog
      open
      onOpenChange={onOpenChange}
      schedule={scheduleValue}
      onSubmit={onSubmit}
    />,
  );
}

describe("NotificationScheduleDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onSubmit.mockResolvedValue({ ok: true, data: schedule() });
  });

  it("defaults a new reminder to the morning period and 08:00", async () => {
    renderDialog();

    expect(await screen.findByText("Adicionar lembrete")).toBeInTheDocument();
    expect(screen.getByLabelText("Horário")).toHaveValue("08:00");
    expect(screen.getByLabelText("Ativar este lembrete")).toBeChecked();
    expect(screen.getByLabelText("Medições")).toBeChecked();
    expect(screen.getByLabelText("Alimentação")).not.toBeChecked();
  });

  it("prefills the form when editing an existing reminder", async () => {
    renderDialog(schedule());

    expect(await screen.findByText("Editar lembrete")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome do lembrete (opcional)")).toHaveValue(
      "Medição da manhã",
    );
    expect(screen.getByLabelText("Horário")).toHaveValue("08:00");
    expect(screen.getByLabelText("Sáb")).toBeChecked();
    expect(screen.getByLabelText("Seg")).not.toBeChecked();
  });

  it("tells the user the data stays on the device", async () => {
    renderDialog();

    expect(
      await screen.findByText(/salvo apenas neste dispositivo/i),
    ).toBeInTheDocument();
  });

  it("blocks saving when no reminder type is selected", async () => {
    renderDialog();
    await screen.findByText("Adicionar lembrete");

    fireEvent.click(screen.getByLabelText("Medições"));
    fireEvent.click(screen.getByRole("button", { name: /Salvar lembrete/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Selecione pelo menos um tipo de lembrete/,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks saving when no day is selected", async () => {
    renderDialog();
    await screen.findByText("Adicionar lembrete");

    for (const day of ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]) {
      fireEvent.click(screen.getByRole("checkbox", { name: day }));
    }
    fireEvent.click(screen.getByRole("button", { name: /Salvar lembrete/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Selecione pelo menos um dia da semana/,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid reminder and closes", async () => {
    renderDialog();
    await screen.findByText("Adicionar lembrete");

    fireEvent.change(screen.getByLabelText("Nome do lembrete (opcional)"), {
      target: { value: "Medição da manhã" },
    });
    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "09:00" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar lembrete/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      label: "Medição da manhã",
      period: "morning",
      time: "09:00",
      enabled: true,
      reminderTypes: ["glucose"],
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("keeps the timezone of the reminder being edited", async () => {
    renderDialog(schedule());
    await screen.findByText("Editar lembrete");

    fireEvent.click(screen.getByRole("button", { name: /Salvar lembrete/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].timeZone).toBe("America/Belem");
  });

  it("shows the failure returned by the parent and stays open", async () => {
    onSubmit.mockResolvedValue({ ok: false, error: "Lembrete inválido." });
    renderDialog();
    await screen.findByText("Adicionar lembrete");

    fireEvent.click(screen.getByRole("button", { name: /Salvar lembrete/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Lembrete inválido.");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("closes without saving when cancelled", async () => {
    renderDialog();
    await screen.findByText("Adicionar lembrete");

    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
