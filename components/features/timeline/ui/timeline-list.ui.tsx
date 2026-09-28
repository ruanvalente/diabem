"use client";

import { Badge } from "@/components/ui/badge";
import { groupByLocalDay, formatTime } from "@/lib/date";
import {
  GLUCOSE_CONTEXT_LABELS,
  MEAL_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
  TIMELINE_EVENT_LABELS,
} from "@/lib/health/constants";
import { getGlucoseRangeInfo } from "@/lib/health/glucose-range";
import { formatMedicationDetails } from "@/lib/health/medication-display";
import type { TimelineEvent, TimelineEventType } from "@/lib/health/types";
import type { ReactNode } from "react";
import { Apple, Activity as ActivityIcon, Droplets, NotebookPen, Pill } from "lucide-react";

const TYPE_ICONS: Record<TimelineEventType, typeof Droplets> = {
  glucose: Droplets,
  meal: Apple,
  activity: ActivityIcon,
  note: NotebookPen,
  medication: Pill,
};

/**
 * Presentation data for a single timeline event. Each event type contributes
 * only what makes it different — the row layout lives in `TimelineEventRow`.
 */
type TimelineEventView = {
  title: string;
  secondary: string;
  secondaryClamp: "truncate" | "line-clamp-2";
  badge?: ReactNode;
};

const SECONDARY_CLASS_NAME = "text-xs text-muted-foreground";

/**
 * Resolves the display data of an event. The switch covers every member of the
 * `TimelineEvent` union, so adding a new event type is a compile-time error
 * instead of a silently blank row.
 */
function getEventView(event: TimelineEvent): TimelineEventView | null {
  switch (event.type) {
    case "glucose": {
      const range = getGlucoseRangeInfo(event.data.value);
      return {
        title: TIMELINE_EVENT_LABELS.glucose,
        badge: (
          <Badge variant={range.badgeVariant} className={range.badgeClassName}>
            {event.data.value} mg/dL
          </Badge>
        ),
        secondary: [
          GLUCOSE_CONTEXT_LABELS[event.data.context],
          event.data.notes,
        ]
          .filter(Boolean)
          .join(" · "),
        secondaryClamp: "truncate",
      };
    }
    case "meal":
      return {
        title: MEAL_TYPE_LABELS[event.data.type],
        secondary: [event.data.description, event.data.notes]
          .filter(Boolean)
          .join(" · "),
        secondaryClamp: "truncate",
      };
    case "activity":
      return {
        title: ACTIVITY_TYPE_LABELS[event.data.type],
        secondary: [`${event.data.durationMinutes} min`, event.data.notes]
          .filter(Boolean)
          .join(" · "),
        secondaryClamp: "truncate",
      };
    case "note":
      return {
        title: TIMELINE_EVENT_LABELS.note,
        secondary: event.data.content,
        secondaryClamp: "line-clamp-2",
      };
    case "medication": {
      const details = formatMedicationDetails(event.data);
      return {
        title: event.data.name,
        secondary: [
          TIMELINE_EVENT_LABELS.medication,
          details,
          event.data.notes,
        ]
          .filter(Boolean)
          .join(" · "),
        secondaryClamp: "truncate",
      };
    }
    default: {
      const exhaustive: never = event;
      void exhaustive;
      return null;
    }
  }
}

function EventIcon({ type }: { type: TimelineEventType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </div>
  );
}

function TimelineEventRow({ event }: { event: TimelineEvent }) {
  const view = getEventView(event);
  if (!view) return null;

  const time = formatTime(event.at);

  return (
    <div className="flex items-start gap-3 p-4">
      <EventIcon type={event.type} />
      <div className="min-w-0 flex-1">
        {view.badge ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {view.title}
            </p>
            {view.badge}
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        ) : (
          <p className="text-sm font-semibold text-foreground">
            {view.title}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              {time}
            </span>
          </p>
        )}
        <p
          className={`mt-0.5 ${view.secondaryClamp} ${SECONDARY_CLASS_NAME}`}
        >
          {view.secondary}
        </p>
      </div>
    </div>
  );
}

type TimelineListProps = {
  events: TimelineEvent[];
  emptyState?: ReactNode;
};

export function TimelineList({ events, emptyState }: TimelineListProps) {
  if (events.length === 0 && emptyState) return <>{emptyState}</>;

  const groups = groupByLocalDay(events, (event) => event.at);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.dayKey} aria-label={group.label}>
          <h2 className="mb-2 px-1 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="space-y-2.5">
            {group.items.map((event) => (
              <TimelineEventRow key={`${event.type}-${event.id}`} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
