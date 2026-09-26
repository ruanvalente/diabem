"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/use-auth";
import { useBrowserCapabilities } from "@/lib/browser/hooks/use-browser-capabilities";
import { useNotificationPermission } from "@/lib/browser/hooks/use-notifications";
import {
  NOTIFICATION_DEFAULT_QUIET_HOURS,
  type NotificationPreferences,
  type NotificationQuietHours,
  type NotificationSchedule,
  type NotificationScheduleInput,
} from "@/lib/notifications/types";
import { Bell, BellOff, Camera as CameraIcon, CheckCircle2, Loader2, Mic, Plus } from "lucide-react";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { useNotificationSchedules } from "../hooks/use-notification-schedules";
import { NotificationCapabilityNotice } from "../ui/notification-capability-notice.ui";
import { NotificationScheduleList } from "../ui/notification-schedule-list.ui";
import { QuietHoursForm } from "../ui/quiet-hours-form.ui";
import { NotificationScheduleDialog } from "./notification-schedule-dialog.widget";

type NotificationPreferencesDraft = {
  enabled: boolean;
  quietHours: NotificationQuietHours;
};

const PERMISSION_MESSAGES: Record<string, string> = {
  default: "Receba lembretes definidos por você quando você abrir o aplicativo.",
  granted: "Você receberá lembretes definidos por você neste dispositivo.",
  denied: "As notificações foram bloqueadas pelo navegador.",
  unsupported: "Seu navegador não suporta notificações neste ambiente.",
};

