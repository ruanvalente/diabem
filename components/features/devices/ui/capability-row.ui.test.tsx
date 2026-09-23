// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { DeviceCapabilities } from "@/lib/browser/capabilities";
import { CapabilityRow } from "./capability-row.ui";

const noneSupported: DeviceCapabilities = {
  bluetooth: { supported: false },
  serial: { supported: false },
  nfc: { supported: false },
  fileSystem: { supported: false },
};

describe("CapabilityRow", () => {
  it("shows the generic message when nothing is supported", () => {
    render(<CapabilityRow capabilities={noneSupported} anySupported={false} />);

    expect(screen.getByText("Recursos do dispositivo")).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma conexão de dispositivo é suportada neste navegador.")
    ).toBeInTheDocument();
  });

  it("points to file import when only the file system is supported", () => {
    render(
      <CapabilityRow
        capabilities={{ ...noneSupported, fileSystem: { supported: true } }}
        anySupported={false}
      />
    );

    expect(
      screen.getByText("Importe seus dados por arquivo (CSV ou JSON).")
    ).toBeInTheDocument();
  });

  it("renders capability labels with their availability", () => {
    render(<CapabilityRow capabilities={noneSupported} anySupported={false} />);

    for (const label of ["Bluetooth", "USB / Serial", "NFC", "Importação de arquivos"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("omits the helper text when a device connection is supported", () => {
    render(
      <CapabilityRow
        capabilities={{ ...noneSupported, bluetooth: { supported: true } }}
        anySupported={true}
      />
    );

    expect(
      screen.queryByText("Nenhuma conexão de dispositivo é suportada neste navegador.")
    ).not.toBeInTheDocument();
  });
});