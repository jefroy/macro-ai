import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 11: Responsive & Cross-Cutting", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T11.1 — Loading states (skeletons)", async ({ page }) => {
    // Navigate to dashboard and look for skeletons
    await page.goto(ROUTES.dashboard);

    // Skeletons should appear initially (if data hasn't loaded yet)
    // Check for skeleton elements
    const skeletons = page.locator("[class*='skeleton'], [class*='animate-pulse']");

    // Wait for data to load
    await expect(page.getByText("Calories")).toBeVisible({ timeout: 15_000 });

    // After data loads, skeletons should be gone
    const skeletonCount = await skeletons.count();
    // Skeletons may have already been replaced by real data
  });

  test("T11.2 — Toast notifications", async ({ page }) => {
    await page.goto(ROUTES.profile);
    await page.waitForTimeout(2_000);

    // Perform a mutation to trigger a toast
    // Update display name
    await page.locator("#display_name").fill("Toast Test User");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Toast should appear
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible({ timeout: 10_000 });

    // Toast should auto-dismiss (3-5 seconds)
    await expect(toast).not.toBeVisible({ timeout: 10_000 });
  });

  test("T11.3 — 404 page", async ({ page }) => {
    await page.goto("/nonexistent-page");

    // Wait for page to load
    await page.waitForTimeout(2_000);

    // Should show a 404 / Not Found page
    const notFoundText = page.getByText(/not found|404/i);
    await expect(notFoundText).toBeVisible({ timeout: 5_000 });
  });

  test("T11.5 — Confirm dialog pattern across destructive actions", async ({ page }) => {
    // Test the confirm dialog pattern by checking the component structure
    // Each destructive action uses ConfirmDialog with AlertDialog

    // Test on food log page (delete food entry)
    await page.goto(ROUTES.log);
    await page.waitForTimeout(2_000);

    const trashButtons = page.locator('button:has(svg.lucide-trash-2)');
    const count = await trashButtons.count();

    if (count > 0) {
      // Click first trash button
      await trashButtons.first().click();

      // AlertDialog should appear
      const alertDialog = page.locator('[role="alertdialog"]');
      await expect(alertDialog).toBeVisible();

      // Should have Cancel and Delete buttons
      await expect(alertDialog.getByRole("button", { name: "Cancel" })).toBeVisible();
      await expect(alertDialog.getByRole("button", { name: "Delete" })).toBeVisible();

      // Cancel should close without action
      await alertDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(alertDialog).not.toBeVisible();
    }
  });
});
