import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const EMAIL = `e2e-reports-${Date.now()}@test.dev`;

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

async function seedGlucose(page: Page, value: string) {
  await goTo(page, "/glucose");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Valor da medição").fill(value);
  await dialog.getByRole("button", { name: "Jejum" }).click();
  await dialog.getByRole("button", { name: "Salvar registro" }).click();
  await expect(page.getByText("Glicemia registrada com sucesso.")).toBeVisible();
}

async function seedMedication(page: Page) {
  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill("Metformina");
  await dialog.getByLabel("Dosagem (opcional)").fill("500");
  await dialog.getByLabel("Unidade (opcional)").fill("mg");
  await dialog.getByLabel("Frequência (opcional)").fill("2x ao dia");
  await dialog.getByLabel("Via de administração (opcional)").fill("oral");
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();
  await expect(page.getByText("Medicamento registrado com sucesso.")).toBeVisible();
}

test("generates a report from seeded data and shows the summary", async ({
  page,
}) => {
  await signup(page);
  await seedGlucose(page, "128");

  await goTo(page, "/reports");
  await expect(
    page.getByRole("heading", { name: "Relatórios" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Gerar relatório" }).click();
  await expect(page.getByRole("button", { name: "PDF", exact: true })).toBeVisible();

  await expect(page.getByText("Relatório — Últimos 7 dias")).toBeVisible();
  await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("128 mg/dL", { exact: true }).first()).toBeVisible();
});

test("exports the report as CSV and PDF via download", async ({ page }) => {
  await signup(page);
  await seedGlucose(page, "128");

  await goTo(page, "/reports");
  await page.getByRole("button", { name: "Gerar relatório" }).click();
  await expect(page.getByRole("button", { name: "PDF", exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);

  const pdfPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF", exact: true }).click();
  const pdf = await pdfPromise;
  expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
});

test("filters categories before generating", async ({ page }) => {
  await signup(page);
  await seedGlucose(page, "128");

  await goTo(page, "/reports");
  const mealsCheckbox = page.getByRole("checkbox", { name: "Refeições" });
  await mealsCheckbox.uncheck();

  await page.getByRole("button", { name: "Gerar relatório" }).click();
  await expect(page.getByRole("button", { name: "PDF", exact: true })).toBeVisible();
});

test("includes medications in the generated report", async ({ page }) => {
  await signup(page);
  await seedMedication(page);

  await goTo(page, "/reports");
  await expect(
    page.getByRole("checkbox", { name: "Medicamentos" }),
  ).toBeChecked();

  await page.getByRole("button", { name: "Gerar relatório" }).click();
  await expect(page.getByRole("button", { name: "PDF", exact: true })).toBeVisible();

  const reportPreview = page.locator('div[data-slot="card"]', {
    hasText: "Relatório",
  });
  await expect(reportPreview.getByText("Medicamentos")).toBeVisible();
  await expect(reportPreview.getByText("1", { exact: true })).toBeVisible();
  await expect(page.getByText(/Metformina · 500 mg · 2x ao dia · oral/)).toBeVisible();
});
