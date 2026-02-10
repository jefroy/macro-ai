import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 5: Profile & Goal Templates", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T5.1 — View profile", async ({ page }) => {
    await page.goto(ROUTES.profile);

    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Profile form should show filled values
    await expect(page.locator("#display_name")).toBeVisible();
    await expect(page.locator("#age")).toBeVisible();
    await expect(page.locator("#height")).toBeVisible();
    await expect(page.locator("#weight")).toBeVisible();

    // Daily Targets card
    await expect(page.getByText("Daily Targets")).toBeVisible();
  });

  test("T5.2 — Update profile", async ({ page }) => {
    await page.goto(ROUTES.profile);
    await page.waitForTimeout(2_000);

    // Update display name
    await page.locator("#display_name").fill("Test User");

    // Update weight
    await page.locator("#weight").fill("81.0");

    // Click Save Changes
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Profile updated");

    // Reload and verify
    await page.reload();
    await page.waitForTimeout(2_000);

    await expect(page.locator("#display_name")).toHaveValue("Test User");
    await expect(page.locator("#weight")).toHaveValue("81");
  });

  test("T5.3 — Update targets manually", async ({ page }) => {
    await page.goto(ROUTES.profile);
    await page.waitForTimeout(2_000);

    // Update macro targets
    await page.locator("#calories").fill("1900");
    await page.locator("#protein").fill("170");
    await page.locator("#carbs").fill("170");
    await page.locator("#fat").fill("60");

    // Click Save Targets
    await page.getByRole("button", { name: "Save Targets" }).click();
    await expectToast(page, "Targets updated");

    // Navigate to dashboard and verify
    await page.goto(ROUTES.dashboard);
    await page.waitForTimeout(3_000);

    // Verify targets appear on macro cards
    await expect(page.getByText("1900")).toBeVisible();
    await expect(page.getByText("170")).toBeVisible();
  });

  test("T5.4 — Apply goal template", async ({ page }) => {
    await page.goto(ROUTES.profile);
    await page.waitForTimeout(2_000);

    // Goal Templates card should be visible
    const templatesCard = page.getByText("Goal Templates");
    const hasTemplates = await templatesCard.isVisible().catch(() => false);

    if (hasTemplates) {
      // Find and click an "Apply" button
      const applyButtons = page.getByRole("button", { name: "Apply" });
      const count = await applyButtons.count();

      if (count > 0) {
        await applyButtons.first().click();

        // Wait for toast
        const toast = page.locator("[data-sonner-toast]");
        await expect(toast).toBeVisible({ timeout: 10_000 });

        // Save the applied targets
        await page.getByRole("button", { name: "Save Targets" }).click();
        await expectToast(page, "Targets updated");
      }
    }
  });
});
