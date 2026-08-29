import { expect, test, type Page } from "@playwright/test";

const EMAIL = `e2e-${Date.now()}@test.dev`;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local `yyyy-MM-dd` for a date offset in days from today. */
function localDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

async function registerGlucose(page: Page, value: string) {
  await page.goto("/glucose");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Valor da medição").fill(value);
  await dialog.getByRole("button", { name: "Jejum" }).click();
  await dialog.getByRole("button", { name: "Salvar registro" }).click();
  await expect(
    page.getByText("Glicemia registrada com sucesso."),
  ).toBeVisible();
}

async function registerNote(page: Page, content: string) {
  await page.goto("/notes");
  await page
    .getByRole("textbox", { name: "Nova observação" })
    .fill(content);
  await page.getByRole("button", { name: "Salvar observação" }).click();
  await expect(page.getByText(content)).toBeVisible();
}

test("dashboard shows today's reading, charts and recent records", async ({
  page,
}) => {
  await signup(page);
  await registerGlucose(page, "128");

  await page.goto("/dashboard");

  await expect(page.getByText("Última medição")).toBeVisible();
  await expect(page.getByText("128 mg/dL", { exact: true })).toBeVisible();
  await expect(page.getByText("Resumo do período")).toBeVisible();
  await expect(page.getByText("Glicemias")).toBeVisible();
  await expect(page.getByText("1 registro hoje")).toBeVisible();

  await expect(page.getByText("Como está seu acompanhamento")).toBeVisible();
  await expect(page.getByText("Tendência da glicemia")).toBeVisible();
  await expect(
    page.getByText(/1 medição · média 128 mg\/dL/i),
  ).toBeVisible();

  await expect(page.getByText("Registrados recentemente")).toBeVisible();
  await expect(page.getByText("128 mg/dL · Jejum")).toBeVisible();
});

test("custom period opens, validates and applies", async ({ page }) => {
  await signup(page);
  await registerGlucose(page, "128");

  await page.goto("/dashboard");
  await page.locator('[data-slot="select-trigger"]').click();
  await page.getByRole("option", { name: "Personalizado" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Período personalizado" })).toBeVisible();

  await dialog.getByLabel("De").fill(localDate());
  await dialog.getByLabel("Até").fill(localDate(-7));

  await expect(
    dialog.getByText("A data final deve ser igual ou posterior à inicial."),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Aplicar" })).toBeDisabled();

  await dialog.getByLabel("Até").fill(localDate());
  await expect(dialog.getByRole("button", { name: "Aplicar" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Aplicar" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Acompanhamento de \d{2}\/\d{2}\/\d{2} a \d{2}\/\d{2}\/\d{2}\./)).toBeVisible();
  await expect(page.getByText("128 mg/dL", { exact: true })).toBeVisible();
});

test("timeline narrows by event type with multi-select pills", async ({
  page,
}) => {
  await signup(page);
  await registerGlucose(page, "95");
  await registerNote(page, "Senti-me bem hoje");

  await page.goto("/timeline");

  await expect(page.getByText("95 mg/dL")).toBeVisible();
  await expect(page.getByText("Senti-me bem hoje")).toBeVisible();

  const notesPill = page.getByRole("button", { name: "Observação", exact: true });
  await notesPill.click();

  await expect(page.getByText("95 mg/dL")).toHaveCount(0);
  await expect(page.getByText("Senti-me bem hoje")).toBeVisible();

  await notesPill.click();

  await expect(page.getByText("95 mg/dL")).toBeVisible();
  await expect(page.getByText("Senti-me bem hoje")).toBeVisible();
});