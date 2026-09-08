import { Bluetooth, Usb, FileUp, Nfc } from "lucide-react";
import type { DeviceCapabilities } from "@/lib/browser/capabilities";

type CapabilitySummaryProps = {
  capabilities: DeviceCapabilities;
};

/**
 * Summarizes which device connection capabilities the current browser supports.
 * Presentational only — it never inspects the browser globals itself.
 */
export function CapabilitySummary({
  capabilities,
}: CapabilitySummaryProps) {
  const rows = [
    {
      label: "Importação de arquivos",
      supported: capabilities.fileSystem.supported,
      icon: FileUp,
    },
    { label: "Bluetooth", supported: capabilities.bluetooth.supported, icon: Bluetooth },
    { label: "USB / Serial", supported: capabilities.serial.supported, icon: Usb },
    { label: "NFC", supported: capabilities.nfc.supported, icon: Nfc },
  ];

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-2 text-sm">
          <row.icon className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">{row.label}</span>
          <span
            aria-label={row.supported ? "Disponível" : "Indisponível"}
            className={row.supported ? "text-success" : "text-destructive"}
          >
            {row.supported ? "✓" : "✕"}
          </span>
        </li>
      ))}
    </ul>
  );
}
