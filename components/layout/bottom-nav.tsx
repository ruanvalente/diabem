"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Home, Clock, Plus, BarChart3, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home, isAction: false },
  { href: "/timeline", label: "Timeline", icon: Clock, isAction: false },
  { href: "/glucose", label: "Registrar", icon: Plus, isAction: true },
  {
    href: "/statistics",
    label: "Estatísticas",
    icon: BarChart3,
    isAction: false,
  },
  {
    href: "/settings",
    label: "Configurações",
    icon: Settings,
    isAction: false,
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Menu inferior"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid grid-cols-5 items-end">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          if (item.isAction) {
            return (
              <div key={item.label} className="flex justify-center">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-(--shadow-elevated)]"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="flex size-12 items-center justify-center rounded-full"
                  >
                    <item.icon className="size-5" aria-hidden="true" />
                  </motion.div>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <item.icon className="size-5" aria-hidden="true" />
              </motion.div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
