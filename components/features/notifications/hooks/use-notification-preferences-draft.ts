"use client";

import { useState } from "react";
import {
  NOTIFICATION_DEFAULT_QUIET_HOURS,
  type NotificationPreferences,
} from "@/lib/notifications/types";
import type { NotificationPreferencesDraft } from "../ui/notification-preferences-panel.ui";

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

/**
 * Owns the editable copy of the preferences form: it mirrors the persisted
 * record whenever a different one arrives (first read or a successful save) and
 * reports whether the user changed something worth persisting. The save itself
 * belongs to the settings widget, which also reports its outcome.
 */
export function useNotificationPreferencesDraft(
  preferences: NotificationPreferences | null,
) {
  const [draft, setDraft] = useState<NotificationPreferencesDraft>(INITIAL_DRAFT);
  const [syncedPreferences, setSyncedPreferences] =
    useState<NotificationPreferences | null>(null);

  // Reset the draft during render whenever a different preferences record
  // arrives, instead of mirroring it in an effect that would render once with
  // the previous draft.
  if (preferences && preferences !== syncedPreferences) {
    setSyncedPreferences(preferences);
    setDraft({ enabled: preferences.enabled, quietHours: preferences.quietHours });
  }

  return { draft, setDraft, isDirty: isDraftDirty(draft, preferences) };
}