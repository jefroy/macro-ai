import { type Page, expect } from "@playwright/test";
import { TEST_USER, ROUTES } from "./constants";

/**
 * Register a new account and complete onboarding.
 * Ends on /dashboard with a fully set-up user.
 */
export async function registerAndOnboard(page: Page) {
  await page.goto(ROUTES.register);
  await page.locator("#email").fill(TEST_USER.email);
  await page.locator("#password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Create account" }).click();

  // After registration, AuthGuard redirects to /onboarding for first-time users
  await page.waitForURL("**/onboarding", { timeout: 15_000 });

  // Step 1: Profile
  await page.locator("#age").fill(TEST_USER.age);
  await page.locator("#height").fill(TEST_USER.height);
  await page.locator("#weight").fill(TEST_USER.weight);

  // Gender select (Radix)
  await page.getByText("Select").first().click();
  await page.getByRole("option", { name: "Male" }).click();

  // Activity Level — already defaults to "Moderate"
  await page.getByRole("button", { name: "Next" }).click();

  // Step 2: Goal — select "Cut"
  // Open the Goal select (the only select on the goals step)
  await page.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: /Cut/ }).click();
  await page.getByRole("button", { name: "Calculate Targets" }).click();

  // Step 3: Review — targets are auto-filled
  await expect(page.locator("#cal")).not.toHaveValue("");
  await page.getByRole("button", { name: "Get Started" }).click();

  // Should land on dashboard
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Login with the test user credentials.
 * Ends on /dashboard.
 */
export async function login(page: Page) {
  await page.goto(ROUTES.login);
  await page.locator("#email").fill(TEST_USER.email);
  await page.locator("#password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

/**
 * Ensure the user is logged in. Skips if already authenticated.
 */
export async function ensureLoggedIn(page: Page) {
  // Check if we have a token in localStorage
  const hasToken = await page.evaluate(() => !!localStorage.getItem("access_token"));
  if (hasToken) {
    // Navigate to dashboard to verify it works
    await page.goto(ROUTES.dashboard);
    try {
      await page.waitForURL("**/dashboard", { timeout: 5_000 });
      return;
    } catch {
      // Token expired or invalid, re-login
    }
  }
  await login(page);
}

/**
 * Wait for a sonner toast notification with specific text.
 */
export async function expectToast(page: Page, text: string) {
  const toast = page.locator("[data-sonner-toast]", { hasText: text });
  await expect(toast).toBeVisible({ timeout: 10_000 });
}

/**
 * Select a value from a ShadCN/Radix Select component.
 * @param trigger - The SelectTrigger locator
 * @param optionText - The visible text of the option
 */
export async function selectOption(page: Page, triggerLocator: string, optionText: string) {
  await page.locator(triggerLocator).click();
  await page.getByRole("option", { name: optionText }).click();
}
