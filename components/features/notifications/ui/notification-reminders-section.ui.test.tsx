// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NotificationRemindersSection } from "./notification-reminders-section.ui";
import type { NotificationSchedule } from "@/lib/notifications/types";

function schedule(overrides: Partial<NotificationSchedule> = {}): NotificationSchedule {
  return {
    id: "sched-1",
    userId: "user-a",
    label: "Medição da manhã",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: ["monday"],
    reminderTypes: ["glucose"],
    timeZone: "America/Belem",
    lastOccurrenceKey: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

const handlers = {
  onCreate: vi.fn(),
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
};

type SectionOverrides = Partial<Parameters<typeof NotificationRemindersSection>[0]>;

function renderSection(overrides: SectionOverrides = {}) {
  return render(
    <NotificationRemindersSection
      schedules={[]}
      isLoading={false}
      error={null}
      isPending={false}
      canManage
      {...handlers}
      {...overrides}
    />,
  );
}

describe("NotificationRemindersSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("explains what the section configures and asks for a creation", () => {
    renderSection();

    expect(
      screen.getByRole("heading", { name: "Lembretes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tudo fica salvo apenas neste dispositivo/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Adicionar lembrete/i }));
    expect(handlers.onCreate).toHaveBeenCalledTimes(1);
  });

  it("prefers the loading state over the list and over the error", () => {
    renderSection({
      isLoading: true,
      error: "Não foi possível carregar os lembretes.",
    });

    expect(screen.getByRole("status")).toHaveTextContent("Carregando lembretes…");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("reports a read failure as an alert", () => {
    renderSection({ error: "Não foi possível carregar os lembretes." });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os lembretes.",
    );
  });

  it("lists the reminders it receives and delegates every action", () => {
    const record = schedule();
    renderSection({ schedules: [record] });

    expect(screen.getByRole("listitem")).toHaveTextContent("Medição da manhã");

    fireEvent.click(screen.getByLabelText("Desativar"));
    expect(handlers.onToggle).toHaveBeenCalledWith(record);

    fireEvent.click(screen.getByRole("button", { name: /Editar/i }));
    expect(handlers.onEdit).toHaveBeenCalledWith(record);

    fireEvent.click(screen.getByRole("button", { name: /Excluir/i }));
    expect(handlers.onRemove).toHaveBeenCalledWith(record);
  });

  it("explains why reminders cannot be managed yet", () => {
    renderSection({ canManage: false });

    expect(
      screen.getByRole("button", { name: /Adicionar lembrete/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Ative a permissão de notificações no navegador/i),
    ).toBeInTheDocument();
  });

  it("disables the action while the reminders are being read", () => {
    renderSection({ isLoading: true });

    expect(
      screen.getByRole("button", { name: /Adicionar lembrete/i }),
    ).toBeDisabled();
  });
});
