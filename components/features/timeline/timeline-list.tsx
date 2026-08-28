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
import type { TimelineEvent, TimelineEventType } from "@/lib/health/types";
import type { ReactNode } from "react";
import { Apple, Activity as ActivityIcon, Droplets, NotebookPen } from "lucide-react";

const TYPE_ICONS: Record<TimelineEventType, typeof Droplets> = {
  glucose: Droplets,
  meal: Apple,
  activity: ActivityIcon,
  note: NotebookPen,
};

function EventIcon({ type }: { type: TimelineEventType }) {
  const Icon = TYPE_ICONS[type];
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </div>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  switch (event.type) {
    case "glucose": {
      const range = getGlucoseRangeInfo(event.data.value);
      return (
        <div className="flex items-start gap-3 p-4">
          <EventIcon type="glucose" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {TIMELINE_EVENT_LABELS.glucose}
              </p>
              <Badge
                variant={range.badgeVariant}
                className={range.badgeClassName}
              >
                {event.data.value} mg/dL
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatTime(event.at)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {GLUCOSE_CONTEXT_LABELS[event.data.context]}
              {event.data.notes ? ` · ${event.data.notes}` : ""}
            </p>
          </div>
        </div>
      );
    }
    case "meal":
      return (
        <div className="flex items-start gap-3 p-4">
          <EventIcon type="meal" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {MEAL_TYPE_LABELS[event.data.type]}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {formatTime(event.at)}
              </span>
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {event.data.description}
              {event.data.notes ? ` · ${event.data.notes}` : ""}
            </p>
          </div>
        </div>
      );
    case "activity":
      return (
        <div className="flex items-start gap-3 p-4">
          <EventIcon type="activity" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {ACTIVITY_TYPE_LABELS[event.data.type]}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {formatTime(event.at)}
              </span>
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {event.data.durationMinutes} min
              {event.data.notes ? ` · ${event.data.notes}` : ""}
            </p>
          </div>
        </div>
      );
    case "note":
      return (
        <div className="flex items-start gap-3 p-4">
          <EventIcon type="note" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {TIMELINE_EVENT_LABELS.note}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {formatTime(event.at)}
              </span>
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {event.data.content}
            </p>
          </div>
        </div>
      );
  }
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
              <TimelineRow key={`${event.type}-${event.id}`} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}