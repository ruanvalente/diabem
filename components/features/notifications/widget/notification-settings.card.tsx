"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationPermission } from "@/lib/browser/hooks/use-notifications";
import { useBrowserCapabilities } from "@/lib/browser/hooks/use-browser-capabilities";
import { notificationService } from "@/lib/browser/services/notification.service";
import { reminderService, type Reminder } from "@/lib/browser/reminders";
import { toast } from "@/components/ui/toast";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Mic,
  Camera as CameraIcon,
} from "lucide-react";

const PERMISSION_MESSAGES: Record<string, { title: string; body: string }> = {
  default: {
    title: "Ativar notificações",
    body: "Receba lembretes definidos por você quando houver um registro pendente.",
  },
  granted: {
    title: "Notificações ativadas",
    body: "Você receberá lembretes definidos por você neste dispositivo.",
  },
  denied: {
    title: "Notificações bloqueadas",
    body: "As notificações foram bloqueadas pelo navegador. Verifique as permissões do site nas configurações do navegador.",
  },
  unsupported: {
    title: "Notificações indisponíveis",
    body: "Seu navegador não suporta notificações neste contexto. O aplicativo continua funcionando normalmente.",
  },
};

export function NotificationSettingsCard() {
  const { state, supported, request } = useNotificationPermission();
  const caps = useBrowserCapabilities();

  const message = PERMISSION_MESSAGES[state] ?? PERMISSION_MESSAGES.default;

  const isBlocked = state === "denied" || state === "unsupported";

  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4 text-primary" aria-hidden="true" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground">{message.body}</p>
        </div>

        <div className="border-t border-border px-5 py-4">
          {state === "granted" ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
              Notificações ativadas
            </p>
          ) : state === "requesting" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Aguardando permissão do navegador…
            </p>
          ) : isBlocked ? (
            <div className="flex items-start gap-2">
              <BellOff className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">{message.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você pode ativar novamente nas permissões do navegador.
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => void request()}
              className="h-12 w-full text-base"
            >
              Ativar notificações
            </Button>
          )}
        </div>

        {supported && state === "granted" && (
          <ReminderTestControl />
        )}

        <DeviceCapabilitiesRow caps={caps} />
      </CardContent>
    </Card>
  );
}

function ReminderTestControl() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    setReminders(reminderService.list());
  }, []);

  const addReminder = () => {
    const reminder = reminderService.save({
      title: "Registro pendente",
      scheduledAt: new Date().toISOString(),
    });
    setReminders(reminderService.list());

    // Fire immediately (the document is open) to demonstrate delivery.
    void notificationService
      .notify({ title: reminder.title, body: "Lembrete: há um registro pendente." })
      .then((res) => {
        if (res && "fallback" in res && res.fallback) {
          toast.add({
            title: "As notificações do navegador não estão ativas; mostramos aqui como lembrete.",
            type: "info",
          });
        }
      });
  };

  return (
    <div className="border-t border-border px-5 py-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">Lembretes</p>
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum lembrete configurado. Crie um lembrete pendente para testar.
          </p>
        ) : (
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {r.title}{" "}
                  <span className="text-muted-foreground">
                    · {formatReminderTime(r)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    reminderService.remove(r.id);
                    setReminders(reminderService.list());
                  }}
                  className="text-sm font-medium text-destructive underline underline-offset-4"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button
          variant="outline"
          onClick={addReminder}
          className="h-11 w-full"
        >
          Criar lembrete de teste
        </Button>
      </div>
    </div>
  );
}

function DeviceCapabilitiesRow({
  caps,
}: {
  caps: ReturnType<typeof useBrowserCapabilities>;
}) {
  const items = [
    {
      label: "Notificações",
      supported: caps.notifications.supported,
      icon: Bell,
    },
    {
      label: "Reconhecimento de voz",
      supported: caps.speechRecognition.supported,
      icon: Mic,
    },
    { label: "Câmera", supported: caps.camera.supported, icon: CameraIcon },
  ];
  return (
    <div className="border-t border-border px-5 py-4">
      <p className="text-sm font-medium text-foreground">Recursos do dispositivo</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">{item.label}</span>
            <span
              aria-label={item.supported ? "Disponível" : "Indisponível"}
              className={
                item.supported ? "text-success" : "text-destructive"
              }
            >
              {item.supported ? "✓" : "✕"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatReminderTime(reminder: Reminder): string {
  const date = new Date(reminder.scheduledAt);
  if (Number.isNaN(date.getTime())) return "agora";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}