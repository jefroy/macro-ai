# MacroAI — Progress Tracker

> Last updated: 2026-02-11 (Docker & Deployment fixed)

## Current Phase: Phase 4 Complete + Docker Production-Ready

Target: **v1.0.0** — Production-ready with food UX improvements, recipes, export, and UI polish

---

## Milestone Progress

### Week 1-2: Project Scaffolding ✅

- [x] Monorepo structure (frontend + backend)
- [x] Git init, .gitignore, .env.example
- [x] FastAPI backend skeleton (config, database, redis, main app)
- [x] Auth service (JWT, bcrypt, register/login/refresh)
- [x] User model + schemas (profile, targets)
- [x] API v1 router (auth + users endpoints)
- [x] Next.js 16 frontend (Turbopack, Tailwind 4, ShadCN UI)
- [x] Auth pages (login, register)
- [x] App shell (sidebar nav, mobile bottom nav, layout)
- [x] Page stubs (dashboard, log, analytics, chat, profile, settings)
- [x] API client (ky) + auth store (Zustand) + query provider (TanStack)
- [x] Docker Compose (prod + dev) with MongoDB 7 + Redis 7
- [x] Dockerfiles (multi-stage frontend, backend)
- [x] MongoDB init script (users collection, email index)
- [x] PRD and Architecture docs

### Week 3: Auth + Profile + Onboarding

- [x] Wire login/register pages to backend API
- [x] Auth middleware (protected routes, token refresh on 401)
- [x] Active nav link highlighting (sidebar + mobile)
- [x] Profile page wired to GET/PATCH /me/profile
- [x] Targets page wired to GET/PATCH /me/targets
- [x] Onboarding wizard (3-step: profile → goal → review targets)
- [x] Auto-calculate targets from profile (TDEE via Mifflin-St Jeor)
- [x] Dashboard shows real user targets from API
- [x] Single-user mode (skip auth when enabled)

### Week 4: Food Database + Search ✅

- [x] Food model + CRUD endpoints (search, get, create)
- [x] Curated seed data (120+ common foods with macros)
- [x] Food search API (MongoDB text index, pagination)
- [x] Custom food creation endpoint
- [x] Food search UI (dialog with search, select food, set quantity/meal)
- [x] Custom food form (UI — create custom food in log dialog)
- [x] Redis caching for popular food searches

### Week 5: Food Logging + Dashboard ✅

- [x] FoodLog model + CRUD endpoints (log, list by date, totals, delete)
- [x] Log food to meal (breakfast/lunch/dinner/snack)
- [x] Delete log entries
- [x] Daily macro totals aggregation endpoint
- [x] Dashboard: live macro progress bars (real data from API)
- [x] Dashboard: today's meal log with entries
- [x] Food log page: entries grouped by meal with calorie badges
- [x] Recent foods list (quick re-log)

### Week 6: AI Integration + Chat ✅

- [x] LiteLLM integration service (ChatLiteLLM factory with BYO provider support)
- [x] AI provider settings (API key encrypted at rest, model selection, provider picker)
- [x] Chat model + message history (LangGraph checkpointer persists to MongoDB)
- [x] Chat API with streaming (WebSocket /chat/ws with token auth)
- [x] LangGraph ReAct agent (8 tools: profile, food log, totals, averages, food search, log food, update targets)
- [x] Chat UI with streaming responses (token-by-token, auto-scroll)
- [x] Chat session management (create/load/delete sessions, session sidebar)
- [x] System prompt with nutrition expertise
- [x] Tool call guardrails (user_id injected server-side, 20-call limit per turn)

### Week 7: Weight Tracking + Analytics ✅

- [x] Weight model + CRUD endpoints (log, list, trend with rolling average)
- [x] Weight log UI (input form + trend line chart)
- [x] Rolling average calculation (7-day average, 30-day change)
- [x] Weekly macro bar chart (Recharts, grouped by protein/carbs/fat)
- [x] Date range selector for analytics (7/14/30/90 days)
- [x] Calorie trend line chart
- [x] Macro breakdown donut chart (latest day split)
- [x] Date-range food log totals API endpoint (/food-log/range)
- [x] Weight trend tool added to AI agent (get_weight_trend)

### Week 8: PWA + Polish + Release ✅

- [x] PWA manifest (manifest.json, icons, meta tags, viewport config)
- [ ] Serwist service worker (deferred — app works online-first)
- [ ] Offline support (deferred)
- [x] Loading states and skeleton screens (app + auth route groups)
- [x] Error boundaries (global + app-level error.tsx)
- [x] 404 not-found page
- [x] Auth guard loading spinner (replaces blank screen)
- [x] Toast notifications (sonner wired throughout all mutations)
- [x] Mobile responsiveness (bottom nav, responsive grid layouts)
- [ ] End-to-end testing (deferred)
- [x] API documentation (FastAPI auto-generated at /api/docs and /api/redoc)
- [x] README update with features, setup, API endpoints, project structure
- [x] Cleaned up default Next.js placeholder files
- [x] Tag v0.1.0 release

