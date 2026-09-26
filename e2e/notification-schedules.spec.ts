import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { goTo } from "./helpers/nav";

const PASSWORD = "Senha-Forte-123";
const EMPTY_STATE =
  "Nenhum lembrete configurado. Adicione um lembrete para receber um aviso no horário escolhido.";

function uniqueEmail() {
  return `e2e-notifications-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@test.dev`;
}

async function signupAndOpenSettings(page: Page) {
  const email = uniqueEmail();
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Usuário E2E Notificações");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirmar senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");
  await goTo(page, "/settings");

  await expect(page.getByText("Notificações", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Notificações ativadas", { exact: true })).toBeVisible();
  return email;
}

function toast(page: Page, message: string) {
  return page.getByRole("status").filter({ hasText: message }).first();
}

function scheduleItem(page: Page, label = "Medição da manhã") {
  return page.getByRole("listitem").filter({ hasText: label });
}

async function selectDefault(
  page: Page,
  dialog: ReturnType<Page["getByRole"]>,
  name: string,
  option: string,
) {
  await dialog.getByRole("combobox", { name }).click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("option", { name: option })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();
}

async function createSchedule(
  page: Page,
  label = "Medição da manhã",
  time = "08:00",
) {
  await page.getByRole("button", { name: "Adicionar lembrete" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Adicionar lembrete", { exact: true })).toBeVisible();
  await dialog.getByLabel("Nome do lembrete (opcional)").fill(label);
  await selectDefault(page, dialog, "Período", "Manhã");
  await dialog.getByLabel("Horário").fill(time);
  await selectDefault(page, dialog, "Repetir", "Todos os dias");
  await dialog.getByLabel("Medições").check();
  await dialog.getByRole("button", { name: "Salvar lembrete" }).click();
  await expect(dialog).toBeHidden();
}

async function notificationPermission(context: BrowserContext, origin: string) {
  const probe = await context.newPage();
  await probe.goto(origin);
  const permission = await probe.evaluate(() =>
    "Notification" in window ? Notification.permission : "unsupported",
  );
  await probe.close();
  return permission;
}

async function grantNotificationPermission(context: BrowserContext, origin: string) {
  await context.grantPermissions(["notifications"], { origin });
  if ((await notificationPermission(context, origin)) === "granted") return;

  await context.addInitScript(() => {
    if (!("Notification" in window)) return;
    Object.defineProperty(window.Notification, "permission", {
      configurable: true,
      get: () => "granted",
    });
    window.Notification.requestPermission = async () => "granted";
  });
}

test.describe("Local reminders", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await grantNotificationPermission(context, baseURL ?? "http://localhost:3000");
  });

  test("creates a schedule with time, period and record type", async ({
    page,
  }) => {
    await signupAndOpenSettings(page);
    await expect(page.getByText(EMPTY_STATE, { exact: true })).toBeVisible();

    await createSchedule(page);

    await expect(toast(page, "Lembrete criado com sucesso.")).toBeVisible();
    const item = scheduleItem(page);
    await expect(item).toBeVisible();
    await expect(item).toContainText("08:00");
    await expect(item).toContainText("Manhã");
    await expect(item).toContainText("Todos os dias");
    await expect(item.getByText("Medição da manhã", { exact: true })).toBeVisible();
    await expect(item.getByText("Medições", { exact: true })).toBeVisible();
    await expect(item.getByText("Ativo", { exact: true })).toBeVisible();
  });

  test("edits the time of a schedule", async ({ page }) => {
    await signupAndOpenSettings(page);
    await createSchedule(page);

    const item = scheduleItem(page);
    await item.getByRole("button", { name: "Editar" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Editar lembrete", { exact: true })).toBeVisible();
    await expect(dialog.getByLabel("Horário")).toHaveValue("08:00");
    await dialog.getByLabel("Horário").fill("09:00");
    await dialog.getByRole("button", { name: "Salvar lembrete" }).click();

    await expect(toast(page, "Lembrete atualizado com sucesso.")).toBeVisible();
    await expect(item).toContainText("09:00");
    await expect(item).not.toContainText("08:00");
  });

  test("disables and re-enables a schedule", async ({ page }) => {
    await signupAndOpenSettings(page);
    await createSchedule(page);

    const item = scheduleItem(page);
    await item.getByLabel("Desativar", { exact: true }).click();

    await expect(item.getByText("Desativado", { exact: true })).toBeVisible();
    await expect(item.getByLabel("Ativar", { exact: true })).toBeVisible();
  });

  test("deletes a schedule and restores the empty state", async ({ page }) => {
    await signupAndOpenSettings(page);
    await createSchedule(page);

    const item = scheduleItem(page);
    await item.getByRole("button", { name: "Excluir" }).click();

    await expect(toast(page, "Lembrete excluído.")).toBeVisible();
    await expect(item).toHaveCount(0);
    await expect(page.getByText(EMPTY_STATE, { exact: true })).toBeVisible();
  });

  test("keeps the schedule when navigating between routes", async ({ page }) => {
    await signupAndOpenSettings(page);
    await createSchedule(page);

    await goTo(page, "/dashboard");
    await goTo(page, "/settings");

    await expect(page.getByText("Notificações ativadas", { exact: true })).toBeVisible();
    await expect(scheduleItem(page)).toContainText("08:00");
  });

  test("saves preferences and quiet hours", async ({ page }) => {
    const email = await signupAndOpenSettings(page);
    const reminders = page.getByLabel("Ativar lembretes", { exact: true });
    const quietHours = page.getByLabel("Ativar período silencioso", { exact: true });
    const save = page.getByRole("button", { name: "Salvar preferências" });

    await reminders.check();
    await quietHours.check();
    await page.getByLabel("Início", { exact: true }).fill("22:00");
    await page.getByLabel("Fim", { exact: true }).fill("07:00");
    await expect(save).toBeEnabled();
    await save.click();

    await expect(toast(page, "Preferências salvas.")).toBeVisible();
    await expect(save).toBeDisabled();

    await page.reload();
    await page.waitForURL("**/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL("**/dashboard");
    await goTo(page, "/settings");

    await expect(page.getByLabel("Ativar lembretes", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Ativar período silencioso", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Início", { exact: true })).toHaveValue("22:00");
    await expect(page.getByLabel("Fim", { exact: true })).toHaveValue("07:00");
  });

  test("discloses the background reminder limitation", async ({ page }) => {
    await signupAndOpenSettings(page);

    await expect(
      page.getByText("Lembretes dependem do app aberto", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Lembretes", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Ativar lembretes", { exact: true })).toBeVisible();
  });
});
