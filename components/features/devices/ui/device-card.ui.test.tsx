// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { ConnectedDevice } from "@/lib/devices";
import { DeviceCard } from "./device-card.ui";

const baseDevice: ConnectedDevice = {
  id: "dev-1",
  name: "Glicosímetro Bayer",
  type: "glucose",
  transport: "bluetooth",
  adapterId: "bluetooth",
  manufacturer: "Bayer",
  model: "Contour XT",
  userId: "u1",
};

function transportLabel(label: string) {
  return screen.getByText(
    (_, element) =>
      element?.tagName === "P" &&
      (element?.textContent ?? "").startsWith(label)
  );
}

describe("DeviceCard", () => {
  it("renders name, transport label and fallback sync time", () => {
    render(
      <DeviceCard
        device={baseDevice}
        onSync={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Glicosímetro Bayer")).toBeInTheDocument();
    expect(transportLabel("Bluetooth")).toBeInTheDocument();
    expect(screen.getByText(/Contour XT/)).toBeInTheDocument();
    expect(
      screen.getByText("Última sincronização:", { exact: false })
    ).toHaveTextContent("Nunca");
  });

  it("formats the last sync time when available", () => {
    render(
      <DeviceCard
        device={{ ...baseDevice, lastSyncAt: "2026-09-23T14:05:00.000Z" }}
        onSync={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText("Última sincronização:", { exact: false })).toHaveTextContent(
      /\d{2}\/\d{2} às \d{1,2}:\d{2}/
    );
  });

  it("shows the serial label for serial transports", () => {
    render(
      <DeviceCard
        device={{ ...baseDevice, transport: "serial" }}
        onSync={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(transportLabel("USB / Serial")).toBeInTheDocument();
  });

  it("fires sync and remove callbacks", () => {
    const onSync = vi.fn();
    const onRemove = vi.fn();

    render(
      <DeviceCard device={baseDevice} onSync={onSync} onRemove={onRemove} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sincronizar" }));
    fireEvent.click(screen.getByRole("button", { name: "Remover Glicosímetro Bayer" }));

    expect(onSync).toHaveBeenCalledWith(baseDevice);
    expect(onRemove).toHaveBeenCalledWith(baseDevice);
  });
});