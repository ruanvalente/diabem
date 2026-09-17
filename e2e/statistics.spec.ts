import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const EMAIL = `e2e-stats-meds-${Date.now()}@test.dev`;

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E Estatísticas");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerMedication(
  page: Page,
  name: string,
  route?: string,
) {
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill(name);
  if (route) {
    await dialog.getByLabel("Via de administração (opcional)").fill(route);
  }
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();
  await expect(
    page.getByText("Medicamento registrado com sucesso.").first(),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("statistics medications tab shows an empty state without records", async ({
  page,
}) => {
  await signup(page);

  await goTo(page, "/statistics");
  await page.getByRole("tab", { name: "Medicamentos" }).click();

  await expect(
    page.getByText("Nenhum medicamento registrado"),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Registre seus medicamentos para visualizar estatísticas de uso no período.",
    ),
  ).toBeVisible();
});

test("statistics medications tab shows metrics and filters by medication", async ({
  page,
}) => {
  await signup(page);

  await goTo(page, "/medications");
  await registerMedication(page, "Metformina", "oral");
  await registerMedication(page, "Ibuprofeno", "oral");
  await registerMedication(page, "Insulina", "injeção");

  await goTo(page, "/statistics");
  await page.getByRole("tab", { name: "Medicamentos" }).click();

  const tab = page.locator('[data-slot="tabs-content"]');

  // Summary metrics
  await expect(tab.getByText("Registros", { exact: true })).toBeVisible();
  await expect(tab.getByText("3", { exact: true }).first()).toBeVisible();
  await expect(tab.getByText("Medicamentos", { exact: true })).toBeVisible();
  await expect(tab.getByText("distintos", { exact: true })).toBeVisible();

  // Section headings
  await expect(
    tab.getByText("Distribuição por via de administração"),
  ).toBeVisible();
  await expect(tab.getByText("Medicamentos registrados")).toBeVisible();
  await expect(tab.getByText("Distribuição por horário")).toBeVisible();

  // Filter options include every medication
  await page
    .getByRole("combobox", { name: "Filtrar por medicamento" })
    .click();
  const options = page.locator('[data-slot="select-item"]');
  await expect(options).toHaveCount(4);
  await expect(options.filter({ hasText: "Todos" })).toBeVisible();
  await expect(options.filter({ hasText: "Metformina" })).toBeVisible();
  await expect(options.filter({ hasText: "Ibuprofeno" })).toBeVisible();
  await expect(options.filter({ hasText: "Insulina" })).toBeVisible();

  // Selecting one medication narrows every metric to it
  await options.filter({ hasText: "Insulina" }).click();
  await expect(tab.getByText("Ibuprofeno")).toHaveCount(0);
  await expect(tab.getByText("Metformina")).toHaveCount(0);
  await expect(tab.getByText("1", { exact: true }).first()).toBeVisible();
  await expect(tab.getByText("Insulina").first()).toBeVisible();

  // Returning to "Todos" restores the full set
  await page
    .getByRole("combobox", { name: "Filtrar por medicamento" })
    .click();
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: "Todos" })
    .click();
  await expect(tab.getByText("Ibuprofeno").first()).toBeVisible();
  await expect(tab.getByText("Metformina").first()).toBeVisible();
});