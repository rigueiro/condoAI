import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

const DEMO_EMAIL = "admin@condoai.pt";
const DEFAULT_PASSWORD = "admin123";
const NEW_PASSWORD = "newpass99";

async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.goto("/");
}

function latestResetTokenFor(email: string): string {
  const storePath = path.join(process.cwd(), ".data", "store.json");
  const store = JSON.parse(readFileSync(storePath, "utf8")) as {
    resetTokens?: Record<string, { email: string; expiresAt: number }>;
  };
  const key = email.trim().toLowerCase();
  const matches = Object.entries(store.resetTokens ?? {}).filter(
    ([, record]) => record.email === key,
  );
  expect(matches).toHaveLength(1);
  return matches[0][0];
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
    await expect(
      page.getByRole("link", { name: "Continuar para redefinir a senha" }),
    ).toHaveCount(0);
  });

  test("resets demo password end-to-end", async ({ page }) => {
    await page.goto("/pt/forgot-password");

    const resetResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/auth/forgot-password") &&
        res.request().method() === "POST",
    );

    await page.getByLabel("Endereço de email").fill(DEMO_EMAIL);
    await page
      .getByRole("button", { name: "Enviar link de recuperação" })
      .click();

    const res = await resetResponse;
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty("demoResetToken");
    expect(body).not.toHaveProperty("token");

    await expect(
      page.getByRole("heading", { name: "Verifique o seu email" }),
    ).toBeVisible();

    await page.goto(`/pt/reset-password?token=${latestResetTokenFor(DEMO_EMAIL)}`);
    await expect(
      page.getByRole("heading", { name: "Escolha uma nova senha" }),
    ).toBeVisible();

    await page.locator("#newPassword").fill(NEW_PASSWORD);
    await page.locator("#confirmPassword").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Atualizar senha" }).click();

    await expect(
      page.getByRole("heading", { name: "Senha atualizada" }),
    ).toBeVisible();

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

    // Restore default demo password for other tests / local reuse.
    await page.request.post("/api/auth/password", {
      data: {
        currentPassword: NEW_PASSWORD,
        newPassword: DEFAULT_PASSWORD,
      },
    });
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
