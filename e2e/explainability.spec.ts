import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const EMAIL = `e2e-dq-${Date.now()}@test.dev`;

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
  await goTo(page, "/glucose");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Valor da medição").fill(value);
  await dialog.getByRole("button", { name: "Jejum" }).click();
  await dialog.getByRole("button", { name: "Salvar registro" }).click();
  await expect(
    page.getByText("Glicemia registrada com sucesso."),
  ).toBeVisible();
}

test("dashboard explains why an insight was generated", async ({ page }) => {
  await signup(page);
  await registerGlucose(page, "128");

  await goTo(page, "/dashboard");

  await expect(page.getByText("Qualidade dos dados")).toBeVisible();
  await expect(page.getByText("Padrões observados")).toBeVisible();
  await expect(page.getByText("Dados insuficientes")).toBeVisible();

  await page
    .getByRole("button", { name: /por que estou vendo isso/i })
    .click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Como este insight foi gerado"),
  ).toBeVisible();
  await expect(dialog.getByText("insufficient-data v1.0.0")).toBeVisible();
  await expect(dialog.getByText("Registros considerados")).toBeVisible();
  await expect(dialog.getByText("Período analisado")).toBeVisible();
  await expect(dialog.getByText("Gerado em")).toBeVisible();

  await expect(
    dialog.getByText(/mínimo de 10 para identificar padrões/i),
  ).toBeVisible();
});