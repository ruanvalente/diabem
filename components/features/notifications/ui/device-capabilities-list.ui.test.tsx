// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DeviceCapabilitiesList } from "./device-capabilities-list.ui";

type CapabilitiesProps = Parameters<typeof DeviceCapabilitiesList>[0]["capabilities"];

const allSupported: CapabilitiesProps = {
  notifications: {
    supported: true,
    secureContext: true,
    serviceWorker: true,
    scheduling: { reliableBackgroundDelivery: false },
  },
  speechRecognition: { supported: true, secureContext: true },
  camera: { supported: true, secureContext: true },
};

type Overrides = { [K in keyof CapabilitiesProps]?: { supported: boolean } };

function renderList(overrides: Overrides = {}) {
  const capabilities: CapabilitiesProps = {
    notifications: { ...allSupported.notifications, ...overrides.notifications },
    speechRecognition: { ...allSupported.speechRecognition, ...overrides.speechRecognition },
    camera: { ...allSupported.camera, ...overrides.camera },
  };

  return render(<DeviceCapabilitiesList capabilities={capabilities} />);
}

function itemFor(label: string): HTMLElement {
  const item = screen.getAllByRole("listitem").find((entry) => entry.textContent?.includes(label));
  if (!item) throw new Error(`Item não encontrado: ${label}`);
  return item;
}

describe("DeviceCapabilitiesList", () => {
  it("names the three browser APIs this feature depends on", () => {
    renderList();

    expect(screen.getByText("Notificações")).toBeInTheDocument();
    expect(screen.getByText("Reconhecimento de voz")).toBeInTheDocument();
    expect(screen.getByText("Câmera")).toBeInTheDocument();
  });

  it("reports every API as available", () => {
    renderList();

    expect(screen.getAllByLabelText("Disponível")).toHaveLength(3);
    expect(screen.queryByLabelText("Indisponível")).not.toBeInTheDocument();
  });

  it("marks only the unsupported API", () => {
    renderList({ camera: { supported: false } });

    expect(within(itemFor("Câmera")).getByLabelText("Indisponível")).toBeInTheDocument();
    expect(itemFor("Câmera")).toHaveTextContent("✕");
    expect(within(itemFor("Notificações")).getByLabelText("Disponível")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Disponível")).toHaveLength(2);
  });

  it("carries the unavailable state with an accessible name, not only color", () => {
    renderList({ notifications: { supported: false } });

    expect(itemFor("Notificações")).toHaveTextContent("✕");
    expect(within(itemFor("Notificações")).getByLabelText("Indisponível")).toBeInTheDocument();
  });

  it("reports every API as unavailable", () => {
    renderList({
      notifications: { supported: false },
      speechRecognition: { supported: false },
      camera: { supported: false },
    });

    expect(screen.getAllByLabelText("Indisponível")).toHaveLength(3);
    expect(screen.queryByLabelText("Disponível")).not.toBeInTheDocument();
  });
});