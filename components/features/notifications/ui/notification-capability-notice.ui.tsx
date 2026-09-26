import type { NotificationCapability } from "@/lib/browser/capabilities/notifications";
import { BellOff, Info } from "lucide-react";

type NotificationCapabilityNoticeProps = {
  capability: NotificationCapability;
};

type Notice = {
  tone: "warning" | "info";
  title: string;
  body: string;
};

/**
 * Reports what the platform can and cannot do. The permission state is not
 * handled here: the settings card owns it, because it also owns the action that
 * resolves it, and rendering both produced two notices for the same condition.
 */
function resolveNotice({
  capability,
}: NotificationCapabilityNoticeProps): Notice | null {
  if (!capability.supported) {
    return {
      tone: "warning",
      title: "Notificações não suportadas",
      body: "Seu navegador não oferece suporte a notificações neste ambiente. O aplicativo continua funcionando normalmente.",
    };
  }

  if (!capability.scheduling.reliableBackgroundDelivery) {
    return {
      tone: "info",
      title: "Lembretes dependem do app aberto",
      body: "Navegadores não permitem garantir lembretes com o aplicativo fechado. Seus horários ficam salvos neste dispositivo e os avisos são exibidos enquanto o DiaBem estiver aberto.",
    };
  }

  return null;
}

export function NotificationCapabilityNotice({
  capability,
}: NotificationCapabilityNoticeProps) {
  const notice = resolveNotice({ capability });
  if (!notice) return null;

  const Icon = notice.tone === "warning" ? BellOff : Info;

  return (
    <div
      className={
        notice.tone === "warning"
          ? "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
          : "flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3"
      }
    >
      <Icon
        className={
          notice.tone === "warning"
            ? "mt-0.5 size-4 shrink-0 text-destructive"
            : "mt-0.5 size-4 shrink-0 text-muted-foreground"
        }
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{notice.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{notice.body}</p>
      </div>
    </div>
  );
}
