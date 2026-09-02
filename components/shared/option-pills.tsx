"use client";

import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OptionPill<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type OptionPillsProps<T extends string> = {
  options: OptionPill<T>[];
  value?: T | null;
  onChange: (value: T | undefined) => void;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export function OptionPills<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: OptionPillsProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? undefined : option.value)}
            className={cn(
              buttonVariants({
                variant: active ? "default" : "outline",
                size: "sm",
              }),
              active
                ? "bg-primary text-primary-foreground hover:bg-primary/80"
                : "bg-background hover:bg-muted"
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