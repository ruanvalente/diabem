import Link from "next/link";
import type { RecentRecord } from "../types";

type RecentRecordsProps = {
  items: RecentRecord[];
};

export function RecentRecords({ items }: RecentRecordsProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-records-title">
      <h2
        id="recent-records-title"
        className="mb-3 text-sm font-semibold text-foreground"
      >
        Registrados recentemente
      </h2>
      <div className="space-y-2.5">
        {items.map((record) => (
          <Link
            key={`${record.type}-${record.id}`}
            href={record.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-(--shadow-elevated) active:scale-[0.98]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <record.icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {record.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {record.detail}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{record.time}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}