// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { NotificationCapabilityNotice } from "./notification-capability-notice.ui";
import type { NotificationCapability } from "@/lib/browser/capabilities/notifications";

function capability(
  overrides: Partial<NotificationCapability> = {},
): NotificationCapability {
  return {
    supported: true,
    secureContext: true,
    serviceWorker: true,
    scheduling: { reliableBackgroundDelivery: false },
    ...overrides,
  };
}

describe("NotificationCapabilityNotice", () => {
  it("stays silent when the platform delivers reliably in the background", () => {
    // No browser supports this today, so the branch is unreachable in
    // production. It is still covered so the notice cannot be hardcoded.
    const { container } = render(
      <NotificationCapabilityNotice
        capability={capability({
          scheduling: { reliableBackgroundDelivery: true },
        })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("warns when notifications are not supported at all", () => {
    render(
      <NotificationCapabilityNotice
        capability={capability({ supported: false, secureContext: false, serviceWorker: false })}
      />,
    );

    expect(screen.getByText("Notificações não suportadas")).toBeInTheDocument();
    expect(
      screen.getByText(/não oferece suporte a notificações neste ambiente/i),
    ).toBeInTheDocument();
  });

  it("does not restate the permission state owned by the settings card", () => {
    render(<NotificationCapabilityNotice capability={capability()} />);

    // The card renders the blocked state together with its action, so repeating
    // it here would show two different notices for the same condition.
    expect(screen.queryByText("Notificações bloqueadas")).not.toBeInTheDocument();
  });

  it("discloses that reminders only fire while the app is open", () => {
    render(<NotificationCapabilityNotice capability={capability()} />);

    expect(screen.getByText("Lembretes dependem do app aberto")).toBeInTheDocument();
    expect(screen.getByText(/horários ficam salvos neste dispositivo/i)).toBeInTheDocument();
  });
});
