# MacroAI — E2E Testing Plan (Playwright MCP)

## Overview

This document is the **canonical testing plan** for an AI agent using **Playwright MCP** to perform full end-to-end testing against a running MacroAI instance. It covers all 13 routes, 11 API routers, and core user journeys.

- **67 test cases** across **12 suites**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Execution: **sequential** (suites depend on data from earlier suites)

## Quick Links

| Document | Purpose |
|----------|---------|
| [TESTING-PLAN.md](./TESTING-PLAN.md) | This file — overview, prerequisites, execution order |
| [SELECTORS.md](./SELECTORS.md) | Complete selector reference for all UI elements |
| [SUITE-01-AUTH.md](./SUITE-01-AUTH.md) | Authentication & Onboarding (6 tests) |
| [SUITE-02-DASHBOARD.md](./SUITE-02-DASHBOARD.md) | Dashboard (5 tests) |
| [SUITE-03-FOOD-LOG.md](./SUITE-03-FOOD-LOG.md) | Food Logging (11 tests) |
| [SUITE-04-RECIPES.md](./SUITE-04-RECIPES.md) | Recipes (4 tests) |
| [SUITE-05-PROFILE.md](./SUITE-05-PROFILE.md) | Profile & Goal Templates (4 tests) |
| [SUITE-06-ANALYTICS.md](./SUITE-06-ANALYTICS.md) | Analytics & Weight Tracking (7 tests) |
| [SUITE-07-CHECKLIST.md](./SUITE-07-CHECKLIST.md) | Checklist & Streaks (6 tests) |
| [SUITE-08-SETTINGS.md](./SUITE-08-SETTINGS.md) | Settings (8 tests) |
| [SUITE-09-NAVIGATION.md](./SUITE-09-NAVIGATION.md) | Navigation & Theme (3 tests) |
| [SUITE-10-CHAT.md](./SUITE-10-CHAT.md) | AI Chat Smoke Test (4 tests) |
| [SUITE-11-CROSSCUTTING.md](./SUITE-11-CROSSCUTTING.md) | Responsive & Cross-Cutting (4 tests) |
| [SUITE-12-EDGE-CASES.md](./SUITE-12-EDGE-CASES.md) | Data Integrity & Edge Cases (5 tests) |

---

## Prerequisites

Before testing, ensure:

1. **Docker Compose is running:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **Verify services are up:**
   - Frontend: `http://localhost:3000` — should render the login page
   - Backend: `http://localhost:8000/api/docs` — should render Swagger docs

3. **Food database is seeded** — the backend seeds 120+ foods on first start

4. **No existing test user** — Suite 1 creates `testuser@macroai.dev`. If the user already exists from a prior run, either:
   - Drop the MongoDB `users` collection, or
   - Skip T1.1/T1.2 and start from T1.3 (login)

---

## Test Data Constants

Use these values consistently across all suites:

```
TEST_USER_EMAIL    = "testuser@macroai.dev"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_AGE      = 28
TEST_USER_HEIGHT   = 178  (cm)
TEST_USER_WEIGHT   = 82.5 (kg)
TEST_USER_GENDER   = "male"  (lowercase — this is the select value)
TEST_USER_ACTIVITY = "moderate"  (lowercase — this is the select value)
```

---

## Execution Order

**Run suites in this exact order** — later suites depend on data created by earlier ones:

| Order | Suite | Creates / Requires |
|-------|-------|--------------------|
| 1 | Auth & Onboarding | **Creates** test user + completes onboarding |
| 2 | Dashboard | **Requires** logged-in user; verifies empty state |
| 3 | Food Logging | **Creates** food log entries (chicken, rice, eggs, custom food) |
| 4 | Recipes | **Creates** recipe; **requires** food database |
| 5 | Profile & Templates | **Updates** user targets to 1900/170/170/60 |
| 6 | Analytics & Weight | **Requires** food log data; **creates** weight entries |
| 7 | Checklist | **Requires** food log for auto-check items |
| 8 | Settings | Configures AI provider, creates/deletes reminder, **logs out** |
| 9 | Navigation & Theme | **Requires** logged-in user |
| 10 | AI Chat | **Requires** AI provider configured (from Suite 8) |
| 11 | Cross-Cutting | Various UI pattern checks |
| 12 | Edge Cases | Duplicate registration, search edge cases, weight upsert |

---

## Authentication Pattern

Most suites require a logged-in user. Before each test:

1. Navigate to `http://localhost:3000/login`
2. Fill `#email` → `testuser@macroai.dev`
3. Fill `#password` → `TestPass123!`
4. Click button `"Sign in"`
5. Wait for URL to contain `/dashboard`

**Alternative:** If the test context preserves `localStorage`, check for `access_token`:
```js
const hasToken = await page.evaluate(() => !!localStorage.getItem("access_token"));
```

---

## ShadCN/Radix Component Interaction Patterns

This app uses ShadCN UI (built on Radix primitives). These are NOT native HTML elements.

### Select (Dropdown)
ShadCN Select renders as a `<button role="combobox">` trigger + a portal popover.

```
1. Click the trigger: page.locator('[role="combobox"]').click()
2. Click the option:  page.getByRole('option', { name: 'Lunch' }).click()
```

### Dialog
ShadCN Dialog renders in a portal with `role="dialog"`.

```
const dialog = page.locator('[role="dialog"]')
// All assertions inside the dialog should be scoped:
await dialog.getByRole('button', { name: 'Log Food' }).click()
```

### AlertDialog (Confirmation)
Renders with `role="alertdialog"`. Used for all destructive actions.

```
const alert = page.locator('[role="alertdialog"]')
await alert.getByRole('button', { name: 'Delete' }).click()
// OR cancel:
await alert.getByRole('button', { name: 'Cancel' }).click()
```

### Toast (Sonner)
Toast notifications from the `sonner` library.

```
await expect(page.locator('[data-sonner-toast]', { hasText: 'Food logged' }))
  .toBeVisible({ timeout: 10_000 })
```

### Switch (Toggle)
Radix Switch with `role="switch"` and `data-state="checked"` / `data-state="unchecked"`.

```
const toggle = page.locator('[role="switch"]').first()
await toggle.click()
```

---

## Wait Strategies

- **After navigation:** `await page.waitForURL('**/dashboard', { timeout: 15_000 })`
- **After mutation:** Wait for toast: `await expect(toast).toBeVisible({ timeout: 10_000 })`
- **After search:** Debounce is ~300ms — use `await page.waitForTimeout(500)` then assert results
- **For data load:** Wait for a known text element: `await expect(page.getByText('Calories')).toBeVisible({ timeout: 15_000 })`
- **For file download:** `const download = await page.waitForEvent('download', { timeout: 10_000 })`

---

## Viewport Sizes

| Mode | Width | Height |
|------|-------|--------|
| Desktop | 1280 | 800 |
| Mobile | 375 | 667 |

```js
await page.setViewportSize({ width: 375, height: 667 })  // mobile
await page.setViewportSize({ width: 1280, height: 800 })  // desktop
```

---

## File Structure

The Playwright test implementations live in `e2e/tests/`:

```
e2e/
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── docs/                          ← YOU ARE HERE
│   ├── TESTING-PLAN.md
│   ├── SELECTORS.md
│   ├── SUITE-01-AUTH.md
│   ├── SUITE-02-DASHBOARD.md
│   ├── ... (12 suite docs)
└── tests/
    ├── global-setup.ts
    ├── helpers/
    │   ├── constants.ts
    │   └── auth.ts
    ├── 01-auth-onboarding.spec.ts
    ├── 02-dashboard.spec.ts
    ├── ... (12 spec files)
```
