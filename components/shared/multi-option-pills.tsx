"use client";

import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MultiOptionPill<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type MultiOptionPillsProps<T extends string> = {
  options: MultiOptionPill<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  className?: string;
};

export function MultiOptionPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: MultiOptionPillsProps<T>) {
  const allActive = value.length === 0;

  const isActive = (option: T) => allActive || value.includes(option);

  const toggle = (option: T) => {
    if (allActive) {
      onChange([option]);
      return;
    }
    if (value.includes(option)) {
      const next = value.filter((entry) => entry !== option);
      onChange(next.length === 0 ? [] : next);
      return;
    }
    onChange([...value, option]);
  };

  return (
    <div
      role="group"
      aria-label="Filtrar por tipo"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const active = isActive(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option.value)}
            className={cn(
              buttonVariants({
                variant: active ? "default" : "outline",
                size: "sm",
              }),
              "h-12 px-4",
              active
                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                : "bg-background hover:bg-muted",
            )}
          >
            {option.icon && <option.icon aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
