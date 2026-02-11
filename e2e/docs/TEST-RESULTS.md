# MacroAI E2E Test Results

## Test Environment
- Date: 2026-02-10
- OS: WSL2 Linux
- Browser: Playwright (Chrome) via playwright-cli
- Test Tool: playwright-cli (MCP terminal interface)

---

## Issues Found

### 1. Lightningcss Native Module Missing (RESOLVED)

**Severity:** Was Critical - Now Resolved

**Error:**
```
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
```

**Resolution:** Reinstalled lightningcss with `npm install lightningcss --cpu=x64 --os=linux`

**Status:** ✅ Frontend now loads correctly

---

### 2. Backend Connectivity Issue (BLOCKING)

**Severity:** Critical - API calls failing

**Error (Browser Console):**
```
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:8000/api/v1/auth/register:0
```

**Root Cause:** Backend is running via Windows Python executable (`D:\projects\macro-ai\backend\.venv\Scripts\python.exe`) which listens on Windows localhost. The WSL2 frontend cannot connect to it.

**Process Info:**
```
jj  6904  /init ... /mnt/d/projects/macro-ai/backend/.venv/Scripts/python.exe -m uvicorn app.main:app
```

**Evidence:**
- Backend log shows: `INFO: Uvicorn running on http://0.0.0.0:8000` with Windows paths
- `curl http://localhost:8000` from WSL2 fails with "Connection refused"
- Frontend running in WSL2 cannot reach Windows-bound backend

**Impact:** All API calls fail. User registration, login, data operations impossible.

**Status:** ❌ Tests cannot proceed until backend is accessible from WSL2

---

## Test Progress

### Suite 1: Authentication & Onboarding (6 tests)

| Test | Status | Notes |
|------|--------|-------|
| T1.1: User Registration | ❌ Blocked | Frontend loads, API call fails (ERR_CONNECTION_REFUSED) |
| T1.2: Email Already Registered | ⏸️ Skipped | Backend not accessible |
| T1.3: Valid Login | ⏸️ Skipped | Backend not accessible |
| T1.4: Invalid Login | ⏸️ Skipped | Backend not accessible |
| T1.5: Onboarding Flow | ⏸️ Skipped | Backend not accessible |
| T1.6: Logout | ⏸️ Skipped | Backend not accessible |

### T1.1 User Registration - Attempt Details

**Steps Attempted:**
1. Opened browser: `playwright-cli open http://localhost:3000/register`
2. Page loaded successfully ✅
3. Snapshot showed elements:
   - Email textbox (ref=e12)
   - Password textbox (ref=e15)
   - Create account button (ref=e16)
4. Filled form using `playwright-cli fill`:
   - Email: `testuser@macroai.dev`
   - Password: `TestPass123!`
5. Clicked "Create account" button
6. **Error occurred:** `ERR_CONNECTION_REFUSED` at `http://localhost:8000/api/v1/auth/register`

**Console Errors:**
```
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:8000/api/v1/auth/register:0
```

**Expected Behavior:** Should redirect to `/dashboard` after successful registration
**Actual Behavior:** Stayed on `/register` page, no redirect, API call failed

---

## Server Status

| Service | Status | Port | Notes |
|---------|--------|------|-------|
| Backend (uvicorn) | ⚠️ Running (Windows) | 8000 | Bound to Windows localhost, inaccessible from WSL2 |
| Frontend (Next.js) | ✅ Running | 3000 | Running in WSL2, loads correctly |
| MongoDB | Unknown | - | Not checked (Docker unavailable in WSL2) |

---

## Playwright-CLI Testing Notes

### What Works:
- ✅ Browser automation via playwright-cli
- ✅ Page navigation
- ✅ Element detection via snapshot
- ✅ Form filling with `playwright-cli fill <ref> <value>`
- ✅ Button clicking with `playwright-cli click <ref>`
- ✅ JavaScript evaluation with `playwright-cli eval`
- ✅ Console error inspection

### Commands Used Successfully:
```bash
playwright-cli open http://localhost:3000/register
playwright-cli snapshot                    # Get element refs
playwright-cli fill e12 "test@example.com" # Fill by ref
playwright-cli click e16                   # Click by ref
playwright-cli eval "window.location.href" # Evaluate JS
playwright-cli console error               # Check errors
```

---

## Test Suites Not Yet Run

Due to the backend connectivity issue:

1. ⏸️ Suite 2: Dashboard (5 tests)
2. ⏸️ Suite 3: Food Logging (11 tests)
3. ⏸️ Suite 4: Recipes (4 tests)
4. ⏸️ Suite 5: Profile & Goal Templates (4 tests)
5. ⏸️ Suite 6: Analytics & Weight Tracking (7 tests)
6. ⏸️ Suite 7: Checklist & Streaks (6 tests)
7. ⏸️ Suite 8: Settings (8 tests)
8. ⏸️ Suite 9: Navigation & Theme (3 tests)
9. ⏸️ Suite 10: AI Chat Smoke Test (4 tests)
10. ⏸️ Suite 11: Responsive & Cross-Cutting (4 tests)
11. ⏸️ Suite 12: Data Integrity & Edge Cases (5 tests)

---

## Recommendations

1. **Immediate (Blocking):** Run backend in WSL2 environment or configure Windows backend to accept WSL2 connections:
   - Option A: Use WSL2-native Python with uvicorn
   - Option B: Configure Windows backend to listen on 0.0.0.0 with firewall rules
   - Option C: Use docker-compose.dev.yml for consistent environment

2. **Testing Setup:** The playwright-cli approach works well. Continue using it for E2E testing once backend is accessible.

3. **Documentation:** Add troubleshooting section for WSL2 development environment setup.
