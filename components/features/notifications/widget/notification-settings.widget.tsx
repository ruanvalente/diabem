"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth/use-auth";
import { useBrowserCapabilities } from "@/lib/browser/hooks/use-browser-capabilities";
import { useNotificationPermission } from "@/lib/browser/hooks/use-notifications";
import type { NotificationSchedule } from "@/lib/notifications/types";
import { Bell } from "lucide-react";
import { useNotificationPreferencesDraft } from "../hooks/use-notification-preferences-draft";
import { useNotificationPreferences } from "../hooks/use-notification-preferences";
import { useNotificationScheduleActions } from "../hooks/use-notification-schedule-actions";
import { useNotificationSchedules } from "../hooks/use-notification-schedules";
import { DeviceCapabilitiesList } from "../ui/device-capabilities-list.ui";
import { NotificationCapabilityNotice } from "../ui/notification-capability-notice.ui";
import { NotificationPermissionPanel } from "../ui/notification-permission-panel.ui";
import { NotificationPreferencesPanel } from "../ui/notification-preferences-panel.ui";
import { NotificationRemindersSection } from "../ui/notification-reminders-section.ui";
import { NotificationScheduleDialog } from "./notification-schedule-dialog.widget";

/**
 * Composes the notification settings card. It owns the permission state, the
 * preferences draft and which reminder the dialog is editing; every block below
 * is a UI component fed with data and callbacks by the hooks of this feature.
 */
export function NotificationSettingsCard() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { state, supported, request } = useNotificationPermission();
  const caps = useBrowserCapabilities();
  const schedulesApi = useNotificationSchedules(userId);
  const { preferences, save } = useNotificationPreferences(userId);
  const { draft, setDraft, isDirty } = useNotificationPreferencesDraft(preferences);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationSchedule | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const { isPending, submit, toggle, remove } =
    useNotificationScheduleActions(schedulesApi);

  const canManage = supported && state === "granted";

  const openCreateDialog = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: NotificationSchedule) => {
    setEditing(schedule);
    setDialogOpen(true);
  };

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
    <Card
      id="notificacoes"
      className="scroll-mt-16 border-border shadow-(--shadow-card)"
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4 text-primary" aria-hidden="true" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <NotificationPermissionPanel
          state={state}
          onRequest={() => void request()}
        />

        {supported ? (
          <div className="px-5 pb-4">
            <NotificationCapabilityNotice capability={caps.notifications} />
          </div>
        ) : null}

        <Separator />

        <NotificationRemindersSection
          schedules={schedulesApi.schedules}
          isLoading={schedulesApi.isLoading}
          error={schedulesApi.error}
          isPending={isPending}
          canManage={canManage}
          onCreate={openCreateDialog}
          onToggle={toggle}
          onEdit={openEditDialog}
          onRemove={remove}
        />

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
          onSubmit={(input) => submit(input, editing)}
        />
      ) : null}
    </Card>
  );
}
