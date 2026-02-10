# MacroAI — E2E Testing Plan (Playwright CLI)

## Overview

This document is the **canonical testing plan** for performing full end-to-end testing against a running MacroAI instance using **playwright-cli** (the terminal interface to Playwright MCP). It covers all 13 routes, 11 API routers, and core user journeys.

- **67 test cases** across **12 suites**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Execution: **sequential** (suites depend on data from earlier suites)

## What is playwright-cli?

`playwright-cli` is a command-line tool that provides terminal access to Playwright MCP browser automation capabilities. It allows running browser tests interactively or via scripts without writing TypeScript/JavaScript test files.

**Key advantages:**
- No need to write/maintain TypeScript test files
- Can be run directly from terminal or shell scripts
- Supports interactive testing sessions
- All browser automation: navigation, form filling, clicking, screenshots, assertions via JavaScript eval

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

5. **playwright-cli installed** — Run `playwright-cli --version` to verify

---

## Playwright-CLI Quick Reference

### Starting a Browser Session

```bash
# Open browser (defaults to chromium)
playwright-cli open http://localhost:3000

# Open with specific session name (useful for multiple sessions)
playwright-cli -s=test-session open http://localhost:3000
```

### Common Commands

| Category | Command | Description |
|----------|---------|-------------|
| **Navigation** | `goto <url>` | Navigate to URL |
| | `go-back` | Go back in history |
| | `reload` | Reload current page |
| **Interaction** | `click <ref>` | Click element (use CSS selector or ref from snapshot) |
| | `type <text>` | Type text into focused element |
| | `fill <ref> <text>` | Fill text into specific element |
| | `select <ref> <value>` | Select dropdown option |
| | `check <ref>` / `uncheck <ref>` | Toggle checkboxes |
| **Inspection** | `snapshot` | Get page snapshot with element refs |
| | `screenshot [ref]` | Take screenshot of page or element |
| **Scripting** | `eval <js> [ref]` | Evaluate JavaScript (assertions, checks) |
| | `run-code <code>` | Run multi-line Playwright code |
| **Session** | `close` | Close browser |
| | `list` | List all sessions |
| | `close-all` | Close all sessions |

### Element References

After running `snapshot`, elements get numeric refs like `0`, `1`, `2`:

```bash
playwright-cli snapshot
# Output shows: [0] button "Sign in", [1] input#email, etc.

playwright-cli click 0        # Click by ref
playwright-cli fill 1 "test@example.com"  # Fill by ref
```

Or use CSS selectors directly:

```bash
playwright-cli click "#submit-button"
playwright-cli fill "#email" "test@example.com"
```

### Assertions via eval

The `eval` command runs JavaScript and returns the result. Use it for assertions:

```bash
# Check if element exists
playwright-cli eval "!!document.querySelector('#dashboard')"

# Check text content
playwright-cli eval "document.querySelector('h1').textContent"

# Check localStorage
playwright-cli eval "localStorage.getItem('access_token')"

# Wait for element (returns true when found)
playwright-cli eval "!!document.querySelector('[data-sonner-toast]')"
```

### Wait Strategies

```bash
# Simple wait (JavaScript sleep via eval)
playwright-cli eval "new Promise(r => setTimeout(r, 1000))"

# Poll for element (run in loop until true)
playwright-cli eval "!!document.querySelector('#loading')" && sleep 1
```

### Sessions

```bash
# List active sessions
playwright-cli list

# Close current session
playwright-cli close

# Close all sessions
playwright-cli close-all
```

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

Most suites require a logged-in user. Before each test, use this sequence:

### Using playwright-cli:

```bash
# Navigate to login
playwright-cli goto http://localhost:3000/login

# Fill credentials (using CSS selectors)
playwright-cli fill "#email" "testuser@macroai.dev"
playwright-cli fill "#password" "TestPass123!"

# Click sign in (by text or selector)
playwright-cli click "button[type='submit']"
# OR get ref from snapshot first
playwright-cli snapshot
playwright-cli click <ref-for-sign-in-button>

# Verify login succeeded - check URL contains dashboard
playwright-cli eval "window.location.href.includes('dashboard')"
```

### Saving Session for Reuse

To avoid logging in for every test suite:

```bash
# After successful login, save session state
playwright-cli state-save /tmp/macroai-test-session.json

# In subsequent tests, restore before starting
playwright-cli state-load /tmp/macroai-test-session.json
```

### Checking Auth Status

```bash
# Check if logged in via localStorage
playwright-cli eval "!!localStorage.getItem('access_token')"
# Returns: true (logged in) or false (not logged in)

# Get current user info from localStorage
playwright-cli eval "JSON.parse(localStorage.getItem('user') || '{}')"
```

---

## ShadCN/Radix Component Interaction Patterns

This app uses ShadCN UI (built on Radix primitives). These are NOT native HTML elements.

### Select (Dropdown)
ShadCN Select renders as a `<button role="combobox">` trigger + a portal popover.

