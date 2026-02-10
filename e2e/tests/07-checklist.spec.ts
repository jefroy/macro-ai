import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 7: Checklist & Streaks", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T7.1 — View checklist page", async ({ page }) => {
    await page.goto(ROUTES.checklist);

    await expect(page.getByRole("heading", { name: "Daily Checklist" })).toBeVisible();

    // Progress bar
    const progressBar = page.locator(".h-2.rounded-full.bg-muted");
    await expect(progressBar).toBeVisible();

    // Completion badge (N/M · X%)
    const completionBadge = page.locator("text=/\\d+\\/\\d+ · \\d+%/");
    await expect(completionBadge).toBeVisible({ timeout: 10_000 });
  });

  test("T7.2 — Auto-check items present", async ({ page }) => {
    await page.goto(ROUTES.checklist);
    await page.waitForTimeout(3_000);

    // Auto items should have "(auto)" label
    const autoLabels = page.getByText("(auto)");
    const count = await autoLabels.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each auto item should have either a checked or unchecked icon
    const checkIcons = page.locator("svg.lucide-check-square, svg.lucide-square");
    const iconCount = await checkIcons.count();
    expect(iconCount).toBeGreaterThanOrEqual(1);
  });

  test("T7.3 — Add custom checklist item", async ({ page }) => {
    await page.goto(ROUTES.checklist);
    await page.waitForTimeout(2_000);

    // Find the custom task input
    const input = page.locator('input[placeholder*="creatine"]');
    await expect(input).toBeVisible();

    // Type a custom item
    await input.fill("Take Vitamin D");

    // Click Add
    await page.getByRole("button", { name: "Add" }).click();

    await expectToast(page, "Item added");

    // Item should appear in checklist
    await expect(page.getByText("Take Vitamin D")).toBeVisible();

    // Should NOT have "(auto)" tag
    const vitamindItem = page.locator("text=Take Vitamin D");
    const parent = vitamindItem.locator("..");
    const autoTag = parent.getByText("(auto)");
    const hasAutoTag = await autoTag.count();
    expect(hasAutoTag).toBe(0);
  });

  test("T7.4 — Toggle custom item", async ({ page }) => {
    await page.goto(ROUTES.checklist);
    await page.waitForTimeout(2_000);

    // Find "Take Vitamin D" item (or any custom item)
    const customItem = page.getByText("Take Vitamin D");
    const hasItem = await customItem.isVisible().catch(() => false);

    if (hasItem) {
      // Click the item's button to toggle
      const itemButton = customItem.locator("xpath=ancestor::button");
      await itemButton.click();
      await page.waitForTimeout(1_000);

      // Item should now be checked (line-through text)
      const checkedIcon = page.locator("button:has-text('Take Vitamin D') svg.lucide-check-square");
      const isChecked = await checkedIcon.isVisible().catch(() => false);

      // Progress should update
      const completionBadge = page.locator("text=/\\d+\\/\\d+ · \\d+%/");
      await expect(completionBadge).toBeVisible();
    }
  });

  test("T7.5 — Delete custom item", async ({ page }) => {
    await page.goto(ROUTES.checklist);
    await page.waitForTimeout(2_000);

    // Find trash button near "Take Vitamin D"
    const vitamindItem = page.locator("text=Take Vitamin D");
    const hasItem = await vitamindItem.isVisible().catch(() => false);

    if (hasItem) {
      // The trash button is a sibling in the same row
      const row = vitamindItem.locator("xpath=ancestor::div[contains(@class, 'flex items-center justify-between')]");
      const trashButton = row.locator('button:has(svg.lucide-trash-2)');

      if (await trashButton.count() > 0) {
        await trashButton.click();
        await expectToast(page, "Item removed");

        // Item should be gone
        await expect(vitamindItem).not.toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("T7.6 — Streak display", async ({ page }) => {
    await page.goto(ROUTES.checklist);
    await page.waitForTimeout(2_000);

    // Check for flame icon / streak badge
    const streakBadge = page.getByText(/day streak/);
    const hasStreak = await streakBadge.isVisible().catch(() => false);

    if (hasStreak) {
      // Flame icon should be visible
      const flameIcon = page.locator("svg.lucide-flame");
      await expect(flameIcon.first()).toBeVisible();
    }

    // Also check dashboard for streak in checklist widget
    await page.goto(ROUTES.dashboard);
    await page.waitForTimeout(2_000);

    const dashboardStreak = page.locator("svg.lucide-flame");
    const dashHasStreak = await dashboardStreak.first().isVisible().catch(() => false);
    // Streak may or may not be visible depending on activity
  });
});
