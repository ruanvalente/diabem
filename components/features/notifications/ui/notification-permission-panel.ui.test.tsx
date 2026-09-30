// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NotificationPermissionPanel } from "./notification-permission-panel.ui";
import type { PermissionState } from "@/lib/browser/hooks/use-notifications";

function renderPanel(state: PermissionState, onRequest = vi.fn()) {
  render(<NotificationPermissionPanel state={state} onRequest={onRequest} />);
  return { onRequest };
}

const activateButton = { name: "Ativar notificações" };

describe("NotificationPermissionPanel", () => {
  it("explains the initial state and offers the action that resolves it", () => {
    const { onRequest } = renderPanel("default");

    expect(
      screen.getByText(/Receba lembretes definidos por você quando você abrir/),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", activateButton);
    button.click();

    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  it("confirms the permission without offering another action once granted", () => {
    renderPanel("granted");

    expect(screen.getByRole("status")).toHaveTextContent("Notificações ativadas");
    expect(screen.queryByRole("button", activateButton)).not.toBeInTheDocument();
  });

  it("waits for the browser instead of asking again while requesting", () => {
    renderPanel("requesting");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Aguardando permissão do navegador",
    );
    expect(screen.queryByRole("button", activateButton)).not.toBeInTheDocument();
  });

  it("shows the blocked copy for a denied permission, derived from the state alone", () => {
    renderPanel("denied");

    expect(screen.getByText("Notificações bloqueadas")).toBeInTheDocument();
    expect(screen.getByText(/Altere as permissões do site nas configurações/)).toBeInTheDocument();
    expect(screen.queryByRole("button", activateButton)).not.toBeInTheDocument();
  });

  it("shows the blocked copy for an unsupported browser", () => {
    renderPanel("unsupported");

    expect(screen.getByText("Notificações indisponíveis")).toBeInTheDocument();
    expect(
      screen.getByText("Você não pode ativar notificações neste ambiente."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", activateButton)).not.toBeInTheDocument();
  });

  it.each(["default", "granted", "requesting"] as const)(
    "never claims the permission is blocked while the state is %s",
    (state) => {
      renderPanel(state);

      expect(screen.queryByText("Notificações bloqueadas")).not.toBeInTheDocument();
      expect(screen.queryByText("Notificações indisponíveis")).not.toBeInTheDocument();
    },
  );
});