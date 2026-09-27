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
  type NotificationActionResult,
  type NotificationPreferences,
  type NotificationSchedule,
  type NotificationScheduleInput,
} from "@/lib/notifications/types";
import { Bell, Loader2, Plus } from "lucide-react";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { useNotificationSchedules } from "../hooks/use-notification-schedules";
import { DeviceCapabilitiesList } from "../ui/device-capabilities-list.ui";
import { NotificationCapabilityNotice } from "../ui/notification-capability-notice.ui";
import { NotificationPermissionPanel } from "../ui/notification-permission-panel.ui";
import {
  NotificationPreferencesPanel,
  type NotificationPreferencesDraft,
} from "../ui/notification-preferences-panel.ui";
import { NotificationScheduleList } from "../ui/notification-schedule-list.ui";
import { NotificationScheduleDialog } from "./notification-schedule-dialog.widget";

const INITIAL_DRAFT: NotificationPreferencesDraft = {
  enabled: false,
  quietHours: { ...NOTIFICATION_DEFAULT_QUIET_HOURS },
};

/**
 * Tells whether the draft differs from the persisted record. The comparison is
 * explicit about the edited fields so a new preference field cannot be silently
 * ignored by the save button.
 */
function isDraftDirty(
  draft: NotificationPreferencesDraft,
  preferences: NotificationPreferences | null,
): boolean {
  if (!preferences) return false;
  return (
    draft.enabled !== preferences.enabled ||
    draft.quietHours.enabled !== preferences.quietHours.enabled ||
    draft.quietHours.start !== preferences.quietHours.start ||
    draft.quietHours.end !== preferences.quietHours.end
  );
}

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
  const [draft, setDraft] = useState<NotificationPreferencesDraft>(INITIAL_DRAFT);
  const [syncedPreferences, setSyncedPreferences] =
    useState<NotificationPreferences | null>(null);

  // Reset the form during render whenever a different preferences record arrives
  // (first load or a successful save) instead of mirroring it in an effect.
  if (preferences && preferences !== syncedPreferences) {
    setSyncedPreferences(preferences);
    setDraft({ enabled: preferences.enabled, quietHours: preferences.quietHours });
  }

  const isDirty = isDraftDirty(draft, preferences);
  const isBlocked = state === "denied" || state === "unsupported";
  const canManage = supported && state === "granted";

  /**
   * Every reminder mutation blocks the list while it runs and reports the
   * failure. A `successMessage` is only passed by the mutations that confirm
   * the outcome to the user, as toggling a reminder is self-evident.
   */
  const runScheduleMutation = async <T,>(
    mutation: () => Promise<NotificationActionResult<T>>,
    successMessage?: string,
  ): Promise<NotificationActionResult<T>> => {
    setIsPending(true);
    const result = await mutation();
    setIsPending(false);

    if (!result.ok) {
      toast.add({ title: result.error, type: "error" });
      return result;
    }
    if (successMessage) {
      toast.add({ title: successMessage, type: "success" });
    }
    return result;
  };

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: NotificationSchedule) => {
    setEditing(schedule);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: NotificationScheduleInput) =>
    runScheduleMutation(
      () => (editing ? update(editing.id, input) : create(input)),
      editing ? "Lembrete atualizado com sucesso." : "Lembrete criado com sucesso.",
    );

  const handleToggle = (schedule: NotificationSchedule) =>
    runScheduleMutation(() => setEnabled(schedule.id, !schedule.enabled));

  const handleRemove = (schedule: NotificationSchedule) =>
    runScheduleMutation(() => remove(schedule.id), "Lembrete excluído.");

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    const result = await save({
      enabled: draft.enabled,
      quietHours: draft.quietHours,
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
    <Card id="notificacoes" className="scroll-mt-16 border-border shadow-(--shadow-card)">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4 text-primary" aria-hidden="true" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <NotificationPermissionPanel
          state={state}
          isBlocked={isBlocked}
          onRequest={() => void request()}
        />

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
                onToggle={handleToggle}
                onEdit={openEditDialog}
                onRemove={handleRemove}
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

        <NotificationPreferencesPanel
          value={draft}
          onChange={setDraft}
          isDirty={isDirty}
          isSaving={isSavingPreferences}
          onSave={() => void handleSavePreferences()}
        />

        <Separator />

        <DeviceCapabilitiesList capabilities={caps} />
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
