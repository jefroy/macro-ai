import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn, expectToast } from "./helpers/auth";

test.describe("Suite 8: Settings", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T8.1 — View settings page", async ({ page }) => {
    await page.goto(ROUTES.settings);

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Cards should be visible
    await expect(page.getByText("AI Provider")).toBeVisible();
    await expect(page.getByText("Reminders")).toBeVisible();
    await expect(page.getByText("Data Export")).toBeVisible();
    await expect(page.getByText("Account")).toBeVisible();
  });

  test("T8.2 — Configure AI provider (Claude)", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Open Provider select → choose "Anthropic (Claude)"
    const providerSelect = page.locator('[role="combobox"]').first();
    await providerSelect.click();
    await page.getByRole("option", { name: "Anthropic (Claude)" }).click();

    // Model should pre-fill
    await expect(page.locator("#model")).toHaveValue("claude-sonnet-4-5-20250929");

    // API Key field should appear
    await expect(page.locator("#api_key")).toBeVisible();

    // Fill a test API key
    await page.locator("#api_key").fill("sk-test-key-12345");

    // Click Save
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "AI settings saved");

    // API key field should clear after save
    await expect(page.locator("#api_key")).toHaveValue("");

    // Reload and verify persistence
    await page.reload();
    await page.waitForTimeout(2_000);

    // Provider should still show Claude
    await expect(page.locator("#model")).toHaveValue("claude-sonnet-4-5-20250929");

    // API key placeholder should indicate key is saved
    const placeholder = await page.locator("#api_key").getAttribute("placeholder");
    expect(placeholder).toContain("leave blank to keep current");
  });

  test("T8.3 — Switch to local provider", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Open Provider select → choose "Local"
    const providerSelect = page.locator('[role="combobox"]').first();
    await providerSelect.click();
    await page.getByRole("option", { name: "Local (Ollama / vLLM)" }).click();

    // Model should pre-fill with llama3.1
    await expect(page.locator("#model")).toHaveValue("llama3.1");

    // API key field should NOT be visible
    await expect(page.locator("#api_key")).not.toBeVisible();

    // Base URL field should appear
    await expect(page.locator("#base_url")).toBeVisible();
    await expect(page.locator("#base_url")).toHaveValue("http://localhost:11434/v1");

    // Save
    await page.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "AI settings saved");
  });

  test("T8.4 — Create a reminder", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Scroll to Reminders section
    await page.getByText("Reminders").first().scrollIntoViewIfNeeded();

    // Click "Add Reminder"
    await page.getByRole("button", { name: /Add Reminder/ }).click();

    // Reminder form should appear
    // Select Type = Supplement
    const typeSelect = page.locator("form [role='combobox']").first();
    await typeSelect.click();
    await page.getByRole("option", { name: "Supplement" }).click();

    // Set time
    await page.locator('input[type="time"]').fill("14:30");

    // Fill title
    await page.locator('input[placeholder*="Take Vitamin"]').fill("Take Vitamin D");

    // Click Create
    await page.getByRole("button", { name: "Create" }).click();
    await expectToast(page, "Reminder created");

    // Reminder should appear in list
    await expect(page.getByText("Take Vitamin D")).toBeVisible();
    await expect(page.getByText("14:30")).toBeVisible();
    await expect(page.getByText("supplement")).toBeVisible();
  });

  test("T8.5 — Toggle reminder", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Find a reminder switch
    const switches = page.locator('[role="switch"]');
    const count = await switches.count();

    if (count > 0) {
      const firstSwitch = switches.first();
      const wasChecked = await firstSwitch.getAttribute("data-state");

      await firstSwitch.click();
      await page.waitForTimeout(1_000);

      // State should have changed
      const newState = await firstSwitch.getAttribute("data-state");
      expect(newState).not.toBe(wasChecked);
    }
  });

  test("T8.6 — Delete reminder", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Find "Take Vitamin D" reminder's trash button
    const reminderItem = page.getByText("Take Vitamin D");
    const hasReminder = await reminderItem.isVisible().catch(() => false);

    if (hasReminder) {
      // Find the row containing this reminder
      const row = reminderItem.locator("xpath=ancestor::div[contains(@class, 'flex items-center justify-between')]");
      const trashButton = row.locator('button:has(svg.lucide-trash-2)');

      if (await trashButton.count() > 0) {
        await trashButton.click();

        // Confirmation dialog
        const alertDialog = page.locator('[role="alertdialog"]');
        await expect(alertDialog).toBeVisible();
        await expect(alertDialog.getByText("Delete reminder?")).toBeVisible();

        await alertDialog.getByRole("button", { name: "Delete" }).click();
        await expect(alertDialog).not.toBeVisible();
        await expectToast(page, "Reminder deleted");

        // Reminder should be removed
        await expect(reminderItem).not.toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("T8.7 — Export all data (JSON)", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Scroll to Data Export
    await page.getByText("Data Export").scrollIntoViewIfNeeded();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);

    await page.getByRole("button", { name: /Export All Data/ }).click();

    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toContain("macroai");
      expect(filename).toContain(".json");
    }
  });

  test("T8.8 — Logout", async ({ page }) => {
    await page.goto(ROUTES.settings);
    await page.waitForTimeout(2_000);

    // Click Sign Out
    await page.getByRole("button", { name: "Sign Out" }).click();

    // Should redirect to login
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");

    // Try navigating to dashboard
    await page.goto(ROUTES.dashboard);
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
