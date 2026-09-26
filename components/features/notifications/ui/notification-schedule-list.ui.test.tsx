// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NotificationScheduleList } from "./notification-schedule-list.ui";
import type { NotificationSchedule } from "@/lib/notifications/types";

function schedule(overrides: Partial<NotificationSchedule> = {}): NotificationSchedule {
  return {
    id: "sched-1",
    userId: "u1",
    label: "Medição da manhã",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    reminderTypes: ["glucose", "meal"],
    timeZone: "America/Belem",
    lastOccurrenceKey: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

const handlers = {
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
};

function renderList(
  schedules: NotificationSchedule[],
  isPending = false,
): { onToggle: typeof handlers.onToggle } {
  render(
    <NotificationScheduleList
      schedules={schedules}
      isPending={isPending}
      onToggle={handlers.onToggle}
      onEdit={handlers.onEdit}
      onRemove={handlers.onRemove}
    />,
  );
  return { onToggle: handlers.onToggle };
}

describe("NotificationScheduleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("guides the user to create a reminder when the list is empty", () => {
    renderList([]);

    expect(
      screen.getByText(/Nenhum lembrete configurado/i),
    ).toBeInTheDocument();
  });

  it("summarizes the time, period, label, days and reminder types", () => {
    renderList([schedule()]);

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("08:00");
    expect(item).toHaveTextContent("Manhã");
    expect(item).toHaveTextContent("Medição da manhã");
    expect(item).toHaveTextContent("Dias úteis");
    expect(item).toHaveTextContent("Medições");
    expect(item).toHaveTextContent("Alimentação");
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("summarizes every-day and weekend recurrences", () => {
    renderList([
      schedule({ id: "a", daysOfWeek: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] }),
      schedule({ id: "b", daysOfWeek: ["saturday", "sunday"] }),
    ]);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Todos os dias");
    expect(items[1]).toHaveTextContent("Fim de semana");
  });

  it("lists the selected days when the recurrence is custom", () => {
    renderList([schedule({ daysOfWeek: ["monday", "friday"] })]);

    expect(screen.getByRole("listitem")).toHaveTextContent("Seg, Sex");
  });

  it("marks a disabled reminder and offers to activate it", () => {
    renderList([schedule({ enabled: false })]);

    expect(screen.getByText("Desativado")).toBeInTheDocument();
    expect(screen.getByLabelText("Ativar")).toBeInTheDocument();
  });

  it("toggles, edits and removes a reminder", () => {
    const record = schedule();
    renderList([record]);

    fireEvent.click(screen.getByLabelText("Desativar"));
    expect(handlers.onToggle).toHaveBeenCalledWith(record);

    fireEvent.click(screen.getByRole("button", { name: /Editar/i }));
    expect(handlers.onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(screen.getByRole("button", { name: /Excluir/i }));
    expect(handlers.onRemove).toHaveBeenCalledWith(record);
  });

  it("disables every action while a mutation is pending", () => {
    renderList([schedule()], true);

    expect(screen.getByLabelText("Desativar")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Editar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Excluir/i })).toBeDisabled();
  });
});
