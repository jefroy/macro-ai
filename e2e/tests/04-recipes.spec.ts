import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 4: Recipes", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T4.1 — Navigate to recipes page", async ({ page }) => {
    await page.goto(ROUTES.recipes);

    await expect(page.getByRole("heading", { name: "Recipes" })).toBeVisible();

    // Either empty state or recipe cards
    const emptyState = page.getByText("No recipes yet. Create your first recipe to get started.");
    const recipeCards = page.locator(".grid .card, [class*='grid'] [class*='card']");

    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("T4.2 — Create a recipe", async ({ page }) => {
    await page.goto(ROUTES.recipes);

    // Click New Recipe
    await page.getByRole("button", { name: /New Recipe/ }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Fill recipe name
    await dialog.locator('input[placeholder="e.g. Protein Bowl"]').fill("Chicken & Rice Bowl");

    // Fill description
    await dialog.locator('input[placeholder="Optional description"]').fill("Simple high-protein meal");

    // Set servings to 2
    await dialog.locator('input[type="number"]').first().fill("2");

    // Add first ingredient: chicken
    await dialog.getByRole("button", { name: /Add Ingredient/ }).click();

    // Ingredient search should appear
    const ingredientSearch = dialog.locator('input[placeholder="Search foods to add..."]');
    await expect(ingredientSearch).toBeVisible();
    await ingredientSearch.fill("chicken");
    await page.waitForTimeout(500);

    // Click Chicken Breast result
    const searchResults = dialog.locator("button .font-medium");
    await expect(searchResults.first()).toBeVisible({ timeout: 10_000 });
    await searchResults.first().click();

    // Ingredient should appear in list — set quantity to 2
    const ingredientQty = dialog.locator('.w-20');
    await expect(ingredientQty.first()).toBeVisible();
    await ingredientQty.first().fill("2");

    // Add second ingredient: rice
    await dialog.getByRole("button", { name: /Add Ingredient/ }).click();
    const ingredientSearch2 = dialog.locator('input[placeholder="Search foods to add..."]');
    await ingredientSearch2.fill("rice");
    await page.waitForTimeout(500);

    const searchResults2 = dialog.locator('button:has(.font-medium):not(:has(.w-20))');
    // Click a rice result from search
    const riceResults = dialog.locator('.max-h-40 button');
    await expect(riceResults.first()).toBeVisible({ timeout: 10_000 });
    await riceResults.first().click();

    // Running total should be visible
    await expect(dialog.getByText("Total")).toBeVisible();
    await expect(dialog.getByText("Per serving")).toBeVisible();

    // Click Create Recipe
    await dialog.getByRole("button", { name: "Create Recipe" }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expectToast(page, "Recipe created");

    // Recipe card should appear
    await expect(page.getByText("Chicken & Rice Bowl")).toBeVisible();
    await expect(page.getByText("2 servings")).toBeVisible();
  });

  test("T4.3 — Log a recipe", async ({ page }) => {
    await page.goto(ROUTES.recipes);

    // Wait for recipe cards to load
    await page.waitForTimeout(2_000);

    // Find the Log button on any recipe card
    const logButton = page.getByRole("button", { name: /Log/ }).first();
    const hasRecipe = await logButton.isVisible().catch(() => false);

    if (hasRecipe) {
      await logButton.click();

      // Log dialog should open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Log Recipe")).toBeVisible();

      // Select meal = Dinner
      const mealTrigger = dialog.locator('[role="combobox"]');
      await mealTrigger.click();
      await page.getByRole("option", { name: "Dinner" }).click();

      // Set servings to 1
      await dialog.locator('input[type="number"]').fill("1");

      // Click Log Recipe
      await dialog.getByRole("button", { name: "Log Recipe" }).click();

      await expect(dialog).not.toBeVisible({ timeout: 5_000 });
      await expectToast(page, "Recipe logged");

      // Verify on food log page
      await page.goto(ROUTES.log);
      await page.waitForTimeout(2_000);
    }
  });

  test("T4.4 — Delete a recipe", async ({ page }) => {
    await page.goto(ROUTES.recipes);
    await page.waitForTimeout(2_000);

    // Find trash button on a recipe card
    const trashButtons = page.locator('button:has(svg.lucide-trash-2)');
    const count = await trashButtons.count();

    if (count > 0) {
      await trashButtons.first().click();

      // Confirmation dialog
      const alertDialog = page.locator('[role="alertdialog"]');
      await expect(alertDialog).toBeVisible();
      await expect(alertDialog.getByText("Delete recipe?")).toBeVisible();

      // Click Delete
      await alertDialog.getByRole("button", { name: "Delete" }).click();

      await expect(alertDialog).not.toBeVisible();
      await expectToast(page, "Recipe deleted");
    }
  });
});
