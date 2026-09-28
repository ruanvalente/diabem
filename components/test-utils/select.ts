import { fireEvent, screen } from "@testing-library/react";

/**
 * Opens the base-ui select whose trigger carries `triggerName` and picks the
 * option labelled `label`.
 *
 * base-ui only commits a mouse selection when the option saw the `pointerdown`
 * that armed it, so a bare `click` on the option is ignored. A plain
 * `fireEvent.click` on the trigger is enough to open the portalled popup in
 * jsdom, which keeps these interaction tests off the slower e2e suite.
 */
export function pickSelectOption(triggerName: string, label: string) {
  fireEvent.click(screen.getByRole("combobox", { name: triggerName }));
  const option = screen.getByRole("option", { name: label });
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.click(option, { detail: 1 });
}
