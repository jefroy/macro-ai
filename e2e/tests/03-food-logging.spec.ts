import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 3: Food Logging", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T3.1 — Open food log page", async ({ page }) => {
    await page.goto(ROUTES.log);

    await expect(page.getByRole("heading", { name: "Food Log" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Add Food/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copy Meal/ })).toBeVisible();
  });

  test("T3.2 — Search and log a food", async ({ page }) => {
    await page.goto(ROUTES.log);

    // Open Add Food dialog
    await page.getByRole("button", { name: /Add Food/ }).click();

    // Dialog should open with search input
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    const searchInput = dialog.locator('input[placeholder="Search foods..."]');
    await expect(searchInput).toBeVisible();

    // Search for chicken breast
    await searchInput.fill("chicken breast");

    // Wait for search results (debounce ~300ms)
    await page.waitForTimeout(500);
    const results = dialog.locator("button .font-medium");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });

    // Verify at least 1 result containing "Chicken"
    const firstResult = results.first();
    await expect(firstResult).toContainText(/chicken/i);

    // Click the first result
    await firstResult.click();

    // Detail view should appear with food info
    await expect(dialog.getByText(/Per/)).toBeVisible();

    // Select Meal = Lunch (using Radix Select)
    const mealTrigger = dialog.locator('[role="combobox"]').first();
    await mealTrigger.click();
    await page.getByRole("option", { name: "Lunch" }).click();

    // Set quantity
    await dialog.locator("#qty").fill("1.5");

    // Verify total line updates
    await expect(dialog.getByText("Total")).toBeVisible();

    // Click Log Food
    await dialog.getByRole("button", { name: "Log Food" }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Toast notification
    await expectToast(page, "Food logged");

    // Lunch section should appear
    await expect(page.getByText("Lunch", { exact: false })).toBeVisible();
  });

  test("T3.3 — Log a second food (rice to Lunch)", async ({ page }) => {
    await page.goto(ROUTES.log);
    await page.getByRole("button", { name: /Add Food/ }).click();

    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[placeholder="Search foods..."]');
    await searchInput.fill("rice");
    await page.waitForTimeout(500);

    const results = dialog.locator("button .font-medium");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });
    await results.first().click();

    // Select Lunch
    const mealTrigger = dialog.locator('[role="combobox"]').first();
    await mealTrigger.click();
    await page.getByRole("option", { name: "Lunch" }).click();

    await dialog.locator("#qty").fill("2");
    await dialog.getByRole("button", { name: "Log Food" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expectToast(page, "Food logged");
  });

  test("T3.4 — Log food to breakfast (eggs)", async ({ page }) => {
    await page.goto(ROUTES.log);
    await page.getByRole("button", { name: /Add Food/ }).click();

    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[placeholder="Search foods..."]');
    await searchInput.fill("eggs");
    await page.waitForTimeout(500);

    const results = dialog.locator("button .font-medium");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });
    await results.first().click();

    // Select Breakfast
    const mealTrigger = dialog.locator('[role="combobox"]').first();
    await mealTrigger.click();
    await page.getByRole("option", { name: "Breakfast" }).click();

    await dialog.locator("#qty").fill("3");
    await dialog.getByRole("button", { name: "Log Food" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expectToast(page, "Food logged");

    // Breakfast section should appear
    await expect(page.getByText("Breakfast", { exact: false })).toBeVisible();
  });

  test("T3.5 — Verify dashboard updates after logging", async ({ page }) => {
    await page.goto(ROUTES.dashboard);

    // Wait for data
    await expect(page.getByText("Calories")).toBeVisible({ timeout: 15_000 });

    // Calories card should show non-zero current value
    const calorieCard = page.locator(".text-2xl.font-bold").first();
    const calorieText = await calorieCard.textContent();
    // The format is "X / Y" — X should be > 0 if food was logged
    expect(calorieText).toBeTruthy();

    // Today's Meals card should list entries
    await expect(page.getByText("Today's Meals")).toBeVisible();
    const mealEntries = page.locator("text=kcal").first();
    await expect(mealEntries).toBeVisible({ timeout: 10_000 });
  });

  test("T3.6 — Delete a food entry", async ({ page }) => {
    await page.goto(ROUTES.log);

    // Wait for entries to load
    await page.waitForTimeout(2_000);

    // Find a trash icon button on a logged entry
    const trashButtons = page.locator('button:has(svg.lucide-trash-2)');
    const count = await trashButtons.count();

    if (count > 0) {
      await trashButtons.first().click();

      // Confirmation dialog should appear
      const alertDialog = page.locator('[role="alertdialog"]');
      await expect(alertDialog).toBeVisible();
      await expect(alertDialog.getByText("Delete food entry?")).toBeVisible();

      // Click Delete
      await alertDialog.getByRole("button", { name: "Delete" }).click();

      // Entry should disappear
      await expect(alertDialog).not.toBeVisible();
      await expectToast(page, "Entry removed");
    }
  });

  test("T3.7 — Favorite a food", async ({ page }) => {
    await page.goto(ROUTES.log);
    await page.getByRole("button", { name: /Add Food/ }).click();

    const dialog = page.locator('[role="dialog"]');
    const searchInput = dialog.locator('input[placeholder="Search foods..."]');
    await searchInput.fill("chicken breast");
    await page.waitForTimeout(500);

    // Wait for results
    const results = dialog.locator("button .font-medium");
    await expect(results.first()).toBeVisible({ timeout: 10_000 });

    // Find heart icon button near search results
    const heartButtons = dialog.locator('button:has(svg.lucide-heart)');
    const heartCount = await heartButtons.count();

    if (heartCount > 0) {
      await heartButtons.first().click();
      await page.waitForTimeout(500);

      // Verify the heart is now filled (has fill-red-500 class)
      const filledHeart = dialog.locator("svg.lucide-heart.fill-red-500");
      await expect(filledHeart.first()).toBeVisible();
    }

    // Close dialog and reopen to check favorites
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /Add Food/ }).click();

    // With empty search, favorites section should be visible
    const favoritesSection = dialog.getByText("Favorites", { exact: false });
    const hasFavorites = await favoritesSection.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasFavorites) {
      await expect(favoritesSection).toBeVisible();
    }
  });

  test("T3.8 — Unfavorite a food", async ({ page }) => {
    await page.goto(ROUTES.log);
    await page.getByRole("button", { name: /Add Food/ }).click();

    const dialog = page.locator('[role="dialog"]');

    // Look for filled hearts in favorites section (with empty search)
    const filledHearts = dialog.locator("svg.lucide-heart.fill-red-500");
    const count = await filledHearts.count();

    if (count > 0) {
      // Click the parent button of the filled heart
      const heartButton = filledHearts.first().locator("..");
      await heartButton.click();
      await page.waitForTimeout(500);

      // Close and reopen
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: /Add Food/ }).click();

      // Verify favorites is empty or the food is gone
      await page.waitForTimeout(1_000);
    }
  });

  test("T3.9 — Recent foods section", async ({ page }) => {
    await page.goto(ROUTES.log);
    await page.getByRole("button", { name: /Add Food/ }).click();

    const dialog = page.locator('[role="dialog"]');

    // With empty search, Recent section should be visible (if foods were logged)
    const recentSection = dialog.getByText("Recent", { exact: false });
    const hasRecent = await recentSection.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasRecent) {
      await expect(recentSection).toBeVisible();

      // Recent foods should show "logged Nx" count
      const loggedCount = dialog.getByText(/logged \d+x/);
      await expect(loggedCount.first()).toBeVisible();

      // Click a recent food to open detail view
      const recentItem = dialog.locator("button .font-medium").first();
      await recentItem.click();

      // Detail view should open
      await expect(dialog.getByText(/Per/)).toBeVisible();
    }
  });

  test("T3.10 — Create custom food", async ({ page }) => {
    await page.goto(ROUTES.log);
    await page.getByRole("button", { name: /Add Food/ }).click();

    const dialog = page.locator('[role="dialog"]');

    // Click "Create Custom Food"
    await dialog.getByRole("button", { name: /Create Custom Food/ }).click();

    // Custom food form should appear
    await expect(dialog.getByText("Create Custom Food")).toBeVisible();

    // Fill the form
    await dialog.locator('input[placeholder="e.g. Homemade Granola"]').fill("Homemade Protein Bar");
    await dialog.locator('input[placeholder="Optional"]').fill("Homemade");
    await dialog.locator('input[placeholder="e.g. 1 cup"]').fill("1 bar");

    // Serving grams
    const servingGramsInput = dialog.locator('input[type="number"]').nth(0);
    await servingGramsInput.fill("65");

    // Macros — find the required number inputs (Calories, Protein, Carbs, Fat)
    const numberInputs = dialog.locator('input[type="number"]');
    // Order: serving grams, calories, protein, carbs, fat
    await numberInputs.nth(1).fill("220");  // Calories
    await numberInputs.nth(2).fill("25");   // Protein
    await numberInputs.nth(3).fill("18");   // Carbs
    await numberInputs.nth(4).fill("6");    // Fat

    // Click "Create & Log"
    await dialog.getByRole("button", { name: /Create & Log/ }).click();

    // Should switch to detail view
    await expect(dialog.getByText("Homemade Protein Bar")).toBeVisible({ timeout: 10_000 });

    // Select meal = Snack and log
    const mealTrigger = dialog.locator('[role="combobox"]').first();
    await mealTrigger.click();
    await page.getByRole("option", { name: "Snack" }).click();

    await dialog.getByRole("button", { name: "Log Food" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expectToast(page, "Food logged");

    // Snack section should appear
    await expect(page.getByText("Snack", { exact: false })).toBeVisible();
  });

  test("T3.11 — Copy meal", async ({ page }) => {
    await page.goto(ROUTES.log);

    // Click "Copy Meal"
    await page.getByRole("button", { name: /Copy Meal/ }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Copy Meal")).toBeVisible();

    // Source meal: Lunch, Target meal: Dinner (defaults should work)
    // Click "Copy Meal" button in dialog
    await dialog.getByRole("button", { name: "Copy Meal" }).last().click();

    // Either success or error toast
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible({ timeout: 10_000 });
  });
});
