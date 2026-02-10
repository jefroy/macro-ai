import { test, expect } from "@playwright/test";
import { TEST_USER, ROUTES } from "./helpers/constants";
import { registerAndOnboard, expectToast } from "./helpers/auth";

test.describe("Suite 1: Authentication & Onboarding", () => {
  test("T1.1 — Register new account", async ({ page }) => {
    await page.goto(ROUTES.register);

    // Verify page elements
    await expect(page.getByText("MacroAI")).toBeVisible();
    await expect(page.getByText("Create your account")).toBeVisible();

    // Fill form
    await page.locator("#email").fill(TEST_USER.email);
    await page.locator("#password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Should redirect to onboarding (first-time user)
    await page.waitForURL("**/onboarding", { timeout: 15_000 });
    expect(page.url()).toContain("/onboarding");
  });

  test("T1.2 — Complete onboarding wizard", async ({ page }) => {
    // Navigate to onboarding (user should already be registered from T1.1)
    // Re-login since each test has a fresh context
    await page.goto(ROUTES.login);
    await page.locator("#email").fill(TEST_USER.email);
    await page.locator("#password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // If user hasn't onboarded, AuthGuard redirects to /onboarding
    await page.waitForURL("**/onboarding", { timeout: 15_000 });

    // Step 1: Profile — Verify 3 step indicator bars
    const stepBars = page.locator(".h-1\\.5.flex-1.rounded-full");
    await expect(stepBars).toHaveCount(3);

    // Fill profile fields
    await page.locator("#age").fill(TEST_USER.age);
    await page.locator("#height").fill(TEST_USER.height);
    await page.locator("#weight").fill(TEST_USER.weight);

    // Open Gender select → choose "Male"
    const genderTrigger = page.locator('[role="combobox"]').first();
    await genderTrigger.click();
    await page.getByRole("option", { name: "Male" }).click();

    // Activity Level defaults to "Moderate" — no need to change

    // Click Next
    await page.getByRole("button", { name: "Next" }).click();

    // Step 2: Goal — now "Your Goal" card is active
    await expect(page.getByText("Your Goal")).toBeVisible();

    // Choose "Cut"
    await page.locator('[role="combobox"]').click();
    await page.getByRole("option", { name: /Cut/ }).click();

    // Click Calculate Targets
    await page.getByRole("button", { name: "Calculate Targets" }).click();

    // Step 3: Review — verify target fields are populated
    await expect(page.getByText("Your Targets")).toBeVisible();
    await expect(page.locator("#cal")).not.toHaveValue("");
    await expect(page.locator("#prot")).not.toHaveValue("");
    await expect(page.locator("#carb")).not.toHaveValue("");
    await expect(page.locator("#fat")).not.toHaveValue("");

    // Optionally adjust protein
    await page.locator("#prot").fill("170");

    // Click Get Started
    await page.getByRole("button", { name: "Get Started" }).click();

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("T1.3 — Login with existing account", async ({ page }) => {
    await page.goto(ROUTES.login);

    await expect(page.getByText("Sign in to your account")).toBeVisible();

    await page.locator("#email").fill(TEST_USER.email);
    await page.locator("#password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    expect(page.url()).toContain("/dashboard");
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("T1.4 — Login with invalid credentials", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Error should appear
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    // Still on login page
    expect(page.url()).toContain("/login");
  });

  test("T1.5 — Navigate between login and register", async ({ page }) => {
    await page.goto(ROUTES.login);

    // Click Register link
    await page.getByRole("link", { name: "Register" }).click();
    await page.waitForURL("**/register");
    expect(page.url()).toContain("/register");

    // Click Sign in link
    await page.getByRole("link", { name: "Sign in" }).click();
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("T1.6 — Auth guard (unauthenticated access)", async ({ page }) => {
    // Clear any tokens
    await page.goto(ROUTES.login);
    await page.evaluate(() => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    });

    // Try to navigate to protected route
    await page.goto(ROUTES.dashboard);

    // Should be redirected to login
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
