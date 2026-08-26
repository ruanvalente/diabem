"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Apple, Check, Loader2 } from "lucide-react";
import Link from "next/link";

const mealTypes = [
  "Café da manhã",
  "Almoço",
  "Jantar",
  "Lanche",
  "Outra",
];

export default function MealsPage() {
  const [mealType, setMealType] = useState("");
  const [description, setDescription] = useState("");
  const [carbs, setCarbs] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);

  const handleSave = async () => {
    if (!mealType) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

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
            Registrar refeição
          </h1>
          <p className="text-sm text-muted-foreground">
            Adicione informações sobre sua refeição
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Meal Type */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-3 block text-sm font-medium text-foreground">
              Tipo de refeição
            </label>
            <div className="flex flex-wrap gap-2">
              {mealTypes.map((type) => (
                <Button
                  key={type}
                  variant={mealType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMealType(type)}
                  className={
                    mealType === type
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Horário
            </label>
            <Input
              type="time"
              defaultValue={timeStr}
              className="h-12 w-40 bg-muted/50"
            />
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Descrição
            </label>
            <Input
              placeholder="Ex: Arroz, feijão, peixe e salada"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 bg-muted/50"
            />
          </CardContent>
        </Card>

        {/* Carbs */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Carboidratos (opcional)
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="h-12 bg-muted/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                g
              </span>
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
              placeholder="Ex: Refeição leve"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 bg-muted/50"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={!mealType || isSaving}
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
              <Apple className="size-4" />
              Salvar refeição
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
