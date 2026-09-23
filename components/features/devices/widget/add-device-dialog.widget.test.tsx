// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("@/lib/devices", () => ({
  deviceIntegrationService: {
    getSupportedAdapters: vi.fn(),
    discoverByAdapter: vi.fn(),
    registerDevice: vi.fn(),
  },
  toFriendlyMessage: vi.fn((error: unknown) =>
    error instanceof Error ? error.message : "Erro amigável"
  ),
}));

import { AddDeviceDialog } from "./add-device-dialog.widget";
import { toast } from "@/components/ui/toast";
import { deviceIntegrationService } from "@/lib/devices";
import type { Device, DeviceAdapter } from "@/lib/devices";

const addToast = vi.mocked(toast.add);
const mockGetSupportedAdapters = vi.mocked(
  deviceIntegrationService.getSupportedAdapters
);
const mockDiscoverByAdapter = vi.mocked(
  deviceIntegrationService.discoverByAdapter
);
const mockRegisterDevice = vi.mocked(deviceIntegrationService.registerDevice);

const adapter: DeviceAdapter = {
  id: "bluetooth",
  name: "Bluetooth",
  isSupported: () => true,
  discover: async () => [],
  connect: async () => {},
  disconnect: async () => {},
  read: async () => ({ format: "text/plain", data: "" }),
  parse: () => ({ measurements: [], droppedCount: 0 }),
  sync: async () => ({ measurements: [], droppedCount: 0 }),
};

const device: Device = {
  id: "dev-1",
  name: "Glicosímetro Bayer",
  type: "glucose",
  transport: "bluetooth",
  adapterId: "bluetooth",
  manufacturer: "Bayer",
  model: "Contour XT",
};

describe("AddDeviceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSupportedAdapters.mockReturnValue([adapter]);
    mockDiscoverByAdapter.mockResolvedValue([device]);
    mockRegisterDevice.mockResolvedValue(undefined);
  });

  it("explains when no connection type is supported", () => {
    mockGetSupportedAdapters.mockReturnValue([]);

    render(<AddDeviceDialog open userId="u1" onOpenChange={vi.fn()} />);

    expect(
      screen.getByText("Nenhum tipo de conexão é suportado neste navegador.")
    ).toBeInTheDocument();
  });

  it("walks select → discovering → discovered and registers the device", async () => {
    const onAdded = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <AddDeviceDialog
        open
        userId="u1"
        onOpenChange={onOpenChange}
        onAdded={onAdded}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Bluetooth/ }));

    expect(
      await screen.findByText("Glicosímetro Bayer")
    ).toBeInTheDocument();
    expect(mockDiscoverByAdapter).toHaveBeenCalledWith("bluetooth");

    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(mockRegisterDevice).toHaveBeenCalledWith("u1", device));
    expect(addToast).toHaveBeenCalledWith({
      title: "Dispositivo adicionado.",
      type: "success",
    });
    expect(onAdded).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("offers a retry when no device is found", async () => {
    mockDiscoverByAdapter.mockResolvedValueOnce([]);

    render(<AddDeviceDialog open userId="u1" onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Bluetooth/ }));

    expect(
      await screen.findByText(
        "Nenhum dispositivo encontrado. Verifique se ele está ligado e próximo."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" })
    ).toBeInTheDocument();
  });

  it("shows a friendly message when discovery fails", async () => {
    mockDiscoverByAdapter.mockRejectedValueOnce(new Error("Erro bruto"));

    render(<AddDeviceDialog open userId="u1" onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Bluetooth/ }));

    expect(await screen.findByText("Erro bruto")).toBeInTheDocument();
  });

  it("notifies with an error toast when registration fails", async () => {
    mockRegisterDevice.mockRejectedValueOnce(new Error("Falha ao registrar"));

    render(<AddDeviceDialog open userId="u1" onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Bluetooth/ }));
    await screen.findByText("Glicosímetro Bayer");
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() =>
      expect(addToast).toHaveBeenCalledWith({
        title: "Falha ao registrar",
        type: "error",
      })
    );
  });
});