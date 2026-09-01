import { expect, test, type Page } from "@playwright/test";

const ROUTES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/timeline": "Timeline",
  "/glucose": "Glicemia",
  "/meals": "Refeições",
  "/activity": "Atividade",
  "/notes": "Observações",
  "/statistics": "Estatísticas",
  "/reports": "Relatórios",
  "/settings": "Configurações",
};

/**
 * In-app (client-side) navigation keeps the in-memory session key alive, so we
 * navigate via links instead of `page.goto`/`reload` between authenticated
 * routes. Reloads are intentionally out of scope: the key is memory-only, so a
 * fresh document requires re-login by design (APPLICATION-ARCHITETURE.md
 * §35.2).
 *
 * The desktop sidebar is hidden on mobile, where a hamburger opens the same
 * nav in a sheet. To stay robust across both viewports, any sidebar-reachable
 * route is opened via that hamburger when visible.
 */
export async function goTo(page: Page, href: string) {
  const burger = page.getByRole("button", { name: "Abrir menu de navegação" });

  if (await burger.isVisible()) {
    await burger.click();
    await page
      .locator('[data-slot="sheet-content"]')
      .getByRole("link", { name: new RegExp(ROUTES[href]) })
      .click();
    await page.waitForURL(`**${href}`);
    await page.keyboard.press("Escape");
    await page.locator('[data-slot="sheet-content"]').waitFor({ state: "hidden" });
  } else {
    await page.locator(`aside nav a[href="${href}"]`).click();
    await page.waitForURL(`**${href}`);
  }
}

export { expect, test };
export type { Page };
