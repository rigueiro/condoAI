import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "admin@condoai.pt";
const DEFAULT_PASSWORD = "admin123";
const NEW_PASSWORD = "newpass99";

const STORAGE_KEY = "condoai.user";
const SESSION_STORAGE_KEY = "condoai.user.session";
const PASSWORD_KEY = "condoai.auth.password";
const RESET_TOKEN_KEY = "condoai.auth.reset";

async function clearAuthState(page: Page) {
  await page.goto("/");
  await page.evaluate(
    ({ local, session, password, reset }) => {
      window.localStorage.removeItem(local);
      window.sessionStorage.removeItem(session);
      window.localStorage.removeItem(password);
      window.localStorage.removeItem(reset);
    },
    {
      local: STORAGE_KEY,
      session: SESSION_STORAGE_KEY,
      password: PASSWORD_KEY,
      reset: RESET_TOKEN_KEY,
    },
  );
}

test.describe("Forgot password flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test("login links to forgot password page", async ({ page }) => {
    await page.goto("/pt/login");
    await expect(
      page.getByRole("heading", { level: 1, name: "CondoAI" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Esqueceu a senha?" }).click();
    await expect(page).toHaveURL(/\/pt\/forgot-password/);
    await expect(
      page.getByRole("heading", { name: "Recuperar a senha" }),
    ).toBeVisible();
  });

  test("shows identical success UI for unknown and known emails", async ({
    page,
  }) => {
    await page.goto("/pt/forgot-password");
    await page.getByLabel("Endereço de email").fill("unknown@example.com");
    await page
      .getByRole("button", { name: "Enviar link de recuperação" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Verifique o seu email" }),
    ).toBeVisible();
    // No in-UI continue CTA — that would reveal whether the account exists.
    await expect(
      page.getByRole("link", { name: "Continuar para redefinir a senha" }),
    ).toHaveCount(0);

    const unknownToken = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      RESET_TOKEN_KEY,
    );
    expect(unknownToken).toBeNull();
  });

  test("resets demo password end-to-end", async ({ page }) => {
    await page.goto("/pt/forgot-password");
    await page.getByLabel("Endereço de email").fill(DEMO_EMAIL);
    await page
      .getByRole("button", { name: "Enviar link de recuperação" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Verifique o seu email" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continuar para redefinir a senha" }),
    ).toHaveCount(0);

    const token = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return (JSON.parse(raw) as { token: string }).token;
    }, RESET_TOKEN_KEY);
    expect(token).toBeTruthy();

    await page.goto(`/pt/reset-password?token=${token}`);
    await expect(
      page.getByRole("heading", { name: "Escolha uma nova senha" }),
    ).toBeVisible();

    await page.locator("#newPassword").fill(NEW_PASSWORD);
    await page.locator("#confirmPassword").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Atualizar senha" }).click();

    await expect(
      page.getByRole("heading", { name: "Senha atualizada" }),
    ).toBeVisible();

    const storedPassword = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      PASSWORD_KEY,
    );
    expect(storedPassword).toBe(NEW_PASSWORD);

    await page.goto("/pt/login");
    await expect(
      page.getByRole("heading", { level: 1, name: "CondoAI" }),
    ).toBeVisible();

    await page.getByLabel("Endereço de email").fill(DEMO_EMAIL);
    await page.getByLabel("Senha").fill(DEFAULT_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Credenciais inválidas")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByLabel("Senha").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/pt\/dashboard/, { timeout: 15_000 });
  });

  test("invalid reset token shows recovery options", async ({ page }) => {
    await page.goto("/pt/reset-password?token=not-a-real-token");
    await expect(
      page.getByRole("heading", { name: "Link inválido" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Pedir um novo link" }),
    ).toBeVisible();
  });
});
