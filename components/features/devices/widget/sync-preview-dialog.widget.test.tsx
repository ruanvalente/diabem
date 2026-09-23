// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/lib/devices", () => ({
  deviceIntegrationService: {
    syncDevice: vi.fn(),
    confirmImport: vi.fn(),
  },
  toFriendlyMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Erro amigável"
  ),
}));

import { SyncPreviewDialog } from "./sync-preview-dialog.widget";
import { toast } from "@/components/ui/toast";
import { deviceIntegrationService } from "@/lib/devices";
import type { ConnectedDevice, SyncPreview } from "@/lib/devices";

const addToast = vi.mocked(toast.add);
const mockSyncDevice = vi.mocked(deviceIntegrationService.syncDevice);
const mockConfirmImport = vi.mocked(deviceIntegrationService.confirmImport);

const device: ConnectedDevice = {
  id: "dev-1",
  name: "Glicosímetro Bayer",
  type: "glucose",
  transport: "bluetooth",
  adapterId: "bluetooth",
  userId: "u1",
};

const preview: SyncPreview = {
  device,
  result: {
    deviceId: "dev-1",
    totalRecords: 5,
    newRecords: 3,
    duplicateCount: 1,
    errorCount: 1,
    message: "3 novos",
    measurements: [],
  },
};

describe("SyncPreviewDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncDevice.mockResolvedValue(preview);
    mockConfirmImport.mockResolvedValue(preview.result);
  });

  it("walks idle → preview with the sync result and import button", async () => {
    render(
      <SyncPreviewDialog
        open
        userId="u1"
        device={device}
        onOpenChange={vi.fn()}
      />
    );

    expect(
      screen.getByText("Conecte-se ao dispositivo para ler os registros.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));

    expect(await screen.findByText(/registro\(s\) estarão disponíveis/)).toBeInTheDocument();
    expect(mockSyncDevice).toHaveBeenCalledWith("u1", device);
    expect(
      screen.getByRole("button", { name: "Importar 3 registro(s)" })
    ).toBeInTheDocument();
  });

  it("imports the preview and notifies", async () => {
    const onSynced = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <SyncPreviewDialog
        open
        userId="u1"
        device={device}
        onOpenChange={onOpenChange}
        onSynced={onSynced}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));
    await screen.findByText(/registro\(s\) estarão disponíveis/);
    fireEvent.click(
      screen.getByRole("button", { name: "Importar 3 registro(s)" })
    );

    await waitFor(() =>
      expect(mockConfirmImport).toHaveBeenCalledWith("u1", preview)
    );
    expect(addToast).toHaveBeenCalledWith({
      title: "Sincronização concluída.",
      description: "3 novos",
      type: "success",
    });
    await waitFor(() => expect(onSynced).toHaveBeenCalledTimes(1));
  });

  it("shows an error message when the sync fails", async () => {
    mockSyncDevice.mockRejectedValueOnce(new Error("Falha de conexão"));

    render(
      <SyncPreviewDialog
        open
        userId="u1"
        device={device}
        onOpenChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));

    expect(await screen.findByText("Falha de conexão")).toBeInTheDocument();
  });

  it("reports when there is nothing new to import", async () => {
    mockSyncDevice.mockResolvedValueOnce({
      ...preview,
      result: { ...preview.result, newRecords: 0 },
    });

    render(
      <SyncPreviewDialog
        open
        userId="u1"
        device={device}
        onOpenChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar agora" }));

    expect(
      await screen.findByText(
        "Todos os registros já estão no seu dispositivo. Nada novo para importar."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Importar/ })
    ).not.toBeInTheDocument();
  });
});