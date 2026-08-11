import { test, expect, type Page } from "@playwright/test";
import { SESSION_COOKIE } from "../../src/lib/auth/constants";

/**
 * E2E tests for the CondoAI login flow (httpOnly cookie session).
 */

const DEMO_CREDENTIALS = {
  email: "admin@condoai.pt",
  password: "admin123",
};

async function gotoLogin(page: Page, locale: "pt" | "en" = "pt") {
  await page.context().clearCookies();
  await page.goto(`/${locale}/login`);
}

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await gotoLogin(page);
  });

  test("renders the login form with brand and inputs", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "CondoAI" }),
    ).toBeVisible();
    await expect(page.getByLabel("Endereço de email")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Entrar" }),
    ).toBeVisible();
  });

  test("validates required fields when submitting empty form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Email obrigatório")).toBeVisible();
    await expect(page.getByText("Senha obrigatória")).toBeVisible();
    await expect(page).toHaveURL(/\/pt\/login$/);
  });

  test("shows email format error for invalid email", async ({ page }) => {
    await page.getByLabel("Endereço de email").fill("abc@def");
    await page.getByLabel("Senha").fill("anything");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(
      page.getByText("Introduza um endereço de email válido"),
    ).toBeVisible();
  });

  test("shows minimum length error for short password", async ({ page }) => {
    await page.getByLabel("Endereço de email").fill(DEMO_CREDENTIALS.email);
    await page.getByLabel("Senha").fill("123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(
      page.getByText("A senha deve ter pelo menos 8 caracteres"),
    ).toBeVisible();
  });

  test("shows server error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Endereço de email").fill("wrong@condoai.pt");
    await page.getByLabel("Senha").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Credenciais inválidas")).toBeVisible();
    await expect(page).toHaveURL(/\/pt\/login$/);
  });

  test("signs in with valid credentials and redirects to dashboard", async ({
    page,
  }) => {
    await page.getByLabel("Endereço de email").fill(DEMO_CREDENTIALS.email);
    await page.getByLabel("Senha").fill(DEMO_CREDENTIALS.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL(/\/pt\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/pt\/dashboard/);

    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === SESSION_COOKIE);
    expect(session?.value).toBeTruthy();
    expect(session?.httpOnly).toBe(true);
  });

  test('sets a longer-lived session cookie when "remember me" is checked', async ({
    page,
  }) => {
    await page.getByLabel("Endereço de email").fill(DEMO_CREDENTIALS.email);
    await page.getByLabel("Senha").fill(DEMO_CREDENTIALS.password);
    await page.getByLabel("Lembrar-me").check();
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL(/\/pt\/dashboard/, { timeout: 15_000 });

    const cookies = await page.context().cookies();
    const session = cookies.find((c) => c.name === SESSION_COOKIE);
    expect(session?.value).toBeTruthy();
    // Remember-me is 30 days; session-only is 1 day. Both have max-age.
    expect(session?.expires ?? -1).toBeGreaterThan(Date.now() / 1000 + 2 * 86400);
  });

  test("clears inline error as user types in the field", async ({ page }) => {
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Email obrigatório")).toBeVisible();

    await page.getByLabel("Endereço de email").fill("a");
    await expect(page.getByText("Email obrigatório")).toHaveCount(0);
  });

  test("redirects unauthenticated users away from dashboard", async ({
    page,
  }) => {
    await page.goto("/pt/dashboard");
    await expect(page).toHaveURL(/\/pt\/login/);
  });
});

test.describe("Login page (English locale)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoLogin(page, "en");
  });

  test("renders English copy when navigating to /en/login", async ({
    page,
  }) => {
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In" }),
    ).toBeVisible();
  });

  test("signs in successfully on the English locale", async ({ page }) => {
    await page.getByLabel("Email Address").fill(DEMO_CREDENTIALS.email);
    await page.getByLabel("Password").fill(DEMO_CREDENTIALS.password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL(/\/en\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/en\/dashboard/);
  });
});
