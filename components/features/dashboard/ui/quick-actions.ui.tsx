import Link from "next/link";
import type { QuickAction } from "../types";

type QuickActionsProps = {
  actions: QuickAction[];
};

/**
 * Mobile-first quick actions:
 * - On small screens the five actions live in a horizontal scroll-snap rail.
 *   The next card peeks into view as a scroll affordance and Tab-focus
 *   auto-scrolls each link into view, so every action is reachable by
 *   keyboard.
 * - From `sm` up all five fit the width, rendered as a single grid row.
 */
export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Ações rápidas
      </h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:snap-none sm:pb-0">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group shrink-0 snap-start sm:shrink sm:snap-align-none"
          >
            <div className="flex w-20 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 transition-all hover:shadow-(--shadow-elevated) active:scale-[0.98] sm:w-auto sm:p-4">
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${action.color} text-white`}
              >
                <action.icon className="size-5" aria-hidden="true" />
              </div>
              <span className="text-center text-xs font-medium text-muted-foreground group-hover:text-foreground">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}