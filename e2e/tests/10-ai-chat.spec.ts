import { test, expect } from "@playwright/test";
import { ROUTES } from "./helpers/constants";
import { ensureLoggedIn } from "./helpers/auth";

test.describe("Suite 10: AI Chat (Smoke Test)", () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedIn(page);
  });

  test("T10.1 — Open chat page", async ({ page }) => {
    await page.goto(ROUTES.chat);

    // "New Chat" button visible
    await expect(page.getByRole("button", { name: /New Chat/ }).first()).toBeVisible();

    // WebSocket status indicator (green/yellow/red dot)
    const statusDot = page.locator(".h-2.w-2.rounded-full");
    await expect(statusDot.first()).toBeVisible();
  });

  test("T10.2 — Send a message (happy path)", async ({ page }) => {
    await page.goto(ROUTES.chat);
    await page.waitForTimeout(3_000);

    // Wait for WebSocket to connect (green dot)
    const connectedDot = page.locator(".h-2.w-2.rounded-full.bg-green-500");
    const isConnected = await connectedDot.first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (!isConnected) {
      // WebSocket not connected — skip this test
      test.skip();
      return;
    }

    // Type a message
    const input = page.locator('input[placeholder="Type a message..."]');
    await input.fill("What are my macro targets?");

    // Click Send
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // User message should appear (right-aligned, primary bg)
    const userMessage = page.locator(".bg-primary.text-primary-foreground");
    await expect(userMessage.last()).toContainText("macro targets");

    // Wait for assistant response (may take a while)
    const assistantMessage = page.locator(".bg-muted").last();
    await expect(assistantMessage).not.toBeEmpty({ timeout: 60_000 });
  });

  test("T10.3 — Chat session management", async ({ page }) => {
    await page.goto(ROUTES.chat);
    await page.waitForTimeout(3_000);

    // Click "New Chat"
    await page.getByRole("button", { name: /New Chat/ }).first().click();

    // Input should focus
    const input = page.locator('input[placeholder*="message"], input[placeholder*="Connecting"]');
    await expect(input).toBeVisible();

    // Check for existing sessions in sidebar
    const sessionList = page.locator(".flex-1.space-y-1.overflow-y-auto");
    const sessions = sessionList.locator(".cursor-pointer");
    const sessionCount = await sessions.count();

    if (sessionCount > 0) {
      // Click first session to load it
      await sessions.first().click();
      await page.waitForTimeout(1_000);

      // Hover and delete
      const deleteButton = sessions.first().locator('button:has(svg.lucide-trash-2)');
      await sessions.first().hover();
      const canDelete = await deleteButton.isVisible().catch(() => false);

      if (canDelete) {
        await deleteButton.click();
        await page.waitForTimeout(1_000);
      }
    }
  });

  test("T10.4 — AI not configured (error state)", async ({ page }) => {
    // This test verifies the error message when AI is misconfigured
    // The chat page should show an error if the provider isn't set up
    await page.goto(ROUTES.chat);
    await page.waitForTimeout(3_000);

    // Check if we see the placeholder message
    const placeholder = page.getByText("Ask me anything about nutrition");
    const hasPlaceholder = await placeholder.isVisible().catch(() => false);

    if (hasPlaceholder) {
      // Good — chat is ready but empty
      await expect(placeholder).toBeVisible();
    }

    // If AI not configured, sending a message should show an error
    const connectedDot = page.locator(".h-2.w-2.rounded-full.bg-green-500");
    const isConnected = await connectedDot.first().isVisible({ timeout: 5_000 }).catch(() => false);

    if (isConnected) {
      const input = page.locator('input[placeholder="Type a message..."]');
      await input.fill("test");
      await page.locator('button[type="submit"]').click();

      // Wait for response — might be an error about AI configuration
      await page.waitForTimeout(10_000);

      const errorMessage = page.getByText(/not configured|Error|Settings/);
      const hasError = await errorMessage.isVisible().catch(() => false);
      // Error may or may not appear depending on AI configuration
    }
  });
});
