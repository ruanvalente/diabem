import type { LucideIcon } from "lucide-react";
import type { TimelineEventType } from "@/lib/health/types";

export type QuickAction = {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
};

export type SummaryHref = "/glucose" | "/meals" | "/activity" | "/notes";

export type SummaryCard = {
  href: SummaryHref;
  icon: LucideIcon;
  title: string;
  count: number;
  last: string;
  color: string;
  bg: string;
};

export type RecentRecord = {
  id: string;
  type: TimelineEventType;
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  at: string;
  time: string;
};
