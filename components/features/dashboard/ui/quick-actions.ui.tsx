import Link from "next/link";
import type { QuickAction } from "../types";

type QuickActionsProps = {
  actions: QuickAction[];
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Ações rápidas
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => (
          <Link key={action.label} href={action.href}>
            <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-(--shadow-elevated) active:scale-[0.98]">
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${action.color} text-white`}
              >
                <action.icon className="size-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}