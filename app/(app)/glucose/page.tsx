"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Droplets, Loader2 } from "lucide-react";
import Link from "next/link";

const contexts = [
  "Jejum",
  "Antes da refeição",
  "Após a refeição",
  "Antes de dormir",
  "Outro",
];

export default function GlucosePage() {
  const [value, setValue] = useState("");
  const [context, setContext] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().slice(0, 5);

  const handleSave = async () => {
    if (!value) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const getValueStatus = () => {
    const num = parseInt(value);
    if (isNaN(num)) return null;
    if (num < 70) return { label: "Baixa", variant: "destructive" as const };
    if (num <= 140) return { label: "No intervalo", variant: "default" as const };
    if (num <= 180) return { label: "Alta", variant: "secondary" as const };
    return { label: "Muito alta", variant: "destructive" as const };
  };

  const status = getValueStatus();

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Registrar glicemia
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre sua medição de glicose
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Value */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Valor da medição
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-16 bg-muted/50 text-center text-3xl font-bold tracking-tight [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                mg/dL
              </span>
            </div>
            {status && (
              <div className="mt-3 text-center">
                <Badge
                  variant={status.variant}
                  className={
                    status.variant === "default"
                      ? "bg-success/10 text-success border-success/30"
                      : ""
                  }
                >
                  {status.label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Data
                </label>
                <Input
                  type="date"
                  defaultValue={dateStr}
                  className="h-12 bg-muted/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Horário
                </label>
                <Input
                  type="time"
                  defaultValue={timeStr}
                  className="h-12 bg-muted/50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-3 block text-sm font-medium text-foreground">
              Contexto da medição
            </label>
            <div className="flex flex-wrap gap-2">
              {contexts.map((ctx) => (
                <Button
                  key={ctx}
                  variant={context === ctx ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContext(ctx)}
                  className={
                    context === ctx
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  {ctx}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Observação (opcional)
            </label>
            <Input
              placeholder="Ex: Após almoço leve"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 bg-muted/50"
            />
          </CardContent>
        </Card>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={!value || isSaving}
          className="h-12 w-full text-base"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="size-4" />
              Salvo com sucesso
            </>
          ) : (
            <>
              <Droplets className="size-4" />
              Salvar registro
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
