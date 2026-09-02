"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Check, Loader2 } from "lucide-react";
import Link from "next/link";

const medicationTypes = ["Insulina", "Metformina", "Outro"];
const dosageUnits = ["mg", "UI", "ml"];

export default function MedicationsPage() {
  const [medication, setMedication] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mg");
  const [type, setType] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5);

  const handleSave = async () => {
    if (!medication) return;
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
        <Link href="/dashboard" aria-label="Voltar ao dashboard">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Registrar medicamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre sua medicação
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Medication Name */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label htmlFor="medication" className="mb-1.5 block text-sm font-medium text-foreground">
              Medicamento
            </label>
            <Input
              id="medication"
              placeholder="Ex: Metformina"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              className="h-12 bg-muted/50"
            />
          </CardContent>
        </Card>

        {/* Dose & Unit */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dose" className="mb-1.5 block text-sm font-medium text-foreground">
                  Dose
                </label>
                <Input
                  id="dose"
                  type="number"
                  placeholder="850"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="h-12 bg-muted/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Unidade
                </span>
                <div className="flex gap-2" role="group" aria-label="Unidade de dosagem">
                  {dosageUnits.map((u) => (
                    <Button
                      key={u}
                      variant={unit === u ? "default" : "outline"}
                      size="sm"
                      aria-pressed={unit === u}
                      onClick={() => setUnit(u)}
                      className={
                        unit === u ? "bg-primary text-primary-foreground" : ""
                      }
                    >
                      {u}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label htmlFor="time" className="mb-1.5 block text-sm font-medium text-foreground">
              Horário
            </label>
            <Input
              id="time"
              type="time"
              defaultValue={timeStr}
              className="h-12 w-40 bg-muted/50"
            />
          </CardContent>
        </Card>

        {/* Type */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <span className="mb-3 block text-sm font-medium text-foreground">
              Tipo
            </span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de medicação">
              {medicationTypes.map((t) => (
                <Button
                  key={t}
                  variant={type === t ? "default" : "outline"}
                  size="sm"
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                  className={
                    type === t ? "bg-primary text-primary-foreground" : ""
                  }
                >
                  {t}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-foreground">
              Observação (opcional)
            </label>
            <Input
              id="note"
              placeholder="Ex: Tomado após o café da manhã"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 bg-muted/50"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={!medication || isSaving}
          className="h-12 w-full text-base"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span className="sr-only">Salvando...</span>
            </>
          ) : saved ? (
            <>
              <Check className="size-4" />
              Salvo com sucesso
            </>
          ) : (
            <>
              <Heart className="size-4" />
              Salvar medicamento
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
