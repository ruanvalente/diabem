import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const EMAIL = `e2e-med-${Date.now()}@test.dev`;

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E Meds");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

test("registers a medication and sees it in the list", async ({ page }) => {
  await signup(page);

  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill("Metformina");
  await dialog.getByLabel("Dosagem (opcional)").fill("500");
  await dialog.getByLabel("Unidade (opcional)").fill("mg");
  await dialog.getByLabel("Frequência (opcional)").fill("2x ao dia");
  await dialog.getByLabel("Via de administração (opcional)").fill("oral");
  await dialog.getByLabel("Observação (opcional)").fill("Tomar com café");
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();

  await expect(page.getByText("Medicamento registrado com sucesso.")).toBeVisible();
  await expect(page.getByText("Metformina")).toBeVisible();
  await expect(page.getByText(/· 500 mg · 2x ao dia · oral/)).toBeVisible();
  await expect(page.getByText("Tomar com café")).toBeVisible();
});

test("registers a medication with only required fields", async ({ page }) => {
  await signup(page);

  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill("Ibuprofeno");
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();

  await expect(page.getByText("Medicamento registrado com sucesso.")).toBeVisible();
  await expect(page.getByText("Ibuprofeno")).toBeVisible();
});

test("medication form shows voice input button", async ({ page }) => {
  await signup(page);

  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Observação (opcional)")).toBeVisible();
});

test("registers a medication and then deletes it", async ({ page }) => {
  await signup(page);

  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill("Amoxicilina");
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();

  await expect(page.getByText("Medicamento registrado com sucesso.")).toBeVisible();
  await expect(page.getByText("Amoxicilina")).toBeVisible();

  await page
    .getByRole("button", { name: "Excluir medicamento" })
    .first()
    .click();
  const confirm = page.getByRole("alertdialog");
  await confirm.getByRole("button", { name: "Excluir", exact: true }).click();

  await expect(page.getByText("Medicamento excluído.")).toBeVisible();
  await expect(page.getByText("Amoxicilina")).toHaveCount(0);
});

test("edits a medication and clears optional fields", async ({ page }) => {
  await signup(page);

  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill("Metformina");
  await dialog.getByLabel("Dosagem (opcional)").fill("500");
  await dialog.getByLabel("Unidade (opcional)").fill("mg");
  await dialog.getByLabel("Frequência (opcional)").fill("2x ao dia");
  await dialog.getByLabel("Via de administração (opcional)").fill("oral");
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();

  await expect(page.getByText(/· 500 mg · 2x ao dia · oral/)).toBeVisible();

  await page.getByRole("button", { name: "Editar medicamento" }).click();

  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Dosagem (opcional)").fill("");
  await editDialog.getByLabel("Unidade (opcional)").fill("");
  await editDialog.getByLabel("Frequência (opcional)").fill("");
  await editDialog.getByLabel("Via de administração (opcional)").fill("");
  await editDialog.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(
    page.getByText("Medicamento atualizado com sucesso."),
  ).toBeVisible();
  await expect(page.getByText("Metformina")).toBeVisible();
  await expect(page.getByText(/· 500 mg/)).toHaveCount(0);
});

test("medications appear on the timeline", async ({ page }) => {
  await signup(page);

  await goTo(page, "/medications");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Medicamento").fill("Metformina");
  await dialog.getByRole("button", { name: "Salvar medicamento" }).click();
  await expect(page.getByText("Medicamento registrado com sucesso.")).toBeVisible();

  await goTo(page, "/timeline");
  await expect(
    page.getByRole("heading", { name: "Linha do tempo" }),
  ).toBeVisible();
  await expect(page.getByText("Metformina")).toBeVisible();
});
