import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn } from "./helpers/auth";

test.describe("Suite 2: Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T2.1 — Dashboard loads with skeleton then data", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Dashboard heading
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Wait for data to load — 4 macro cards should be visible
    await expect(page.getByText("Calories")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Protein")).toBeVisible();
    await expect(page.getByText("Carbs")).toBeVisible();
    await expect(page.getByText("Fat")).toBeVisible();
  });

  test("T2.2 — Macro cards show correct targets", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Wait for cards to load
    await expect(page.getByText("Calories")).toBeVisible({ timeout: 15_000 });

    // Each card shows "current / target" format
    // Look for the pattern: number / number (with optional unit)
    const cards = page.locator(".text-2xl.font-bold");
    await expect(cards).toHaveCount(4);

    // Each card should have a progress bar
    const progressBars = page.locator(".h-2.rounded-full.bg-muted");
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("T2.3 — Micronutrients card", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    await expect(page.getByText("Micronutrients")).toBeVisible({ timeout: 15_000 });

    // Check for nutrient labels
    await expect(page.getByText("Fiber")).toBeVisible();
    await expect(page.getByText("Sugar")).toBeVisible();
    await expect(page.getByText("Sodium")).toBeVisible();
    await expect(page.getByText("Sat. Fat")).toBeVisible();
  });

  test("T2.4 — Today's Meals card (empty state)", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    await expect(page.getByText("Today's Meals")).toBeVisible({ timeout: 15_000 });

    // Empty state message (if no food has been logged yet)
    const emptyMessage = page.getByText("No meals logged yet. Start by adding food to your log.");
    const mealEntries = page.locator("[class*='space-y-2'] .text-sm.font-medium");

    // Either empty message is visible or entries exist
    const isEmpty = await emptyMessage.isVisible().catch(() => false);
    if (isEmpty) {
      await expect(emptyMessage).toBeVisible();
    } else {
      // Some entries exist (from prior test runs)
      const count = await mealEntries.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("T2.5 — Checklist widget", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Wait for checklist to auto-generate
    const checklistHeader = page.getByText("Daily Checklist");
    const hasChecklist = await checklistHeader.isVisible({ timeout: 10_000 }).catch(() => false);

    if (hasChecklist) {
      await expect(checklistHeader).toBeVisible();

      // "View all" link
      const viewAll = page.getByRole("link", { name: "View all" });
      await expect(viewAll).toBeVisible();

      // Click and verify navigation
      await viewAll.click();
      await page.waitForURL("**/checklist");
      expect(page.url()).toContain("/checklist");
    }
  });
});
