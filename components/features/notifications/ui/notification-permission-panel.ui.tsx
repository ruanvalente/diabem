import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PermissionState } from "@/lib/browser/hooks/use-notifications";
import { BellOff, CheckCircle2 } from "lucide-react";

const DEFAULT_PERMISSION_MESSAGE =
  "Receba lembretes definidos por você quando você abrir o aplicativo.";

const PERMISSION_MESSAGES: Partial<Record<PermissionState, string>> = {
  default: DEFAULT_PERMISSION_MESSAGE,
  granted: "Você receberá lembretes definidos por você neste dispositivo.",
  denied: "As notificações foram bloqueadas pelo navegador.",
  unsupported: "Seu navegador não suporta notificações neste ambiente.",
};

type BlockedCopy = {
  title: string;
  body: string;
};

/**
 * The keys are exactly the states the browser cannot recover on its own, so the
 * map itself is the rule: a state without an entry is not blocked and the panel
 * offers the action that resolves it.
 */
const BLOCKED_COPY: Partial<Record<PermissionState, BlockedCopy>> = {
  denied: {
    title: "Notificações bloqueadas",
    body: "Altere as permissões do site nas configurações do navegador para ativá-las.",
  },
  unsupported: {
    title: "Notificações indisponíveis",
    body: "Você não pode ativar notificações neste ambiente.",
  },
};

type NotificationPermissionPanelProps = {
  state: PermissionState;
  isBlocked: boolean;
  onRequest: () => void;
};

/** The blocked notice only exists while the browser cannot recover on its own. */
function blockedCopy(
  state: PermissionState,
  isBlocked: boolean,
): BlockedCopy | null {
  if (!isBlocked) return null;
  return BLOCKED_COPY[state === "denied" ? "denied" : "unsupported"] ?? null;
}

/**
 * Explains the current permission state and, when the browser still allows a
 * decision, offers the action that resolves it. The blocked copy deliberately
 * does not repeat itself: the capability notice owns the platform limitations.
 */
export function NotificationPermissionPanel({
  state,
  isBlocked,
  onRequest,
}: NotificationPermissionPanelProps) {
  const blocked = blockedCopy(state, isBlocked);

  return (
    <>
      <div className="px-5 py-4">
        <p className="text-sm text-muted-foreground">
          {PERMISSION_MESSAGES[state] ?? DEFAULT_PERMISSION_MESSAGE}
        </p>
      </div>

      <Separator />

      <div className="px-5 py-4">
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
        ) : blocked ? (
          <div className="flex items-start gap-2">
            <BellOff
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {blocked.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {blocked.body}
              </p>
            </div>
          </div>
        ) : (
          <Button onClick={onRequest} className="h-12 w-full text-base">
            Ativar notificações
          </Button>
        )}
      </div>
    </>
  );
}
