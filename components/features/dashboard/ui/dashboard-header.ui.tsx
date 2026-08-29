import type { ReactNode } from "react";
import { greeting } from "../utils/greeting";

type DashboardHeaderProps = {
  userName?: string;
  subtitle?: string;
  action?: ReactNode;
};

export function DashboardHeader({
  userName,
  subtitle = "Veja como foi seu acompanhamento hoje.",
  action,
}: DashboardHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting(new Date())}, {userName ?? "usuário"}!
        </h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}