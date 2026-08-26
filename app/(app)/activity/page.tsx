"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Activity, Check, Loader2 } from "lucide-react";
import Link from "next/link";

const activityTypes = [
  "Caminhada",
  "Corrida",
  "Bicicleta",
  "Academia",
  "Esporte",
  "Natação",
  "Outro",
];

const intensities = ["Leve", "Moderada", "Intensa"];

export default function ActivityPage() {
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);

  const handleSave = async () => {
    if (!activityType || !duration) return;
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
            Registrar atividade
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre sua atividade física
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Activity Type */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-3 block text-sm font-medium text-foreground">
              Tipo de atividade
            </label>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <Button
                  key={type}
                  variant={activityType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivityType(type)}
                  className={
                    activityType === type
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

        {/* Duration & Time */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Duração (min)
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 bg-muted/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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

        {/* Intensity */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-3 block text-sm font-medium text-foreground">
              Intensidade
            </label>
            <div className="flex gap-2">
              {intensities.map((int) => (
                <Button
                  key={int}
                  variant={intensity === int ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIntensity(int)}
                  className={
                    intensity === int
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  {int}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distance */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Distância (opcional)
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="h-12 bg-muted/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                km
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Observação (opcional)
            </label>
            <Input
              placeholder="Ex: No parque com amigos"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 bg-muted/50"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={!activityType || !duration || isSaving}
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
              <Activity className="size-4" />
              Salvar atividade
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
