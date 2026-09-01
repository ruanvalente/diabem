"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Home, Clock, Plus, BarChart3, Settings } from "lucide-react";

const bottomNavItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/dashboard", label: "Registrar", icon: Plus, isAction: true },
  { href: "/statistics", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Config", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isAction) {
            return (
              <Link
                key={item.label}
                href="/glucose"
                aria-label="Registrar glicemia"
                className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex size-12 items-center justify-center rounded-full"
                >
                  <item.icon className="size-5" />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <item.icon className="size-5" />
              </motion.div>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
