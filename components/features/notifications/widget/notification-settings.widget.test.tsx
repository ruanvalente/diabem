// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import type { PermissionState } from "@/lib/browser/hooks/use-notifications";
import type { NotificationCapability } from "@/lib/browser/capabilities/notifications";
import type {
  NotificationPreferences,
  NotificationSchedule,
  NotificationScheduleInput,
} from "@/lib/notifications/types";

const permissionState = {
  current: "granted" as PermissionState,
};

const supported = { current: true };
const request = vi.fn(async () => {});

const schedulesState = {
  schedules: [] as NotificationSchedule[],
  isLoading: false,
  error: null as string | null,
  create: vi.fn(),
  update: vi.fn(),
  setEnabled: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
};

const preferencesState = {
  preferences: null as NotificationPreferences | null,
  isLoading: false,
  error: null as string | null,
  save: vi.fn(),
};

vi.mock("@/lib/auth/use-auth", () => ({
  useAuth: () => ({ user: { id: "user-a" } }),
}));

vi.mock("@/lib/browser/hooks/use-notifications", () => ({
  useNotificationPermission: () => ({
    state: permissionState.current,
    supported: supported.current,
    request,
  }),
}));

vi.mock("@/lib/browser/hooks/use-browser-capabilities", () => ({
  useBrowserCapabilities: () => ({
    notifications: {
      supported: supported.current,
      secureContext: true,
      serviceWorker: true,
      scheduling: { reliableBackgroundDelivery: false },
    } satisfies NotificationCapability,
    speechRecognition: { supported: true },
    camera: { supported: true },
  }),
}));

vi.mock("../hooks/use-notification-schedules", () => ({
  useNotificationSchedules: () => schedulesState,
}));

vi.mock("../hooks/use-notification-preferences", () => ({
  useNotificationPreferences: () => preferencesState,
}));

