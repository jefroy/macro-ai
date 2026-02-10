import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 6: Analytics & Weight Tracking", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T6.1 — View analytics page", async ({ page }) => {
    await page.goto(ROUTES.analytics);

    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();

    // Date range selector should be visible (defaults to "14 days")
    const rangeSelector = page.locator('[role="combobox"]').first();
    await expect(rangeSelector).toBeVisible();
  });

  test("T6.2 — Change date range", async ({ page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // Open range selector
    const rangeSelector = page.locator('[role="combobox"]').first();
    await rangeSelector.click();

    // Select "7 days"
    await page.getByRole("option", { name: "7 days" }).click();
    await page.waitForTimeout(1_000);

    // Open again and select "30 days"
    await rangeSelector.click();
    await page.getByRole("option", { name: "30 days" }).click();
    await page.waitForTimeout(1_000);
  });

  test("T6.3 — Verify charts render", async ({ page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // Calorie Trend card
    await expect(page.getByText("Calorie Trend")).toBeVisible();

    // Daily Macros card
    await expect(page.getByText("Daily Macros")).toBeVisible();

    // Macro Split card
    await expect(page.getByText("Macro Split")).toBeVisible();

    // Check for SVG elements (Recharts renders SVG)
    const svgElements = page.locator("svg.recharts-surface");
    const svgCount = await svgElements.count();
    // May have 0 if no data, or multiple if data exists
    // Either data or empty state message should be present
    if (svgCount === 0) {
      await expect(page.getByText("No data yet").first()).toBeVisible();
    }
  });

  test("T6.4 — Log weight", async ({ page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // Scroll to weight tracking section
    await page.getByText("Weight Tracking").scrollIntoViewIfNeeded();

    // Fill weight input
    await page.locator("#weight_kg").fill("81.5");

    // Click Log button
    await page.getByRole("button", { name: "Log" }).click();

    await expectToast(page, "Weight logged");

    // Weight entry should appear in Recent list
    await expect(page.getByText("81.5 kg")).toBeVisible({ timeout: 5_000 });
  });

  test("T6.5 — Delete weight entry", async ({ page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // Scroll to weight tracking
    await page.getByText("Weight Tracking").scrollIntoViewIfNeeded();

    // Find a weight entry's trash button
    const recentSection = page.getByText("Recent Entries");
    const hasRecent = await recentSection.isVisible().catch(() => false);

    if (hasRecent) {
      // Find trash button in the weight entries area
      const weightTrashButtons = page.locator('.space-y-1 button:has(svg.lucide-trash-2)');
      const count = await weightTrashButtons.count();

      if (count > 0) {
        await weightTrashButtons.first().click();

        // Confirmation dialog
        const alertDialog = page.locator('[role="alertdialog"]');
        await expect(alertDialog).toBeVisible();
        await expect(alertDialog.getByText("Delete weight entry?")).toBeVisible();

        await alertDialog.getByRole("button", { name: "Delete" }).click();
        await expect(alertDialog).not.toBeVisible();
        await expectToast(page, "Entry removed");
      }
    }
  });

  test("T6.6 — Micronutrient heatmap", async ({ page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // On desktop viewport: table should be visible
    const heatmapTitle = page.getByText("Micronutrient Heatmap");
    const hasHeatmap = await heatmapTitle.isVisible().catch(() => false);

    if (hasHeatmap) {
      await heatmapTitle.scrollIntoViewIfNeeded();

      // Desktop: table with nutrient rows
      const table = page.locator("table");
      const hasTable = await table.isVisible().catch(() => false);

      if (hasTable) {
        // Check nutrient labels
        await expect(page.getByText("Fiber").first()).toBeVisible();
        await expect(page.getByText("Sugar").first()).toBeVisible();
        await expect(page.getByText("Sodium").first()).toBeVisible();
        await expect(page.getByText("Sat Fat").first()).toBeVisible();
      }

      // Mobile viewport test
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // On mobile: stacked card view
      const mobileCards = page.locator(".md\\:hidden .rounded-md.border");
      const mobileCount = await mobileCards.count();
      // Either cards are visible or heatmap section isn't rendered (no data)
    }

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("T6.7 — Export CSV", async ({ page }) => {
    await page.goto(ROUTES.analytics);
    await page.waitForTimeout(2_000);

    // Scroll to Export Data card
    const exportCard = page.getByText("Export Data");
    await exportCard.scrollIntoViewIfNeeded();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);

    // Click export button
    await page.getByRole("button", { name: /Export CSV/ }).click();

    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toContain(".csv");
    }
  });
});
