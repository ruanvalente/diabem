import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const EMAIL = `e2e-act-${Date.now()}@test.dev`;

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E Activity");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

test("registers an activity and sees it in the list", async ({ page }) => {
  await signup(page);

  await goTo(page, "/activity");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Caminhada" }).click();
  await dialog.getByLabel("Duração").fill("45");
  await dialog.getByLabel("Observação (opcional)").fill("No parque");
  await dialog.getByRole("button", { name: "Salvar atividade" }).click();

  await expect(
    page.getByText("Atividade registrada com sucesso."),
  ).toBeVisible();
  const today = page.getByLabel("Hoje");
  await expect(today.getByText("Caminhada")).toBeVisible();
  await expect(today.getByText(/· 45 min · No parque/)).toBeVisible();
});

test("activity form validates duration", async ({ page }) => {
  await signup(page);

  await goTo(page, "/activity");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Corrida" }).click();
  await dialog.getByLabel("Duração").fill("0");
  await dialog.getByRole("button", { name: "Salvar atividade" }).click();

  await expect(
    dialog.getByText("Duração deve ser de ao menos 1 minuto"),
  ).toBeVisible();
  await expect(
    dialog.getByLabel("Duração"),
  ).toHaveAttribute("aria-describedby", "activity-duration-error");
});

test("registers an activity and then deletes it", async ({ page }) => {
  await signup(page);

  await goTo(page, "/activity");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Natação" }).click();
  await dialog.getByLabel("Duração").fill("30");
  await dialog.getByRole("button", { name: "Salvar atividade" }).click();

  await expect(
    page.getByText("Atividade registrada com sucesso."),
  ).toBeVisible();
  const today = page.getByLabel("Hoje");
  await expect(today.getByText("Natação")).toBeVisible();

  await page
    .getByRole("button", { name: "Excluir atividade" })
    .first()
    .click();
  const confirm = page.getByRole("alertdialog");
  await confirm.getByRole("button", { name: "Excluir", exact: true }).click();

  await expect(page.getByText("Atividade excluída.")).toBeVisible();
  await expect(page.getByLabel("Hoje").getByText("Natação")).toHaveCount(0);
});

test("edits an activity", async ({ page }) => {
  await signup(page);

  await goTo(page, "/activity");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Academia" }).click();
  await dialog.getByLabel("Duração").fill("45");
  await dialog.getByRole("button", { name: "Salvar atividade" }).click();

  const today = page.getByLabel("Hoje");
  await expect(today.getByText(/· 45 min/)).toBeVisible();

  await page.getByRole("button", { name: "Editar atividade" }).click();

  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Duração").fill("30");
  await editDialog.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(
    page.getByText("Atividade atualizada com sucesso."),
  ).toBeVisible();
  await expect(page.getByLabel("Hoje").getByText(/· 30 min/)).toBeVisible();
});

test("activities appear on the timeline", async ({ page }) => {
  await signup(page);

  await goTo(page, "/activity");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Ciclismo" }).click();
  await dialog.getByLabel("Duração").fill("50");
  await dialog.getByRole("button", { name: "Salvar atividade" }).click();
  await expect(
    page.getByText("Atividade registrada com sucesso."),
  ).toBeVisible();

  await goTo(page, "/timeline");
  await expect(
    page.getByRole("heading", { name: "Linha do tempo" }),
  ).toBeVisible();
  await expect(page.getByText("Ciclismo")).toBeVisible();
});