vi.mock("./notification-schedule-dialog.widget", () => ({
  NotificationScheduleDialog: (props: {
    schedule: NotificationSchedule | null;
    onOpenChange: (open: boolean) => void;
    onSubmit: (input: NotificationScheduleInput) => Promise<
      { ok: true; data: NotificationSchedule } | { ok: false; error: string }
    >;
  }) => (
    <div role="dialog">
      <span>{props.schedule ? "edit" : "create"}</span>
      <button onClick={() => props.onOpenChange(false)}>fechar</button>
      <button
        onClick={() =>
          void props.onSubmit({
            label: "Novo",
            period: "morning",
            time: "08:00",
            enabled: true,
            daysOfWeek: ["monday"],
            reminderTypes: ["glucose"],
          })
        }
      >
        enviar
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));

import { NotificationSettingsCard } from "./notification-settings.widget";
import { toast } from "@/components/ui/toast";

const addToast = vi.mocked(toast.add);

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

function preferences(
  overrides: Partial<NotificationPreferences> = {},
): NotificationPreferences {
  return {
    userId: "user-a",
    enabled: false,
    quietHours: { enabled: false, start: "22:00", end: "07:00" },
    timeZone: "America/Belem",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("NotificationSettingsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.current = "granted";
    supported.current = true;
    schedulesState.schedules = [];
    schedulesState.isLoading = false;
    schedulesState.error = null;
    preferencesState.preferences = preferences();
    schedulesState.create.mockResolvedValue({ ok: true, data: schedule() });
    schedulesState.update.mockResolvedValue({ ok: true, data: schedule() });
    schedulesState.setEnabled.mockResolvedValue({ ok: true, data: schedule() });
    schedulesState.remove.mockResolvedValue({ ok: true, data: null });
    preferencesState.save.mockResolvedValue({ ok: true, data: preferences() });
  });

  it("confirms the active permission state", () => {
    render(<NotificationSettingsCard />);

    expect(screen.getByText("Notificações ativadas")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ativar notificações/i }),
    ).not.toBeInTheDocument();
  });

  it("offers to request permission when it was never decided", () => {
    permissionState.current = "default";
    render(<NotificationSettingsCard />);

    const button = screen.getByRole("button", { name: /Ativar notificações/i });
    expect(button).toBeInTheDocument();
    expect(
      screen.getByText(/Ative a permissão de notificações no navegador/i),
    ).toBeInTheDocument();
  });

  it("asks the user to change browser settings when permission is denied", () => {
    permissionState.current = "denied";
    render(<NotificationSettingsCard />);

    // Exactly one blocked notice: the capability panel must not restate it.
    expect(screen.getAllByText("Notificações bloqueadas")).toHaveLength(1);
    expect(
      screen.getByText(/Altere as permissões do site/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adicionar lembrete/i }),
    ).toBeDisabled();
  });

  it("hides the capability notice when the platform has no support", () => {
    supported.current = false;
    permissionState.current = "unsupported";
    render(<NotificationSettingsCard />);

    expect(screen.getByText("Notificações indisponíveis")).toBeInTheDocument();
    expect(screen.getByText(/não suporta notificações/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adicionar lembrete/i }),
    ).toBeDisabled();
  });

  it("discloses the foreground-delivery limitation", () => {
    render(<NotificationSettingsCard />);

    expect(screen.getByText("Lembretes dependem do app aberto")).toBeInTheDocument();
  });

  it("shows a loading state while reminders are read", () => {
    schedulesState.isLoading = true;
    render(<NotificationSettingsCard />);

    expect(screen.getByText(/Carregando lembretes/i)).toBeInTheDocument();
  });

  it("shows an error state when reminders cannot be read", () => {
    schedulesState.error = "Não foi possível carregar os lembretes.";
    render(<NotificationSettingsCard />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os lembretes.",
    );
  });

  it("opens the create dialog and reports a successful creation", async () => {
    render(<NotificationSettingsCard />);

    fireEvent.click(screen.getByRole("button", { name: /Adicionar lembrete/i }));
    fireEvent.click(screen.getByRole("button", { name: "enviar" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Lembrete criado com sucesso." }),
      ),
    );
  });

  it("reports a failed creation and keeps the dialog open", async () => {
    schedulesState.create.mockResolvedValue({
      ok: false,
      error: "Selecione pelo menos um dia da semana.",
    });
    render(<NotificationSettingsCard />);

    fireEvent.click(screen.getByRole("button", { name: /Adicionar lembrete/i }));
    fireEvent.click(screen.getByRole("button", { name: "enviar" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Selecione pelo menos um dia da semana." }),
      ),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("delegates toggling and removal of a reminder to the hooks", async () => {
    const record = schedule();
    schedulesState.schedules = [record];
    render(<NotificationSettingsCard />);

    fireEvent.click(screen.getByLabelText("Desativar"));
    await waitFor(() =>
      expect(schedulesState.setEnabled).toHaveBeenCalledWith("sched-1", false),
    );

    fireEvent.click(screen.getByRole("button", { name: /Excluir/i }));
    await waitFor(() =>
      expect(schedulesState.remove).toHaveBeenCalledWith("sched-1"),
    );
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Lembrete excluído." }),
    );
  });

  it("prefills the preferences form from the persisted record", () => {
    preferencesState.preferences = preferences({
      enabled: true,
      quietHours: { enabled: true, start: "23:00", end: "06:00" },
    });
    render(<NotificationSettingsCard />);

    expect(screen.getByLabelText("Ativar lembretes")).toBeChecked();
    expect(screen.getByLabelText("Ativar período silencioso")).toBeChecked();
    expect(screen.getByLabelText("Início")).toHaveValue("23:00");
    expect(screen.getByLabelText("Fim")).toHaveValue("06:00");
    expect(
      screen.getByRole("button", { name: /Salvar preferências/i }),
    ).toBeDisabled();
  });

  it("only enables the save button once the draft changes", () => {
    render(<NotificationSettingsCard />);
    const save = screen.getByRole("button", { name: /Salvar preferências/i });
    expect(save).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Ativar lembretes"));

    expect(save).toBeEnabled();
  });

  it("saves the preferences draft and reports success", async () => {
    render(<NotificationSettingsCard />);

    fireEvent.click(screen.getByLabelText("Ativar lembretes"));
    fireEvent.click(screen.getByRole("button", { name: /Salvar preferências/i }));

    await waitFor(() =>
      expect(preferencesState.save).toHaveBeenCalledWith({
        enabled: true,
        quietHours: { enabled: false, start: "22:00", end: "07:00" },
        timeZone: "America/Belem",
      }),
    );
    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Preferências salvas." }),
      ),
    );
  });

  it("lists the device capabilities with a text status, not only color", () => {
    render(<NotificationSettingsCard />);

    expect(screen.getByText("Recursos do dispositivo")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Disponível")).toHaveLength(3);
    expect(screen.queryByLabelText("Indisponível")).not.toBeInTheDocument();
  });
});