---

## Phase 2: Intelligence (Weeks 9-12) ✅

### Week 9: Extended Nutrient Tracking + Alerts ✅

- [x] Extended FoodLog model with sugar_g, sodium_mg, saturated_fat_g
- [x] Extended all backend schemas (FoodLogEntry, DailyTotals, LogFoodRequest)
- [x] Extended FoodResponse + CreateFoodRequest with new nutrients
- [x] Extended frontend types (FoodItem, FoodLogEntry, DailyTotals, LogFoodRequest)
- [x] Food log page passes extended nutrients when logging
- [x] Nutrient alerts service (sodium >2300mg, sugar >50g, sat fat >20g, fiber <25g)
- [x] GET /food-log/alerts endpoint
- [x] Dashboard: micronutrient progress bars (fiber, sugar, sodium, sat fat)
- [x] Dashboard: nutrient alerts card with warning/info severity
- [x] AI agent: get_nutrient_alerts tool, extended get_daily_totals + log_food with new nutrients
- [x] AI agent: search results now include extended nutrients

### Week 10: NLP Food Logging + AI Meal Recommendations ✅

- [x] quick_log AI tool (natural language food logging: "200g chicken breast for lunch")
- [x] Quantity/unit parsing (g, kg, oz, servings, trailing patterns)
- [x] Food database fuzzy matching + automatic macro calculation
- [x] suggest_meals AI tool (finds foods fitting remaining calorie/protein budget)
- [x] Updated system prompt with new tool guidance

### Week 11-12: Reports + Daily Insights + Expanded Analytics ✅

- [x] Daily insights service (rule-based: calorie pacing, protein check, fiber, over-eating, meal balance)
- [x] GET /food-log/insights endpoint
- [x] Dashboard: daily insights card with success/warning/info icons
- [x] Weekly report endpoint (GET /reports/weekly: 7-day breakdown, averages, target adherence, highlights, weight change)
- [x] get_weekly_report AI tool
- [x] Analytics: weekly summary card with target adherence badges
- [x] Analytics: micronutrient heatmap (fiber, sugar, sodium, sat fat — color-coded by daily limit)
- [x] Frontend API clients for reports and insights

## Phase 3: Accountability (Weeks 13-16) ✅

### Week 13: Reminder System ✅

- [x] Reminder model (type, title, time, days, enabled)
- [x] Reminder CRUD endpoints (list, create, update, delete, toggle)
- [x] Reminder management UI in Settings (create form, toggle switches, delete)
- [x] Reminder types: meal, supplement, hydration, custom

### Week 14: Daily Checklist ✅

- [x] ChecklistItem model (user_id, date, title, type: auto/custom, auto-check fields)
- [x] Checklist API (GET auto-generates defaults, toggle custom items, add custom, delete)
- [x] Auto-check logic: protein target, calorie target, 3+ meals logged, 25g+ fiber
- [x] Auto-check runs on every GET (evaluates food log totals in real-time)
- [x] Checklist page with progress bar, auto/custom items, add custom task form
- [x] Checklist widget on dashboard with completion bar and streak badge
- [x] Checklist nav item added to sidebar + mobile nav

### Week 15: Goal Templates ✅

- [x] Pre-built templates: Fat Loss, Lean Bulk, Maintenance, Health Optimization
- [x] Each template: TDEE multiplier, protein/kg, fat %, suggested foods, tips
- [x] GET /templates, POST /templates/{id}/apply (auto-calculates from user profile)
- [x] Template cards on Profile page with one-click "Apply" to set targets
- [x] Mifflin-St Jeor TDEE calculation with activity multiplier

### Week 16: Streak Tracking ✅

- [x] GET /checklist/streak (consecutive days with >= 80% checklist completion)
- [x] Streak badge on checklist page (flame icon + day count)
- [x] Streak badge on dashboard checklist widget
- [x] Streak display in analytics weekly summary

## Phase 4: Polish & Scale (Weeks 17-20) ✅

### Week 17: Food UX Improvements ✅

- [x] GET /foods/recent — aggregation pipeline returning top 15 frequently logged foods
- [x] Recent foods section in log dialog (shown when search is empty, click to log)
- [x] User.favorite_foods field (list of food_id strings)
- [x] POST /foods/{id}/favorite — toggle favorite
- [x] GET /foods/favorites — list favorite foods
- [x] Heart icon on search results to toggle favorites
- [x] Favorites section in log dialog (above Recent when no search query)
- [x] POST /food-log/copy — copy all entries from one meal/date to another
- [x] Copy Meal dialog (source date/meal → target date/meal)
- [x] Custom food form in log dialog (create food inline, auto-select for logging)
- [x] Frontend API functions: getRecentFoods, getFavoriteFoods, toggleFavoriteFood, createFood, copyMeal

### Week 18: Recipe Builder ✅

