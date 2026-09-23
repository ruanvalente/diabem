import type { DeviceCapabilities } from "@/lib/browser/capabilities";
import { CapabilitySummary } from "./capability-summary.ui";

type CapabilityRowProps = {
  capabilities: DeviceCapabilities;
  anySupported: boolean;
};

/**
 * Section heading for the browser device capabilities followed by the summary
 * list and a contextual helper text when no device connection API is supported.
 */
export function CapabilityRow({
  capabilities,
  anySupported,
}: CapabilityRowProps) {
  return (
    <div className="border-t border-border px-5 py-4">
      <p className="text-sm font-medium text-foreground">
        Recursos do dispositivo
      </p>
      <div className="mt-2">
        <CapabilitySummary capabilities={capabilities} />
      </div>
      {!anySupported && (
        <p className="mt-2 text-sm text-muted-foreground">
          {capabilities.fileSystem.supported
            ? "Importe seus dados por arquivo (CSV ou JSON)."
            : "Nenhuma conexão de dispositivo é suportada neste navegador."}
        </p>
      )}
    </div>
  );
}