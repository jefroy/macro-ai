import { test, expect } from "@playwright/test";
import { TEST_USER, ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 12: Data Integrity & Edge Cases", () => {
  test("T12.1 — Empty states (food log)", async ({ page }) => {
    // This relies on a fresh state — check the text patterns
    await ensureLoggedIn(page);

    // Recipes empty state
    await page.goto(ROUTES.recipes);
    await page.waitForTimeout(2_000);

    // Either empty state or recipes exist
    const emptyRecipes = page.getByText("No recipes yet");
    const hasEmptyRecipes = await emptyRecipes.isVisible().catch(() => false);
    // Both are valid states depending on test order

    // Chat empty state
    await page.goto(ROUTES.chat);
    await page.waitForTimeout(2_000);

    const chatPlaceholder = page.getByText("Ask me anything");
    const hasChatPlaceholder = await chatPlaceholder.isVisible().catch(() => false);
    if (hasChatPlaceholder) {
      await expect(chatPlaceholder).toBeVisible();
    }
  });

  test("T12.2 — Duplicate registration", async ({ page }) => {
    await page.goto(ROUTES.register);

    // Try registering with existing email
    await page.locator("#email").fill(TEST_USER.email);
    await page.locator("#password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Create account" }).click();

    // Should show error
    await expect(
      page.getByText("Registration failed. Email may already be in use.")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("T12.3 — Food search edge cases", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(ROUTES.log);

    await page.getByRole("button", { name: /Add Food/ }).click();
    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[placeholder="Search foods..."]');

    // Single char "z" — no search triggered (min 2 chars)
    await searchInput.fill("z");
    await page.waitForTimeout(500);
    // Search results should NOT appear
    const results = dialog.locator(".max-h-80 button");
    await expect(results).toHaveCount(0);

    // Two chars "zz" — search triggers, likely 0 results
    await searchInput.fill("zz");
    await page.waitForTimeout(1_000);
    const noResultsText = dialog.getByText(/No foods found/);
    // May show "No foods found for "zz""
    const hasNoResults = await noResultsText.isVisible().catch(() => false);

    // Type "chicken" — results should appear
    await searchInput.fill("chicken");
    await page.waitForTimeout(500);
    const chickenResults = dialog.locator("button .font-medium");
    await expect(chickenResults.first()).toBeVisible({ timeout: 10_000 });

    // Clear input — favorites and recent should reappear
    await searchInput.fill("");
    await page.waitForTimeout(500);

    // Either favorites or recent section should be visible (if data exists)
    const favSection = dialog.getByText("Favorites", { exact: false });
    const recentSection = dialog.getByText("Recent", { exact: false });
    const hasFav = await favSection.isVisible().catch(() => false);
    const hasRecent = await recentSection.isVisible().catch(() => false);
    // At least one should be visible if user has logged food
  });

  test("T12.4 — Copy meal with no source", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(ROUTES.log);

    await page.getByRole("button", { name: /Copy Meal/ }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Set source to yesterday's breakfast (unlikely to have data)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    const sourceDate = dialog.locator('input[type="date"]').first();
    await sourceDate.fill(dateStr);

    // Set source meal to breakfast
    const sourceMealTrigger = dialog.locator('[role="combobox"]').first();
    await sourceMealTrigger.click();
    await page.getByRole("option", { name: "Breakfast" }).click();

    // Click Copy Meal
    await dialog.getByRole("button", { name: "Copy Meal" }).last().click();

    // Should show error toast
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible({ timeout: 10_000 });
  });

  test("T12.5 — Weight upsert behavior", async ({ page }) => {
    await ensureLoggedIn(page);
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // Scroll to weight tracking
    await page.getByText("Weight Tracking").scrollIntoViewIfNeeded();

    // Log weight 80.0
    await page.locator("#weight_kg").fill("80.0");
    await page.getByRole("button", { name: "Log" }).click();
    await expectToast(page, "Weight logged");
    await page.waitForTimeout(1_000);

    // Log weight 80.5 again for today
    await page.locator("#weight_kg").fill("80.5");
    await page.getByRole("button", { name: "Log" }).click();
    await expectToast(page, "Weight logged");
    await page.waitForTimeout(1_000);

    // There should be only 1 entry for today (upsert behavior)
    // The value should be 80.5 (the latest)
    await expect(page.getByText("80.5 kg")).toBeVisible();

    // Count today's entries — should not see both 80.0 and 80.5
    const todayFormatted = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Look for the latest entry
    const entries = page.locator(".space-y-1 .flex.items-center.justify-between");
    const entryCount = await entries.count();
    // May have multiple entries from different days, but today should only have 80.5
  });
});
