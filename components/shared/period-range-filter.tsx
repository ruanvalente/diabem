"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PeriodFilterWithCustom, PeriodSelection } from "@/lib/date";

const OPTIONS: { value: PeriodFilterWithCustom; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "7 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

type PeriodRangeFilterProps = {
  value: PeriodSelection;
  onChange: (next: PeriodSelection) => void;
  className?: string;
};

export function PeriodRangeFilter({
  value,
  onChange,
  className,
}: PeriodRangeFilterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [from, setFrom] = useState(value.custom?.from ?? "");
  const [to, setTo] = useState(value.custom?.to ?? "");

  const empty = !from || !to;
  const reversed = !empty && from > to;
  const invalid = empty || reversed;
  const showValidation = (from !== "" || to !== "") && invalid;

  const handleSelect = (next: PeriodFilterWithCustom) => {
    if (next === "custom") {
      setFrom(value.custom?.from ?? "");
      setTo(value.custom?.to ?? "");
      setDialogOpen(true);
      return;
    }
    onChange({ period: next, custom: null });
  };

  const applyCustomRange = () => {
    if (invalid) return;
    onChange({ period: "custom", custom: { from, to } });
    setDialogOpen(false);
  };

  return (
    <>
      <Select
        value={value.period}
        onValueChange={(next) =>
          next && handleSelect(next as PeriodFilterWithCustom)
        }
      >
        <SelectTrigger
          size="default"
          aria-label="Filtrar por período"
          className={cn("h-12 min-w-32", className)}
        >
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Período personalizado</DialogTitle>
            <DialogDescription>
              Escolha as datas de início e fim do período.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="period-from">De</Label>
              <Input
                id="period-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                aria-invalid={invalid || undefined}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="period-to">Até</Label>
              <Input
                id="period-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                aria-invalid={invalid || undefined}
              />
            </div>
            {showValidation && (
              <p className="text-sm text-destructive" role="alert">
                {reversed
                  ? "A data final deve ser igual ou posterior à inicial."
                  : "Informe as datas de início e fim."}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={applyCustomRange} disabled={invalid}>
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
