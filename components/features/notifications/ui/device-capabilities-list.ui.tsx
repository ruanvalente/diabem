import type { BrowserCapabilities } from "@/lib/browser/capabilities";
import { Bell, Camera as CameraIcon, Mic } from "lucide-react";

type DeviceCapabilitiesListProps = {
  capabilities: Pick<
    BrowserCapabilities,
    "notifications" | "speechRecognition" | "camera"
  >;
};

/**
 * Lists the browser APIs this feature depends on and whether the current
 * environment supports them. The status is carried by text as well as color, so
 * it stays readable without relying on hue.
 */
export function DeviceCapabilitiesList({
  capabilities,
}: DeviceCapabilitiesListProps) {
  const items = [
    {
      label: "Notificações",
      supported: capabilities.notifications.supported,
      icon: Bell,
    },
    {
      label: "Reconhecimento de voz",
      supported: capabilities.speechRecognition.supported,
      icon: Mic,
    },
    {
      label: "Câmera",
      supported: capabilities.camera.supported,
      icon: CameraIcon,
    },
  ];

  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium text-foreground">
        Recursos do dispositivo
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            <item.icon
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{item.label}</span>
            <span
              aria-label={item.supported ? "Disponível" : "Indisponível"}
              className={item.supported ? "text-success" : "text-destructive"}
            >
              {item.supported ? "✓" : "✕"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
