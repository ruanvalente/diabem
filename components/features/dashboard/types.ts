import type { LucideIcon } from "lucide-react";

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