export function NotificationSettingsCard() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { state, supported, request } = useNotificationPermission();
  const caps = useBrowserCapabilities();
  const { schedules, isLoading, error, create, update, setEnabled, remove } =
    useNotificationSchedules(userId);
  const { preferences, save } = useNotificationPreferences(userId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationSchedule | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [draft, setDraft] = useState<NotificationPreferencesDraft>({
    enabled: false,
    quietHours: { ...NOTIFICATION_DEFAULT_QUIET_HOURS },
  });
  const [syncedPreferences, setSyncedPreferences] =
    useState<NotificationPreferences | null>(null);

  // Reset the form during render whenever a different preferences record arrives
  // (first load or a successful save) instead of mirroring it in an effect.
  if (preferences && preferences !== syncedPreferences) {
    setSyncedPreferences(preferences);
    setDraft({ enabled: preferences.enabled, quietHours: preferences.quietHours });
  }

  const isDirty =
    Boolean(preferences) &&
    (draft.enabled !== preferences?.enabled ||
      draft.quietHours.start !== preferences?.quietHours.start ||
      draft.quietHours.end !== preferences?.quietHours.end ||
      draft.quietHours.enabled !== preferences?.quietHours.enabled);

  const isBlocked = state === "denied" || state === "unsupported";
  const canManage = supported && state === "granted";

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: NotificationSchedule) => {
    setEditing(schedule);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: NotificationScheduleInput) => {
    setIsPending(true);
    const result = editing
      ? await update(editing.id, input)
      : await create(input);
    setIsPending(false);

    if (result.ok) {
      toast.add({
        title: editing ? "Lembrete atualizado com sucesso." : "Lembrete criado com sucesso.",
        type: "success",
      });
    } else {
      toast.add({ title: result.error, type: "error" });
    }
    return result;
  };

  const handleToggle = async (schedule: NotificationSchedule) => {
    setIsPending(true);
    const result = await setEnabled(schedule.id, !schedule.enabled);
    setIsPending(false);
    if (!result.ok) toast.add({ title: result.error, type: "error" });
  };

  const handleRemove = async (schedule: NotificationSchedule) => {
    setIsPending(true);
    const result = await remove(schedule.id);
    setIsPending(false);
    toast.add({
      title: result.ok ? "Lembrete excluído." : result.error,
      type: result.ok ? "success" : "error",
    });
  };

  const handleSavePreferences = async (next: NotificationPreferencesDraft) => {
    setIsSavingPreferences(true);
    const result = await save({
      enabled: next.enabled,
      quietHours: next.quietHours,
      timeZone: preferences?.timeZone,
    });
    setIsSavingPreferences(false);
    if (result.ok) {
      toast.add({ title: "Preferências salvas.", type: "success" });
    } else {
      toast.add({ title: result.error, type: "error" });
    }
  };

  return (
    <Card className="border-border shadow-(--shadow-card)">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4 text-primary" aria-hidden="true" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground">
            {PERMISSION_MESSAGES[state] ?? PERMISSION_MESSAGES.default}
          </p>
        </div>

        <Separator />

        <div className="px-5 py-4">
          {state === "granted" ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              Notificações ativadas
            </p>
          ) : state === "requesting" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Aguardando permissão do navegador…
            </p>
          ) : isBlocked ? (
            <div className="flex items-start gap-2">
              <BellOff
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {state === "denied"
                    ? "Notificações bloqueadas"
                    : "Notificações indisponíveis"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state === "denied"
                    ? "Altere as permissões do site nas configurações do navegador para ativá-las."
                    : "Você não pode ativar notificações neste ambiente."}
                </p>
              </div>
            </div>
          ) : (
            <Button onClick={() => void request()} className="h-12 w-full text-base">
              Ativar notificações
            </Button>
          )}
        </div>

        {supported ? (
          <div className="px-5 pb-4">
            <NotificationCapabilityNotice capability={caps.notifications} />
          </div>
        ) : null}

        <Separator />

        <section aria-labelledby="notification-reminders-title" className="px-5 py-4">
          <h3
            id="notification-reminders-title"
            className="text-sm font-medium text-foreground"
          >
            Lembretes
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina os horários e os tipos de registro que você quer lembrar. Tudo
            fica salvo apenas neste dispositivo.
          </p>

          <div className="mt-3">
            {isLoading ? (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Carregando lembretes…
              </p>
            ) : error ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : (
              <NotificationScheduleList
                schedules={schedules}
                isPending={isPending}
                onToggle={(schedule) => void handleToggle(schedule)}
                onEdit={openEditDialog}
                onRemove={(schedule) => void handleRemove(schedule)}
              />
            )}
          </div>

          <Button
            variant="outline"
            className="mt-4 h-11 w-full"
            disabled={!canManage || isLoading}
            onClick={openCreateDialog}
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar lembrete
          </Button>

          {!canManage ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Ative a permissão de notificações no navegador para gerenciar
              lembretes.
            </p>
          ) : null}
        </section>

        <Separator />

        <section aria-labelledby="notification-preferences-title" className="px-5 py-4">
          <h3
            id="notification-preferences-title"
            className="text-sm font-medium text-foreground"
          >
            Preferências
          </h3>

          <div className="mt-3 space-y-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 text-sm">
              <input
                type="checkbox"
                checked={draft.enabled}
                disabled={isSavingPreferences}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, enabled: event.target.checked }))
                }
                className="size-4 accent-primary"
              />
              <span className="font-medium text-foreground">Ativar lembretes</span>
            </label>

            <QuietHoursForm
              value={draft.quietHours}
              disabled={isSavingPreferences}
              onChange={(next) =>
                setDraft((current) => ({ ...current, quietHours: next }))
              }
            />

            <Button
              variant="outline"
              className="h-11 w-full"
              disabled={!isDirty || isSavingPreferences}
              onClick={() => void handleSavePreferences(draft)}
            >
              {isSavingPreferences ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Salvar preferências
            </Button>
          </div>
        </section>

        <Separator />

        <DeviceCapabilitiesRow caps={caps} />
      </CardContent>

      {dialogOpen ? (
        <NotificationScheduleDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          schedule={editing}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Card>
  );
}

function DeviceCapabilitiesRow({
  caps,
}: {
  caps: ReturnType<typeof useBrowserCapabilities>;
}) {
  const items = [
    {
      label: "Notificações",
      supported: caps.notifications.supported,
      icon: Bell,
    },
    {
      label: "Reconhecimento de voz",
      supported: caps.speechRecognition.supported,
      icon: Mic,
    },
    { label: "Câmera", supported: caps.camera.supported, icon: CameraIcon },
  ];
  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium text-foreground">
        Recursos do dispositivo
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <item.icon
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{item.label}</span>
            <span
              aria-label={item.supported ? "Disponível" : "Indisponível"}
              className={item.supported ? "text-success" : "text-destructive"}
            >
              {item.supported ? "✓" : "✕"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
