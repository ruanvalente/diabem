"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Share2,
  Calendar,
  Loader2,
  Check,
} from "lucide-react";

const periods = [
  { value: "today", label: "Hoje" },
  { value: "7days", label: "Últimos 7 dias" },
  { value: "30days", label: "Últimos 30 dias" },
  { value: "custom", label: "Período personalizado" },
];

const categories = [
  { value: "glucose", label: "Glicemia", checked: true },
  { value: "meals", label: "Refeições", checked: true },
  { value: "activity", label: "Atividade física", checked: true },
  { value: "medications", label: "Medicamentos", checked: true },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("7days");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">
          Gere relatórios dos seus dados de saúde
        </p>
      </div>

      <div className="space-y-4">
        {/* Period Selection */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="size-4 text-primary" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(p.value)}
                  className={
                    period === p.value
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    defaultChecked={cat.checked}
                    className="size-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground">{cat.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="h-12 w-full text-base"
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : generated ? (
            <>
              <Check className="size-4" />
              Relatório gerado
            </>
          ) : (
            <>
              <FileText className="size-4" />
              Gerar relatório
            </>
          )}
        </Button>

        {/* Report Preview */}
        {generated && (
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">
                Relatório — Últimos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Glicemias</p>
                  <p className="text-lg font-bold text-foreground">28</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Média</p>
                  <p className="text-lg font-bold text-foreground">118 mg/dL</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Refeições</p>
                  <p className="text-lg font-bold text-foreground">21</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Atividades</p>
                  <p className="text-lg font-bold text-foreground">5</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="size-4" />
                  PDF
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="size-4" />
                  CSV
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Share2 className="size-4" />
                  Compartilhar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
