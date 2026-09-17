import { expect, test, type Page } from "@playwright/test";

const EMAIL = `e2e-dashboard-${Date.now()}@test.dev`;

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E Dashboard");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

const LABELS = ["Glicemia", "Refeição", "Atividade", "Observação", "Medicamento"];

test("dashboard shows all five quick actions", async ({ page }) => {
  await signup(page);

  const rail = page.locator("div.snap-x");
  await expect(rail).toHaveCount(1);

  for (const label of LABELS) {
    await expect(rail.getByRole("link", { name: label })).toBeVisible();
  }
});

test("quick actions adapt to the viewport", async ({ page }) => {
  await signup(page);

  const rail = page.locator("div.snap-x");
  const width = page.viewportSize()?.width ?? 0;

  if (width < 640) {
    // Mobile: horizontal scroll-snap rail; every action stays reachable,
    // and the rail signals scrollability by partially showing the next card.
    const scrollable = await rail.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(scrollable).toBe(true);

    const last = rail.getByRole("link", { name: "Medicamento" });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
  } else {
    // Desktop: a single row with five equal columns and no overflow.
    const columns = await rail.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(5);

    const overflows = await rail.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(overflows).toBe(false);
  }
});