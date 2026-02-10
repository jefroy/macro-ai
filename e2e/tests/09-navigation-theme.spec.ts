import { test, expect } from "@playwright/test";
import { ROUTES, NAV_ITEMS } from "./helpers/constants";
import { ensureLoggedIn } from "./helpers/auth";

test.describe("Suite 9: Navigation & Theme", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T9.1 — Sidebar navigation (desktop)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTES.dashboard);
    await page.waitForTimeout(2_000);

    // Sidebar should be visible
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    // Verify all 8 nav items are present
    for (const item of NAV_ITEMS) {
      await expect(sidebar.getByRole("link", { name: item.label })).toBeVisible();
    }

    // Click each nav item and verify URL
    for (const item of NAV_ITEMS) {
      const link = sidebar.getByRole("link", { name: item.label });
      await link.click();
      await page.waitForURL(`**${item.href}`, { timeout: 10_000 });
      expect(page.url()).toContain(item.href);

      // Active item should have font-medium class
      const activeLink = sidebar.getByRole("link", { name: item.label });
      await expect(activeLink).toHaveClass(/font-medium/);
    }
  });

  test("T9.2 — Mobile bottom navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.dashboard);
    await page.waitForTimeout(2_000);

    // Sidebar should be hidden
    const sidebar = page.locator("aside");
    await expect(sidebar).not.toBeVisible();

    // Bottom nav should be visible with first 5 items
    const bottomNav = page.locator("nav.fixed.inset-x-0.bottom-0");
    await expect(bottomNav).toBeVisible();

    const mobileNavItems = NAV_ITEMS.slice(0, 5); // Dashboard, Food Log, Recipes, Checklist, Analytics
    for (const item of mobileNavItems) {
      const link = bottomNav.getByRole("link", { name: item.label });
      await expect(link).toBeVisible();

      // Click and verify
      await link.click();
      await page.waitForURL(`**${item.href}`, { timeout: 10_000 });
      expect(page.url()).toContain(item.href);
    }

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("T9.3 — Theme toggle (dark mode)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTES.dashboard);
    await page.waitForTimeout(2_000);

    // Find theme toggle button (has sr-only "Toggle theme" text)
    const themeToggle = page.getByRole("button", { name: "Toggle theme" }).first();
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const initialClass = await page.locator("html").getAttribute("class");
    const wasDark = initialClass?.includes("dark");

    // Click theme toggle
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Theme should change
    const newClass = await page.locator("html").getAttribute("class");
    const isDark = newClass?.includes("dark");
    expect(isDark).not.toBe(wasDark);

    // Click again to toggle back
    await themeToggle.click();
    await page.waitForTimeout(500);

    const revertedClass = await page.locator("html").getAttribute("class");
    const isRevertedDark = revertedClass?.includes("dark");
    expect(isRevertedDark).toBe(wasDark);
  });
});
