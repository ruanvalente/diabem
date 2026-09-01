import { expect, test, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

/**
 * Offline experience: the app is local-first (IndexedDB + WebCrypto in
 * memory), so once a screen is loaded the user can keep using it without a
 * network. Scope note: client-side (RSC) navigation across routes and document
 * reloads are NOT part of the offline contract — a reload re-derives the
 * encryption key on next login by design.
 */

const EMAIL = `e2e-offline-${Date.now()}-${Math.random()
  .toString(36)
  .slice(2)}@test.dev`;
const PASSWORD = "Senha-Forte-123";

/** The glucose list renders the value and unit as adjacent text nodes. */
const glucoseValue = (page: Page, value: string) =>
  page.getByText(new RegExp(`${value}\\s?mg/dL`));

/** The row card (`.border-border`) containing a given glucose value. */
const glucoseRow = (page: Page, value: string) =>
  glucoseValue(page, value).locator(
    "xpath = ancestor::div[contains(@class,'border-border')]",
  );

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário Offline");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Última medição")).toBeVisible();
}

async function addGlucose(page: Page, value: string, context: string) {
  await page.getByRole("button", { name: "Registrar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Valor da medição").fill(value);
  await dialog.getByRole("button", { name: context, exact: true }).click();
  await dialog.getByRole("button", { name: "Salvar registro" }).click();
  await expect(
    page.getByText("Glicemia registrada com sucesso.").first(),
  ).toBeVisible();
  await expect(dialog).toBeHidden();
}

test("registros podem ser lidos, criados, editados e excluídos offline", async ({
  page,
}) => {
  await signup(page);
  await goTo(page, "/glucose");

  // Seed one reading while online.
  await addGlucose(page, "128", "Jejum");
  await expect(glucoseValue(page, "128")).toBeVisible();

  // --- Offline ---
  await page.context().setOffline(true);
  await expect(
    page.getByText("Você está offline. Seus dados continuam disponíveis."),
  ).toBeVisible();

  // Read: previously persisted data stays available.
  await expect(glucoseValue(page, "128")).toBeVisible();

  // Create offline.
  await addGlucose(page, "95", "Jejum");
  await expect(glucoseValue(page, "95")).toBeVisible();

  // Edit offline.
  await glucoseRow(page, "95")
    .getByRole("button", { name: "Editar registro" })
    .click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Valor da medição").fill("110");
  await editDialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByText("Glicemia atualizada com sucesso.").first(),
  ).toBeVisible();
  await expect(glucoseValue(page, "110")).toBeVisible();
  await expect(glucoseValue(page, "95")).toHaveCount(0);

  // Delete offline.
  await glucoseRow(page, "110")
    .getByRole("button", { name: "Excluir registro" })
    .click();
  const deleteDialog = page.getByRole("alertdialog");
  await deleteDialog.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(page.getByText("Registro excluído.").first()).toBeVisible();
  await expect(glucoseValue(page, "110")).toHaveCount(0);

  // Leave a reading created while offline to verify it survives reconnect.
  await addGlucose(page, "135", "Antes da refeição");

  // --- Back online ---
  await page.context().setOffline(false);
  await expect(page.getByText("Conexão restaurada")).toBeVisible();

  // A fresh load re-requires authentication (key is memory-only by design),
  // and the offline-created record must still be there afterwards.
  await page.reload();
  await page.waitForURL("**/login");

  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard");
  await goTo(page, "/glucose");

  await expect(glucoseValue(page, "128")).toBeVisible();
  await expect(glucoseValue(page, "135")).toBeVisible();
  await expect(glucoseValue(page, "110")).toHaveCount(0);
  await expect(glucoseValue(page, "95")).toHaveCount(0);
});

test("o indicador de conexão reflete a perda e a restauração de rede", async ({
  page,
}) => {
  await signup(page);

  await expect(
    page.getByText("Você está offline. Seus dados continuam disponíveis."),
  ).toHaveCount(0);

  await page.context().setOffline(true);
  await expect(
    page.getByText("Você está offline. Seus dados continuam disponíveis."),
  ).toBeVisible();

  await page.context().setOffline(false);
  await expect(page.getByText("Conexão restaurada")).toBeVisible();
});