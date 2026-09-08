import { Bluetooth, Usb, Smartphone } from "lucide-react";
import type { ConnectedDevice } from "@/lib/devices";

type DeviceCardProps = {
  device: ConnectedDevice;
  onSync: (device: ConnectedDevice) => void;
  onRemove: (device: ConnectedDevice) => void;
};

const TRANSPORT_ICON = {
  bluetooth: Bluetooth,
  serial: Usb,
} as const;

const TRANSPORT_LABEL = {
  bluetooth: "Bluetooth",
  serial: "USB / Serial",
} as const;

/**
 * A single registered device row: name, transport badge, last sync time and
 * the sync/remove actions. Rendered inside the settings Card, so it stays a
 * lightweight row rather than its own card.
 */
export function DeviceCard({
  device,
  onSync,
  onRemove,
}: DeviceCardProps) {
  const Icon = isBluetooth(device) ? TRANSPORT_ICON.bluetooth : TRANSPORT_ICON.serial;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {device.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {TRANSPORT_LABEL[device.transport]}
            {device.model ? ` · ${device.model}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Última sincronização:{" "}
            <span className="font-medium text-foreground">
              {device.lastSyncAt ? formatDateTime(device.lastSyncAt) : "Nunca"}
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => onSync(device)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Smartphone className="size-4" aria-hidden="true" />
          Sincronizar
        </button>
        <button
          type="button"
          onClick={() => onRemove(device)}
          aria-label={`Remover ${device.name}`}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Remover
        </button>
      </div>
    </div>
  );
}

function isBluetooth(device: ConnectedDevice): boolean {
  return device.transport === "bluetooth";
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return (
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " às " +
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}
