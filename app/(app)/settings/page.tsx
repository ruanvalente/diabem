"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Palette,
  Ruler,
  Bell,
  Shield,
  ChevronRight,
  Smartphone,
  Download,
  Trash2,
  Lock,
} from "lucide-react";

const settingsSections = [
  {
    title: "Perfil",
    icon: User,
    items: [
      { label: "Nome", value: "Ruan" },
      { label: "Email", value: "ruan@email.com" },
      { label: "Preferências", value: "" },
    ],
  },
  {
    title: "Aparência",
    icon: Palette,
    items: [
      { label: "Modo", value: "Sistema" },
    ],
  },
  {
    title: "Unidades",
    icon: Ruler,
    items: [
      { label: "Glicemia", value: "mg/dL" },
      { label: "Peso", value: "kg" },
    ],
  },
  {
    title: "Notificações",
    icon: Bell,
    items: [
      { label: "Lembretes", value: "Ativados" },
      { label: "Notificações do navegador", value: "Desativados" },
    ],
  },
  {
    title: "Privacidade e segurança",
    icon: Shield,
    items: [
      { label: "Bloqueio de aplicação", value: "Desativado" },
      { label: "Criptografia", value: "Não disponível" },
    ],
  },
  {
    title: "Aplicação",
    icon: Smartphone,
    items: [
      { label: "Versão", value: "1.0.0" },
      { label: "Armazenamento", value: "Local (IndexedDB)" },
      { label: "Status", value: "Online" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil e preferências
        </p>
      </div>

      <div className="space-y-4">
        {settingsSections.map((section) => (
          <Card
            key={section.title}
            className="border-border shadow-[var(--shadow-card)]"
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <section.icon className="size-4 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {section.items.map((item, index) => (
                <div key={item.label}>
                  {index > 0 && <Separator />}
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {item.value}
                      </span>
                      <ChevronRight className="size-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Data Management */}
        <Card className="border-border shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-primary" />
              Gerenciamento de dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="size-4" />
              Exportar meus dados
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Lock className="size-4" />
              Bloquear aplicação
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
            >
              <Trash2 className="size-4" />
              Apagar todos os dados
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
