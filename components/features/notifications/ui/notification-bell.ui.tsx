import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_COUNT = 99;

export type NotificationBellProps = {
  count: number;
};

export function NotificationBell({ count }: NotificationBellProps) {
  const hasDeliveries = count > 0;
  const label = hasDeliveries
    ? `Notificações: ${count} ${
        count === 1 ? "apresentada" : "apresentadas"
      } nesta sessão`
    : "Notificações";

  return (
    <Link
      href="/settings#notificacoes"
      aria-label={label}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative",
        // The icon keeps the 28px box of its neighbours while the tap area
        // reaches the 48px minimum.
        "after:absolute after:-inset-2.5 after:content-['']",
      )}
    >
      <Bell className="size-4" aria-hidden="true" />
      {hasDeliveries ? (
        <Badge
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 h-4 min-w-4 gap-0 px-1 text-[10px] leading-none"
        >
          {count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : count}
        </Badge>
      ) : null}
    </Link>
  );
}
