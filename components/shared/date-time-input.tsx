"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DateTimeInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  className?: string;
};

function splitValue(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

/**
 * A date + time pair that behaves like a single `datetime-local` field,
 * emitting `yyyy-MM-ddTHH:mm` in the user's local timezone.
 */
export function DateTimeInput({
  id,
  value,
  onChange,
  dateLabel = "Data",
  timeLabel = "Horário",
  className,
}: DateTimeInputProps) {
  const { date, time } = splitValue(value);

  const update = (part: "date" | "time", next: string) => {
    onChange(part === "date" ? `${next}T${time}` : `${date}T${next}`);
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <div>
        <label
          htmlFor={`${id}-date`}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {dateLabel}
        </label>
        <Input
          id={`${id}-date`}
          type="date"
          value={date}
          onChange={(event) => update("date", event.target.value)}
          className="h-12 bg-muted/50"
        />
      </div>
      <div>
        <label
          htmlFor={`${id}-time`}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {timeLabel}
        </label>
        <Input
          id={`${id}-time`}
          type="time"
          value={time}
          onChange={(event) => update("time", event.target.value)}
          className="h-12 bg-muted/50"
        />
      </div>
    </div>
  );
}