import type { NotificationCapability } from "@/lib/browser/capabilities/notifications";
import { BellOff, Info, type LucideIcon } from "lucide-react";

type NotificationCapabilityNoticeProps = {
  capability: NotificationCapability;
};

type NoticeTone = "warning" | "info";

type Notice = {
  tone: NoticeTone;
  title: string;
  body: string;
};

const TONE_STYLES: Record<
  NoticeTone,
  { icon: LucideIcon; container: string; iconColor: string }
> = {
  warning: {
    icon: BellOff,
    container: "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3",
    iconColor: "mt-0.5 size-4 shrink-0 text-destructive",
  },
  info: {
    icon: Info,
    container: "flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3",
    iconColor: "mt-0.5 size-4 shrink-0 text-muted-foreground",
  },
};

/**
 * Reports what the platform can and cannot do. The permission state is not
 * handled here: the settings card owns it, because it also owns the action that
 * resolves it, and rendering both produced two notices for the same condition.
 */
function resolveNotice(capability: NotificationCapability): Notice | null {
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
  const notice = resolveNotice(capability);
  if (!notice) return null;

  const { icon: Icon, container, iconColor } = TONE_STYLES[notice.tone];

  return (
    <div className={container}>
      <Icon className={iconColor} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-foreground">{notice.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{notice.body}</p>
      </div>
    </div>
  );
}