**Using playwright-cli:**
```bash
# Click the combobox to open dropdown
playwright-cli click "[role='combobox']"

# Wait for dropdown to render, then click option
playwright-cli eval "new Promise(r => setTimeout(r, 200))"
playwright-cli click "[role='option']:has-text('Lunch')"
```

### Dialog
ShadCN Dialog renders in a portal with `role="dialog"`.

**Using playwright-cli:**
```bash
# Open dialog (click trigger)
playwright-cli click "text='Add Food'"

# Interact with dialog elements - scope to dialog
playwright-cli click "[role='dialog'] button:has-text('Log Food')"

# Or click by ref from snapshot
playwright-cli snapshot
# Look for dialog elements in output
playwright-cli click <ref-for-log-food-button>
```

### AlertDialog (Confirmation)
Renders with `role="alertdialog"`. Used for all destructive actions.

**Using playwright-cli:**
```bash
# Confirm deletion
playwright-cli click "[role='alertdialog'] button:has-text('Delete')"

# Cancel
playwright-cli click "[role='alertdialog'] button:has-text('Cancel')"
```

### Toast (Sonner)
Toast notifications from the `sonner` library.

**Using playwright-cli:**
```bash
# Wait for and verify toast
playwright-cli eval "new Promise(r => setTimeout(r, 500))"
playwright-cli eval "!!document.querySelector('[data-sonner-toast]')"

# Get toast text content
playwright-cli eval "document.querySelector('[data-sonner-toast]')?.textContent"
```

### Switch (Toggle)
Radix Switch with `role="switch"` and `data-state="checked"` / `data-state="unchecked"`.

**Using playwright-cli:**
```bash
# Toggle switch
playwright-cli click "[role='switch']"

# Check state
playwright-cli eval "document.querySelector('[role=\"switch\"]')?.dataset.state"
# Returns: "checked" or "unchecked"
```

---

## Wait Strategies

**Using playwright-cli:**

| Scenario | Command |
|----------|---------|
| **After navigation** | `playwright-cli eval "new Promise(r => setTimeout(r, 1000))"` then check URL |
| **After mutation** | `playwright-cli eval "!!document.querySelector('[data-sonner-toast]')"` (poll until true) |
| **After search** | `playwright-cli eval "new Promise(r => setTimeout(r, 500))"` (debounce is ~300ms) |
| **For data load** | `playwright-cli eval "!!document.querySelector('text=Calories')"` |
| **For element visible** | `playwright-cli eval "!!document.querySelector('.loading') === false"` |

**Helper function for waiting (via run-code):**
```bash
playwright-cli run-code "
while (!document.querySelector('[data-sonner-toast]')) {
  await new Promise(r => setTimeout(r, 100));
}
console.log('Toast appeared');
"
```

---

## Viewport Sizes

| Mode | Width | Height |
|------|-------|--------|
| Desktop | 1280 | 800 |
| Mobile | 375 | 667 |

**Using playwright-cli:**
```bash
# Mobile viewport
playwright-cli resize 375 667

# Desktop viewport
playwright-cli resize 1280 800
```

---

## File Structure

The test documentation lives in `e2e/docs/`:

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

---

## Example: Complete Test Workflow

Here's a complete example of testing user registration using playwright-cli:

```bash
#!/bin/bash
# Suite 1.1: User Registration

# Start browser session
playwright-cli open http://localhost:3000/register

# Take initial screenshot
playwright-cli screenshot /tmp/test-01-initial.png

# Fill registration form
playwright-cli fill "#email" "testuser@macroai.dev"
playwright-cli fill "#password" "TestPass123!"
playwright-cli fill "#confirmPassword" "TestPass123!"

# Submit form
playwright-cli click "button[type='submit']"

# Wait for navigation - should redirect to onboarding
playwright-cli eval "new Promise(r => setTimeout(r, 2000))"

# Verify we're on onboarding page
ONBOARDING=$(playwright-cli eval "window.location.href.includes('onboarding')")
if [ "$ONBOARDING" != "true" ]; then
  echo "FAIL: Not redirected to onboarding"
  playwright-cli screenshot /tmp/test-01-fail.png
  exit 1
fi

# Verify toast notification
TOAST=$(playwright-cli eval "document.querySelector('[data-sonner-toast]')?.textContent.includes('Registration successful')")
if [ "$TOAST" != "true" ]; then
  echo "FAIL: No success toast"
  exit 1
fi

echo "PASS: User registration successful"
playwright-cli screenshot /tmp/test-01-pass.png
playwright-cli close
```

---

## Running Test Suites Interactively

For interactive testing (exploring the UI while developing tests):

```bash
# Start session
playwright-cli -s=macro-test open http://localhost:3000

# ... perform actions ...

# Take snapshot to see element refs
playwright-cli snapshot

# Use refs for clicking
playwright-cli click 5

# Eval to check state
playwright-cli eval "document.title"

# Keep session open for inspection
# Close when done:
playwright-cli close
```
