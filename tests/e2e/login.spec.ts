import { test, expect, type Page } from "@playwright/test";

/**
 * E2E tests for the CondoAI login flow.
 *
 * The app uses a mocked auth provider (see src/lib/auth/auth-provider.tsx)
 * that resolves the credentials below and persists the session to
 * localStorage / sessionStorage depending on the "remember me" toggle.
 */

const DEMO_CREDENTIALS = {
  email: "admin@condoai.pt",
  password: "admin123",
};

const STORAGE_KEY = "condoai.user";
const SESSION_STORAGE_KEY = "condoai.user.session";

/**
 * Clear any persisted auth state and navigate to the login page.
 * We visit "/" first so we have an origin to scope storage clearing to.
 */
async function gotoLogin(page: Page, locale: "pt" | "en" = "pt") {
  await page.goto("/");
  await page.evaluate(
    ({ local, session }) => {
      window.localStorage.removeItem(local);
      window.sessionStorage.removeItem(session);
    },
    { local: STORAGE_KEY, session: SESSION_STORAGE_KEY },
  );
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
    // "abc@def" passes the browser's native type="email" check (HTML5
    // allows single-label hosts) but fails the app's stricter regex
    // which requires a dot in the domain.
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
      page.getByText("A senha deve ter pelo menos 6 caracteres"),
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

    const sessionUser = await page.evaluate(
      (key) => window.sessionStorage.getItem(key),
      SESSION_STORAGE_KEY,
    );
    expect(sessionUser).not.toBeNull();
    expect(sessionUser).toContain(DEMO_CREDENTIALS.email);

    const persistedUser = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(persistedUser).toBeNull();
  });

  test('persists session to localStorage when "remember me" is checked', async ({
    page,
  }) => {
    await page.getByLabel("Endereço de email").fill(DEMO_CREDENTIALS.email);
    await page.getByLabel("Senha").fill(DEMO_CREDENTIALS.password);
    await page.getByLabel("Lembrar-me").check();
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL(/\/pt\/dashboard/, { timeout: 15_000 });

    const persistedUser = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(persistedUser).not.toBeNull();
    expect(persistedUser).toContain(DEMO_CREDENTIALS.email);
  });

  test("clears inline error as user types in the field", async ({ page }) => {
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Email obrigatório")).toBeVisible();

    await page.getByLabel("Endereço de email").fill("a");
    await expect(page.getByText("Email obrigatório")).toHaveCount(0);
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
