import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const EMAIL = `e2e-${Date.now()}@test.dev`;

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill("Senha-Forte-123");
  await page.getByLabel("Confirmar senha").fill("Senha-Forte-123");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
}

test("registers a glucose reading and sees it in the list", async ({ page }) => {
  await signup(page);

  await goTo(page, "/glucose");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Valor da medição").fill("128");
  await dialog
    .getByRole("button", { name: /após a refeição/i, exact: false })
    .click();
  await dialog.getByRole("button", { name: "Salvar registro" }).click();

  await expect(page.getByText("Glicemia registrada com sucesso.")).toBeVisible();
  await expect(page.getByText("128")).toBeVisible();
  await expect(page.getByText(/· Após a refeição/)).toBeVisible();
});

test("glucose form shows voice input button", async ({ page }) => {
  await signup(page);

  await goTo(page, "/glucose");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Observação (opcional)")).toBeVisible();
});

test("registers a meal and then deletes it", async ({ page }) => {
  await signup(page);

  await goTo(page, "/meals");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Lanche" }).click();
  await dialog.getByLabel("Descrição").fill("Torrada com queijo");
  await dialog.getByRole("button", { name: "Salvar refeição" }).click();

  await expect(page.getByText("Refeição registrada com sucesso.")).toBeVisible();
  await expect(page.getByText("Torrada com queijo")).toBeVisible();

  await page
    .getByRole("button", { name: "Excluir refeição" })
    .first()
    .click();
  const confirm = page.getByRole("alertdialog");
  await confirm.getByRole("button", { name: "Excluir", exact: true }).click();

  await expect(page.getByText("Refeição excluída.")).toBeVisible();
  await expect(page.getByText("Torrada com queijo")).toHaveCount(0);
});

test("all entities appear on the timeline", async ({ page }) => {
  await signup(page);

  await goTo(page, "/glucose");
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const glucoseDialog = page.getByRole("dialog");
  await glucoseDialog.getByLabel("Valor da medição").fill("95");
  await glucoseDialog.getByRole("button", { name: "Jejum" }).click();
  await glucoseDialog.getByRole("button", { name: "Salvar registro" }).click();
  await expect(
    page.getByText("Glicemia registrada com sucesso.")
  ).toBeVisible();

  await goTo(page, "/notes");
  await page
    .getByRole("textbox", { name: "Nova observação" })
    .fill("Senti-me bem hoje");
  await page.getByRole("button", { name: "Salvar observação" }).click();
  await expect(page.getByText("Senti-me bem hoje")).toBeVisible();

  await goTo(page, "/timeline");
  await expect(
    page.getByRole("heading", { name: "Linha do tempo" }),
  ).toBeVisible();
  await expect(page.getByText("95 mg/dL")).toBeVisible();
  await expect(page.getByText("Senti-me bem hoje")).toBeVisible();
});