- [x] Recipe model (user_id, name, description, servings, ingredients[], total, per_serving)
- [x] RecipeIngredient embedded model (food_id, food_name, quantity, serving_label, macros)
- [x] NutrientTotals model (auto-calculated from ingredients / servings)
- [x] Recipe registered in database.py document_models
- [x] Full CRUD API: GET /recipes, GET /recipes/{id}, POST /recipes, PATCH /recipes/{id}, DELETE /recipes/{id}
- [x] POST /recipes/{id}/log — log recipe as food log entry with meal/servings
- [x] Recipes router registered in v1_router
- [x] Frontend: recipes API client (listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe, logRecipe)
- [x] Recipes page: recipe cards with per-serving macros, create dialog with food search + running totals
- [x] Log recipe dialog (meal + servings selector)
- [x] "Recipes" nav item added to sidebar (BookOpen icon)
- [x] ShadCN: tabs + textarea components added

### Week 19: Export & Data ✅

- [x] GET /reports/export?start=&end=&format=csv — CSV export with StreamingResponse
- [x] CSV columns: Date, Meal, Food, Serving, Quantity, Calories, Protein, Carbs, Fat, Fiber, Sugar, Sodium, Sat Fat
- [x] GET /users/me/export — full JSON data export (profile, food logs, weight, recipes, reminders, checklist)
- [x] Frontend: exportFoodLog() with blob download, exportAllData() with blob download
- [x] Analytics page: "Export Data" card with CSV download button (date range from selector)
- [x] Settings page: "Data Export" card with full JSON export button

### Week 20: Polish & UX ✅

- [x] ShadCN: skeleton, alert-dialog components added
- [x] Dashboard: skeleton loading cards while data fetches
- [x] ErrorCard component (reusable error state with retry button)
- [x] ConfirmDialog component (reusable AlertDialog wrapper for destructive actions)
- [x] Confirm dialogs on: delete food entry, delete reminder, delete recipe, delete weight entry
- [x] Dark/light mode: next-themes installed, ThemeProvider wrapping app
- [x] Theme toggle (Sun/Moon) in sidebar header + mobile header
- [x] Mobile heatmap fix: table hidden on mobile, stacked card view for small screens
- [x] AI tool update: search_food_database now accepts user_id, marks [FAVORITE] foods in results
- [x] AI prompt update: mention favorites preference in system prompt

## Docker & Deployment (2026-02-11) ✅

- [x] Backend Dockerfile fixed: `uv sync --frozen --no-dev --no-cache` (was broken `uv pip install -r`)
- [x] Frontend Dockerfile: `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SINGLE_USER_MODE` build args (Next.js inlines at build time)
- [x] Nginx reverse proxy: single entry point on port 80
  - `/` → frontend (port 3000)
  - `/api/` → backend (port 8000)
  - `/api/v1/chat/ws` → WebSocket with upgrade headers
  - `/health` → backend health check
- [x] docker-compose.yml: nginx service, `expose` (not `ports`) for frontend/backend, `MONGODB_URL`/`REDIS_URL` environment overrides
- [x] Frontend API client: empty `NEXT_PUBLIC_API_URL` = same-origin (relative URLs via nginx)
- [x] Frontend WebSocket: derives WS URL from `window.location` when `NEXT_PUBLIC_API_URL` is empty (SSR-safe)
- [x] All services verified healthy: `curl http://localhost/health` → `{"status":"healthy","checks":{"mongodb":"ok","redis":"ok"}}`

## Deferred

- [ ] Serwist service worker + offline support
- [ ] E2E testing via Playwright MCP (see e2e/docs/TESTING-PLAN.md — 67 tests, 12 suites)
- [ ] Barcode scanning
- [ ] Multi-language support (i18n)
- [ ] Performance optimization + monitoring

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, ShadCN UI |
| State | Zustand (client) + TanStack Query (server) |
| Backend | FastAPI, Python 3.12+, Beanie ODM |
| Database | MongoDB 7, Redis 7 |
| AI | LangGraph 1.0 + ChatLiteLLM (BYO provider — Claude, OpenAI, local LLMs) |
| Charts | Recharts |
| Tasks | ARQ (async Redis queue) |
| Proxy | Nginx (reverse proxy, port 80) |
| Deploy | Docker Compose |

## Routes (13 total)

| Route | Description |
|-------|-------------|
| /login, /register | Auth pages |
| /onboarding | First-time setup wizard |
| /dashboard | Macro progress, insights, checklist widget |
| /log | Food log with search, recent, favorites, copy, custom |
| /recipes | Recipe builder with ingredient search + logging |
| /checklist | Daily checklist with streaks |
| /analytics | Charts, heatmap, weight tracking, export |
| /chat | AI nutrition assistant |
| /profile | User profile + goal templates |
| /settings | AI config, reminders, data export |

## Docs

- [PRD](docs/PRD.md) — Full requirements, data models, API contracts
- [Architecture](docs/ARCHITECTURE.md) — Tech decisions, patterns, code examples
