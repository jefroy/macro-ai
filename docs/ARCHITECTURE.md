# MacroAI — Architecture & Design Specification

**Version**: 1.4
**Last Updated**: 2026-02-09
**Status**: Phase 4 Complete (v1.0.0 Production-Ready)
**Companion Document**: [PRD.md](./PRD.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack (Final Selections)](#2-technology-stack-final-selections)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Architecture](#6-database-architecture)
7. [AI Integration Architecture](#7-ai-integration-architecture)
8. [Real-Time Architecture](#8-real-time-architecture)
9. [Authentication & Security](#9-authentication--security)
10. [API Design Standards](#10-api-design-standards)
11. [Caching Strategy](#11-caching-strategy)
12. [Background Jobs & Task Queue](#12-background-jobs--task-queue)
13. [Error Handling & Observability](#13-error-handling--observability)
14. [Testing Strategy](#14-testing-strategy)
15. [DevOps & Deployment](#15-devops--deployment)
16. [Performance Budget](#16-performance-budget)
17. [Technology Decision Records](#17-technology-decision-records)

---

## 1. Architecture Overview

### 1.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│                                                             │
│   ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │ Browser │  │  PWA     │  │ Mobile   │  │ Desktop  │   │
│   │ (SPA)   │  │ (Install)│  │ (PWA)    │  │ (PWA)    │   │
│   └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        └─────────────┴─────────────┴──────────────┘        │
│                          │ HTTPS                            │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    Next.js 16 Server                        │
│                          │                                  │
│   ┌──────────────────────┼──────────────────────────────┐  │
│   │              App Router (RSC + Client)               │  │
│   │                                                      │  │
│   │  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ │  │
│   │  │ Server      │ │ Client       │ │ API Routes   │ │  │
│   │  │ Components  │ │ Components   │ │ (BFF Proxy)  │ │  │
│   │  │ (RSC)       │ │ (Interactive)│ │              │ │  │
│   │  └─────────────┘ └──────────────┘ └──────┬───────┘ │  │
│   └──────────────────────────────────────────┼──────────┘  │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                              HTTP / WebSocket │
                                               │
┌──────────────────────────────────────────────┼──────────────┐
│                    FastAPI Backend                           │
│                          │                                   │
│   ┌──────────────────────┼──────────────────────────────┐   │
│   │                  API Layer (v1)                      │   │
│   │  ┌────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ │   │
│   │  │ REST   │ │ WebSocket │ │ Middleware│ │ Auth   │ │   │
│   │  │ Routes │ │ Handlers  │ │ Pipeline │ │ Guards │ │   │
│   │  └───┬────┘ └─────┬─────┘ └──────────┘ └────────┘ │   │
│   │      │             │                                │   │
│   │  ┌───┴─────────────┴────────────────────────────┐  │   │
│   │  │            Service Layer                      │  │   │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │   │
│   │  │  │ Nutrition │ │ AI       │ │ Food Search  │ │  │   │
│   │  │  │ Service  │ │ Service  │ │ Service      │ │  │   │
│   │  │  ├──────────┤ ├──────────┤ ├──────────────┤ │  │   │
│   │  │  │ User     │ │ Analytics│ │ Reminder     │ │  │   │
│   │  │  │ Service  │ │ Service  │ │ Service      │ │  │   │
│   │  │  └──────────┘ └──────────┘ └──────────────┘ │  │   │
│   │  └──────────────────┬───────────────────────────┘  │   │
│   │                     │                               │   │
│   │  ┌──────────────────┴───────────────────────────┐  │   │
│   │  │           Data Access Layer                   │  │   │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │   │
│   │  │  │ Beanie   │ │ Redis    │ │ LangGraph    │ │  │   │
│   │  │  │ (MongoDB)│ │ Client   │ │ (AI Agent)   │ │  │   │
│   │  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │  │   │
│   │  └───────┼─────────────┼──────────────┼─────────┘  │   │
│   └──────────┼─────────────┼──────────────┼────────────┘   │
└──────────────┼─────────────┼──────────────┼────────────────┘
               │             │              │
       ┌───────┴───┐  ┌─────┴─────┐  ┌─────┴──────────┐
       │  MongoDB  │  │   Redis   │  │  AI Providers  │
       │           │  │           │  │                 │
       │ - Users   │  │ - Cache   │  │ - Claude API   │
       │ - Foods   │  │ - Sessions│  │ - OpenAI API   │
       │ - Logs    │  │ - Pub/Sub │  │ - Local (Ollama│
       │ - Chat    │  │ - Queues  │  │   vLLM, etc.)  │
       │ - Analytics│ │ - Rate    │  │ - Any OpenAI-  │
       │           │  │   Limits  │  │   compatible   │
       └───────────┘  └───────────┘  └────────────────┘
```

### 1.2 Design Principles

| Principle | Application |
|-----------|-------------|
| **Layered architecture** | Routes → Services → Data Access. No business logic in routes, no DB calls in routes. |
| **Dependency injection** | FastAPI `Depends()` for all service/DB/auth dependencies. Testable by swapping deps. |
| **Server-first rendering** | Default to React Server Components. Client components only where interactivity is required. |
| **API-first design** | Backend is a standalone API. Frontend consumes it. Could swap frontends without touching backend. |
| **Convention over configuration** | Sensible defaults everywhere. Minimal config for basic setup, full config available for power users. |
| **Graceful degradation** | App works without AI. Works offline (PWA cached pages). Works on low-end hardware. |
| **Fail loud, recover quiet** | Log errors prominently. Show user-friendly messages. Auto-retry transient failures. |

### 1.3 Communication Patterns

| Pattern | Used For | Protocol |
|---------|----------|----------|
| Request/Response | Food search, CRUD operations, analytics queries | REST over HTTPS |
| Streaming | AI chat responses, long-running AI tasks | WebSocket |
| Pub/Sub | Real-time dashboard updates, multi-tab sync | Redis Pub/Sub → WebSocket |
| Background Job | Weekly reports, reminder dispatch, DB maintenance | ARQ (Redis-backed) |
| Server-Sent Events | AI streaming fallback (when WebSocket unavailable) | SSE over HTTPS |

---

## 2. Technology Stack (Final Selections)

### 2.1 Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | **Next.js** | 16.x (stable) | RSC, App Router, Turbopack, `"use cache"` |
| Language | **TypeScript** | 5.x | Type safety across the frontend |
| Styling | **Tailwind CSS** | 4.x | Utility-first CSS, CSS-first config |
| UI Components | **ShadCN UI** | latest | Radix-based (unified `radix-ui` package), RTL support, accessible primitives |
| Global State | **Zustand** | 5.x | Lightweight global state (auth, UI, preferences) |
| Server State | **TanStack Query** | 5.x | API data fetching, caching, mutations |
| Forms | **React Hook Form** | 7.x | Performant form management |
| Validation | **Zod** | 3.x | Schema validation (shared with RHF) |
| Charts | **Tremor** | latest | Tailwind-native dashboard charts (Vercel-backed, MIT, ShadCN compatible) |
| Icons | **Lucide React** | latest | Consistent icon set (ShadCN default) |
| Date handling | **date-fns** | 4.x | Lightweight date utilities |
| WebSocket | **Native WebSocket API** | — | No library needed; thin wrapper |
| PWA | **Serwist** | latest | Service worker, offline, push notifications |
| HTTP Client | **ky** | latest | Tiny fetch wrapper with retries and hooks |
| Markdown | **react-markdown** | latest | AI chat response rendering |

### 2.2 Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | **FastAPI** | 0.128+ | Async API server, OpenAPI auto-docs, Pydantic v2 only |
| Language | **Python** | 3.12+ | Async/await, performance, AI ecosystem |
| MongoDB ODM | **Beanie** | 2.x | Async document models (Pydantic-native) |
| MongoDB Driver | **PyMongo (async)** | 4.x+ | Official async MongoDB driver (`AsyncMongoClient`) |
| Redis Client | **redis-py** | 5.x (async) | Caching, pub/sub, rate limits, sessions |
| AI Routing | **LiteLLM** | 1.81+ | Unified LLM interface (100+ providers) |
| AI Agent | **LangGraph** | 1.0+ | Stateful agent orchestration (ReAct loop, tool calling) |
| AI Framework | **langchain-core** | 0.3+ | Tool abstractions, message types, chat model interface |
| AI Chat Model | **langchain-community** | 0.3+ | ChatLiteLLM adapter (LiteLLM ↔ LangChain bridge) |
| AI Checkpointer | **langgraph-checkpoint-mongodb** | 0.3+ | Persist agent conversation state to MongoDB |
| Task Queue | **ARQ** | 0.26+ | Async Redis-based job queue |
| Package Manager | **uv** | latest | Fast Python dependency management with lockfile |
| Auth | **python-jose** | 3.x | JWT token creation/verification |
| Password Hashing | **passlib[bcrypt]** | 1.7+ | bcrypt password hashing |
| Encryption | **cryptography** | 43+ | AES-256 for API key encryption at rest |
| Validation | **Pydantic** | 2.x | Request/response schemas (built into FastAPI) |
| Testing | **pytest** + **pytest-asyncio** | latest | Async test support |
| HTTP Testing | **httpx** | 0.27+ | Async test client for FastAPI |
| Linting | **Ruff** | latest | Fast Python linter + formatter |

### 2.3 Infrastructure

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Database | **MongoDB** | 7.x | Document storage (flexible nutrient schemas) |
| Cache/Queue | **Redis** | 7.x (Alpine) | Cache, sessions, pub/sub, task queue |
| Containerization | **Docker** + **Compose** | latest | Single-command deployment |
| CI/CD | **GitHub Actions** | — | Lint, test, build, release |
| Reverse Proxy | **Caddy** (optional) | latest | Auto-HTTPS, reverse proxy for production |

### 2.4 Stack Change from PRD

| PRD Choice | Final Choice | Reason |
|------------|-------------|--------|
| Redux Toolkit | **Zustand** | Redux is overkill for this app's global state needs. Zustand is simpler, smaller (1KB), no boilerplate. TanStack Query handles all server state. |
| Next.js 16 | **Next.js 16** | Next.js 16 is stable (released Oct 2025, 16.1 in Dec 2025). Turbopack default, `"use cache"` directive, React 19.2. |
| Socket.IO | **Native WebSocket** | Socket.IO adds 40KB+ bundle. FastAPI has native WebSocket support. We don't need Socket.IO's fallback (SSE handles that). |
| next-pwa | **Serwist** | next-pwa is no longer maintained. Serwist is its actively maintained successor. |
| No HTTP client specified | **ky** | Tiny (3KB) fetch wrapper with retries, timeout, hooks. Better than raw fetch for API calls. |

---

## 3. Monorepo Structure

```
macro-ai/
│
├── frontend/                          # Next.js application
│   ├── public/
│   │   ├── icons/                     # PWA icons (192, 512)
│   │   ├── manifest.json              # PWA manifest
│   │   └── sw.js                      # Service worker (Serwist generated)
│   │
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── (auth)/                # Unauthenticated layout group
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx         # Minimal layout (no sidebar)
│   │   │   │
│   │   │   ├── (app)/                 # Authenticated layout group
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx       # Daily dashboard
│   │   │   │   ├── log/
│   │   │   │   │   ├── page.tsx       # Food log (today)
│   │   │   │   │   └── [date]/
│   │   │   │   │       └── page.tsx   # Food log (specific date)
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx       # Charts and trends
│   │   │   │   ├── chat/
│   │   │   │   │   └── page.tsx       # AI chat (full page)
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx       # User profile & targets
│   │   │   │   ├── checklist/
│   │   │   │   │   └── page.tsx       # Daily checklist + streak
│   │   │   │   ├── recipes/
│   │   │   │   │   └── page.tsx       # Recipe builder + logging
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx       # App settings, AI config, reminders, data export
│   │   │   │   └── layout.tsx         # App shell (sidebar + topbar + theme toggle)
│   │   │   │
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx           # Onboarding wizard
│   │   │   │
│   │   │   ├── api/                   # Next.js API routes (BFF)
│   │   │   │   └── [...proxy]/
│   │   │   │       └── route.ts       # Catch-all proxy to FastAPI
│   │   │   │
│   │   │   ├── layout.tsx             # Root layout (providers, fonts)
│   │   │   ├── loading.tsx            # Global loading state
│   │   │   ├── not-found.tsx          # 404
│   │   │   └── error.tsx              # Global error boundary
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                    # ShadCN primitives (button, input, dialog, skeleton, alert-dialog, tabs, textarea, etc.)
│   │   │   ├── confirm-dialog.tsx     # Reusable AlertDialog wrapper for destructive actions
│   │   │   ├── error-card.tsx         # Reusable error state with retry button
│   │   │   ├── food-log/
│   │   │   │   ├── food-search.tsx
│   │   │   │   ├── food-log-entry.tsx
│   │   │   │   ├── meal-section.tsx
│   │   │   │   ├── macro-progress.tsx
│   │   │   │   └── quick-add.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── calorie-ring.tsx
│   │   │   │   ├── macro-bars.tsx
│   │   │   │   ├── remaining-macros.tsx
│   │   │   │   ├── meal-summary.tsx
│   │   │   │   ├── ai-insight-card.tsx
│   │   │   │   └── checklist-widget.tsx
│   │   │   ├── chat/
│   │   │   │   ├── chat-panel.tsx     # Slide-over panel (accessible from any page)
│   │   │   │   ├── chat-message.tsx
│   │   │   │   ├── chat-input.tsx
│   │   │   │   └── chat-provider.tsx  # WebSocket connection manager
│   │   │   ├── analytics/
│   │   │   │   ├── macro-bar-chart.tsx
│   │   │   │   ├── calorie-trend.tsx
│   │   │   │   ├── weight-chart.tsx
│   │   │   │   └── nutrient-heatmap.tsx
│   │   │   ├── profile/
│   │   │   │   ├── stats-form.tsx
│   │   │   │   ├── targets-display.tsx
│   │   │   │   └── weight-logger.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── step-stats.tsx
│   │   │   │   ├── step-goals.tsx
│   │   │   │   ├── step-targets.tsx
│   │   │   │   └── step-ai-setup.tsx
│   │   │   └── layout/
│   │   │       ├── sidebar.tsx
│   │   │       ├── topbar.tsx
│   │   │       ├── mobile-nav.tsx
│   │   │       └── theme-toggle.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   ├── client.ts          # ky instance with auth interceptor
│   │   │   │   ├── foods.ts           # Food API functions
│   │   │   │   ├── food.ts            # Food log API + daily totals/insights/alerts
│   │   │   │   ├── analytics.ts       # Range totals, weekly averages
│   │   │   │   ├── auth.ts            # Auth API functions
│   │   │   │   ├── user.ts            # User profile API
│   │   │   │   ├── chat.ts            # Chat REST endpoints
│   │   │   │   ├── weight.ts          # Weight tracking API
│   │   │   │   ├── reminders.ts       # Reminder CRUD + toggle
│   │   │   │   ├── checklist.ts       # Checklist items + streak
│   │   │   │   ├── templates.ts       # Goal templates + apply
│   │   │   │   ├── reports.ts         # Weekly report + CSV/JSON export
│   │   │   │   └── recipes.ts         # Recipe CRUD + log recipe
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── auth-store.ts      # Auth state (token, user)
│   │   │   │   ├── ui-store.ts        # UI state (sidebar, chat panel, theme)
│   │   │   │   └── chat-store.ts      # Chat state (messages, connection status)
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── use-food-search.ts # TanStack Query: food search
│   │   │   │   ├── use-food-log.ts    # TanStack Query: food log CRUD
│   │   │   │   ├── use-nutrition.ts   # TanStack Query: daily/weekly nutrition
│   │   │   │   ├── use-weight.ts      # TanStack Query: weight entries
│   │   │   │   ├── use-chat.ts        # WebSocket chat hook
│   │   │   │   ├── use-user.ts        # TanStack Query: user profile
│   │   │   │   └── use-debounce.ts    # Debounce utility hook
│   │   │   │
│   │   │   ├── validators/
│   │   │   │   ├── auth.ts            # Login/register schemas
│   │   │   │   ├── profile.ts         # Profile form schemas
│   │   │   │   ├── food-log.ts        # Food log entry schemas
│   │   │   │   └── food.ts            # Custom food schemas
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── nutrients.ts       # Nutrient calculations, formatting
│   │   │   │   ├── tdee.ts            # TDEE/macro calculators
│   │   │   │   ├── dates.ts           # Date formatting helpers
│   │   │   │   └── cn.ts              # Tailwind cn() merge utility
│   │   │   │
│   │   │   └── websocket.ts           # WebSocket client wrapper
│   │   │
│   │   └── types/
│   │       ├── api.ts                 # API response types
│   │       ├── food.ts                # Food & nutrient types
│   │       ├── user.ts                # User & profile types
│   │       ├── log.ts                 # Food log types
│   │       └── chat.ts                # Chat message types
│   │
│   ├── tailwind.css                   # Tailwind v4 entry (CSS-first)
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── components.json                # ShadCN config
│
├── backend/                           # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app factory, startup/shutdown
│   │   ├── config.py                  # Pydantic Settings (env-based config)
│   │   ├── database.py                # MongoDB connection + Beanie init
│   │   ├── redis.py                   # Redis connection pool
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                # Shared dependencies (get_current_user, get_db, etc.)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py          # v1 router aggregator (11 routers)
│   │   │       ├── auth.py            # POST /auth/register, /auth/login, /auth/refresh
│   │   │       ├── users.py           # GET/PATCH /users/me, /me/targets, /me/ai-config
│   │   │       ├── foods.py           # GET /foods/search, POST /foods
│   │   │       ├── food_log.py        # CRUD /food-log + /totals, /insights, /alerts
│   │   │       ├── weight.py          # CRUD /weight
│   │   │       ├── chat.py            # WebSocket /chat/ws, REST fallbacks
│   │   │       ├── reminders.py       # CRUD /reminders + toggle
│   │   │       ├── checklist.py       # GET /checklist + toggle/add/delete + /streak
│   │   │       ├── templates.py       # GET /templates, POST /templates/{id}/apply
│   │   │       ├── reports.py         # GET /reports/weekly + GET /reports/export (CSV)
│   │   │       └── recipes.py         # CRUD /recipes + POST /recipes/{id}/log
│   │   │
│   │   ├── models/                    # Beanie Document models (8 collections)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── food.py                # Food items (was food_item.py)
│   │   │   ├── food_log.py            # Food log entries (extended with sugar/sodium/sat fat)
│   │   │   ├── weight.py              # Weight entries
│   │   │   ├── reminder.py            # Reminders (meal, supplement, hydration, custom)
│   │   │   ├── checklist.py           # Checklist items (auto-check + custom)
│   │   │   └── recipe.py             # Recipes with embedded ingredients + nutrient totals
│   │   │
│   │   ├── schemas/                   # Pydantic request/response models
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # LoginRequest, TokenResponse
│   │   │   ├── user.py                # UserResponse, ProfileUpdate
│   │   │   ├── food.py                # FoodSearchResult, FoodCreate
│   │   │   ├── food_log.py            # LogEntryCreate, LogEntryResponse
│   │   │   ├── nutrition.py           # DailySummary, WeeklyAverage, TrendPoint
│   │   │   ├── weight.py              # WeightCreate, WeightTrend
│   │   │   ├── chat.py                # ChatMessage, ChatSession
│   │   │   └── common.py              # PaginatedResponse, ErrorResponse
│   │   │
│   │   ├── services/                  # Business logic (no HTTP concerns)
│   │   │   ├── __init__.py
│   │   │   ├── nutrient_alerts.py     # Rule-based nutrient limit checks
│   │   │   ├── daily_insights.py      # Rule-based daily insights engine
│   │   │   └── ai/
│   │   │       ├── __init__.py
│   │   │       ├── llm.py             # ChatLiteLLM factory, provider routing
│   │   │       ├── tools.py           # 12 @tool-decorated functions (DB read/write)
│   │   │       ├── graph.py           # LangGraph ReAct agent definition
│   │   │       ├── prompts.py         # System prompts, prompt templates
│   │   │       └── checkpointer.py   # MongoDB checkpointer setup
│   │   │
│   │   ├── tasks/                     # ARQ background tasks
│   │   │   ├── __init__.py
│   │   │   ├── worker.py              # ARQ worker settings
│   │   │   ├── daily_summary.py       # Compute and store daily summaries
│   │   │   ├── weekly_report.py       # Generate AI weekly report
│   │   │   └── reminder_dispatch.py   # Check and fire due reminders
│   │   │
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── rate_limit.py          # Redis-based rate limiting
│   │   │   ├── request_id.py          # Attach unique request ID
│   │   │   └── cors.py                # CORS configuration
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── crypto.py              # AES-256 encrypt/decrypt for API keys
│   │       ├── nutrients.py            # Nutrient calculation helpers
│   │       ├── tdee.py                # TDEE/macro calculators
│   │       └── pagination.py          # Cursor/offset pagination helpers
│   │
│   ├── seeds/                         # Database seed data
│   │   ├── seed.py                    # Seed runner script
│   │   ├── usda_foods.json            # Pre-processed USDA food data
│   │   └── supplements.json           # Supplement database
│   │
│   ├── tests/
│   │   ├── conftest.py                # Fixtures (test DB, test client, test user)
│   │   ├── test_auth.py
│   │   ├── test_food_log.py
│   │   ├── test_nutrition.py
│   │   ├── test_food_search.py
│   │   └── test_ai_context.py
│   │
│   ├── pyproject.toml                 # Python project config (deps, ruff, pytest)
│   ├── Dockerfile
│   └── alembic.ini                    # Not needed (MongoDB), placeholder for future
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md                # This document
│   ├── API.md                         # Detailed API documentation (auto-generated from OpenAPI)
│   └── SELF_HOSTING.md                # Self-hosting guide
│
├── docker/
│   ├── frontend.Dockerfile            # Multi-stage build for Next.js
│   ├── backend.Dockerfile             # Multi-stage build for FastAPI
│   └── mongo-init.js                  # MongoDB initialization script (indexes)
│
├── scripts/
│   ├── seed-db.sh                     # Seed the food database
│   ├── dev.sh                         # Start dev environment
│   └── generate-secret.sh             # Generate encryption secrets
│
├── docker-compose.yml                 # Production compose
├── docker-compose.dev.yml             # Development compose (with hot reload)
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # Lint + test on PR
│   │   ├── release.yml                # Build + publish Docker images
│   │   └── seed-update.yml            # Monthly USDA data refresh
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── .env.example                       # Environment variable template
├── LICENSE                            # AGPLv3
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── CHANGELOG.md
```

---

## 4. Frontend Architecture

### 4.1 Server vs Client Component Strategy

Next.js 16 App Router defaults all components to **Server Components (RSC)**. We deliberately opt into client components only where needed. Caching is **opt-in** via the `"use cache"` directive — dynamic rendering is the default.

```
┌─────────────────────────────────────────────────────┐
│         Server Components (RSC) — default            │
│                                                      │
│  Used for:                                           │
│  - Page-level layouts and shells                     │
│  - Initial data fetching (SSR)                       │
│  - Static content (headers, footers, nav labels)     │
│  - SEO-critical pages                                │
│  - Food log page shell (fetches initial data)        │
│  - Analytics page shell (fetches chart data)         │
│  - Profile page (reads user data)                    │
│                                                      │
│  Benefits:                                           │
│  - Zero client JS for these components               │
│  - Data fetched on server (no loading spinners)      │
│  - Faster initial page load                          │
│                                                      │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   "use client"          "use cache"
        │                     │
┌───────┴──────────┐  ┌──────┴──────────────────────┐
│ Client Components│  │ Cached Server Components     │
│                  │  │                               │
│ Used for:        │  │ Used for:                     │
│ - Food search    │  │ - Food database queries       │
│ - Macro progress │  │   (changes rarely)            │
│ - Charts         │  │ - Static content pages        │
│ - Chat interface │  │ - Shared layout data          │
│ - Forms (RHF)    │  │                               │
│ - Food log edit  │  │ NOT used for:                 │
│ - Theme toggle   │  │ - User-specific data          │
│ - Quick-add      │  │ - Daily nutrition (changes    │
│ - Onboarding     │  │   frequently per user)        │
│                  │  │                               │
└──────────────────┘  └───────────────────────────────┘
```

**Decision rules**:
- Needs `useState`, `useEffect`, event handlers, browser APIs, or third-party client libraries → `"use client"`
- Rarely changes, shared across users (food DB), expensive to compute → `"use cache"`
- Everything else → Server Component (dynamic, rendered per request)

**Important Next.js 16 patterns**:
- `cookies()`, `headers()`, `params`, `searchParams` are all **async** — must be `await`ed
- Use `npx next typegen` for auto-generated page/layout prop types
- Turbopack is the default bundler — no configuration needed

### 4.2 State Management Architecture

Three distinct layers of state, each managed by the right tool:

```
┌─────────────────────────────────────────────────┐
│          Layer 1: Server State                   │
│          (TanStack Query)                        │
│                                                  │
│  Everything from the API:                        │
│  - User profile                                  │
│  - Food log entries                              │
│  - Daily nutrition totals                        │
│  - Food search results                           │
│  - Weight entries                                │
│  - Analytics data                                │
│  - Chat sessions list                            │
│                                                  │
│  Features used:                                  │
│  - useQuery() for reads with stale-while-revalidate │
│  - useMutation() for writes with optimistic updates │
│  - queryClient.invalidateQueries() for cache busting │
│  - Prefetching in server components              │
│                                                  │
│  Cache strategy:                                 │
│  - staleTime: 30s for dashboard data             │
│  - staleTime: 5min for analytics                 │
│  - staleTime: 60min for food database searches   │
│  - gcTime: 10min (garbage collection)            │
│                                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          Layer 2: Global Client State            │
│          (Zustand)                               │
│                                                  │
│  Minimal, UI-only state:                         │
│  - Auth tokens (JWT + refresh)                   │
│  - Chat panel open/closed                        │
│  - Sidebar collapsed/expanded                    │
│  - Theme (light/dark/system)                     │
│  - Active chat messages (streaming buffer)       │
│  - WebSocket connection status                   │
│  - Toast/notification queue                      │
│                                                  │
│  Persisted to localStorage:                      │
│  - Auth tokens                                   │
│  - Theme preference                              │
│  - Sidebar state                                 │
│                                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│          Layer 3: Local Component State          │
│          (useState / useReducer)                 │
│                                                  │
│  Ephemeral, component-scoped:                    │
│  - Form input values (managed by RHF)            │
│  - Search input text                             │
│  - Dropdown open/closed                          │
│  - Modal visibility                              │
│  - Onboarding wizard current step                │
│  - Date picker selection                         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 4.3 Data Fetching Patterns

#### Pattern 1: Server Component Fetch (initial page data)

```typescript
// app/(app)/dashboard/page.tsx — Server Component (dynamic by default in Next.js 16)
export default async function DashboardPage() {
  // All request APIs are async in Next.js 16
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  // Fetch on the server, no loading state needed
  const [dailyData, user] = await Promise.all([
    api.nutrition.getDaily(today, token),
    api.users.getMe(token),
  ])

  return (
    <div>
      <MacroProgress data={dailyData} targets={user.targets} />  {/* Client */}
      <MealSummary meals={dailyData.meals} />                     {/* Server */}
      <AiInsightCard />                                            {/* Client */}
    </div>
  )
}
```

#### Pattern 1b: Cached Server Component (shared, rarely-changing data)

```typescript
// components/food-log/food-categories.tsx — Cached Server Component
"use cache"

export async function FoodCategories() {
  // This is cached and shared across users — food categories rarely change
  const categories = await api.foods.getCategories()
  return (
    <div className="flex gap-2">
      {categories.map((cat) => (
        <Badge key={cat.id}>{cat.name}</Badge>
      ))}
    </div>
  )
}
```

#### Pattern 2: Client Component Query (interactive data)

```typescript
// components/food-log/food-search.tsx — Client Component
"use client"

export function FoodSearch() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery({
    queryKey: ["foods", "search", debouncedQuery],
    queryFn: () => api.foods.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,  // Cache search results for 1 min
  })

  // ...render search results
}
```

#### Pattern 3: Optimistic Mutation (food logging)

```typescript
// hooks/use-food-log.ts
export function useLogFood() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entry: LogEntryCreate) => api.log.create(entry),
    onMutate: async (newEntry) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["nutrition", "daily"] })

      // Snapshot previous value
      const previous = queryClient.getQueryData(["nutrition", "daily"])

      // Optimistically update daily totals
      queryClient.setQueryData(["nutrition", "daily"], (old) => ({
        ...old,
        totals: addNutrients(old.totals, newEntry.nutrients),
      }))

      return { previous }
    },
    onError: (err, _, context) => {
      // Rollback on error
      queryClient.setQueryData(["nutrition", "daily"], context.previous)
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["nutrition", "daily"] })
      queryClient.invalidateQueries({ queryKey: ["log"] })
    },
  })
}
```

### 4.4 Routing & Layout Architecture

```
/ (root layout — providers, fonts, metadata)
├── /login                    (auth layout — minimal, centered)
├── /register                 (auth layout)
├── /onboarding               (standalone — no sidebar)
│
└── /dashboard                (app layout — sidebar + topbar + theme toggle + chat panel)
    ├── /log                  (food log — today, with favorites, recent, copy, custom)
    ├── /log/[date]           (food log — specific date)
    ├── /recipes              (recipe builder + CRUD + log as food entry)
    ├── /checklist            (daily checklist + streak badge)
    ├── /analytics            (charts, trends, weekly summary, heatmap, CSV export)
    ├── /chat                 (full-page AI chat)
    ├── /profile              (profile + targets + goal templates)
    └── /settings             (app settings, AI config, reminders, data export)
```

**App Layout** (authenticated pages):
```
┌──────────────────────────────────────────────┐
│  Topbar (logo, date picker, user menu)       │
├──────┬───────────────────────────┬───────────┤
│      │                           │           │
│  S   │                           │  Chat     │
│  i   │     Page Content          │  Panel    │
│  d   │     (dynamic)             │  (slide   │
│  e   │                           │   over)   │
│  b   │                           │           │
│  a   │                           │           │
│  r   │                           │           │
│      │                           │           │
├──────┴───────────────────────────┴───────────┤
│  Mobile Bottom Nav (visible < 768px)         │
└──────────────────────────────────────────────┘
```

### 4.5 Component Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Composition over inheritance** | Build complex components from ShadCN primitives. No deep component hierarchies. |
| **Co-located queries** | Each feature component owns its TanStack Query hook. No prop-drilling server data. |
| **Accessible by default** | ShadCN/Radix provides ARIA, keyboard, and focus management out of the box. |
| **Responsive-first** | Every component designed mobile-first. Sidebar collapses to bottom nav on mobile. |
| **Loading and error states** | Every data-dependent component handles loading (skeleton) and error (retry button) states explicitly. |

### 4.6 Tailwind CSS 4 Configuration

Tailwind v4 uses CSS-first configuration:

```css
/* frontend/tailwind.css */
@import "tailwindcss";

@theme {
  /* Brand Colors */
  --color-brand-50: #f0fdf4;
  --color-brand-100: #dcfce7;
  --color-brand-500: #22c55e;
  --color-brand-600: #16a34a;
  --color-brand-700: #15803d;

  /* Semantic Colors */
  --color-protein: #3b82f6;   /* Blue */
  --color-carbs: #f59e0b;     /* Amber */
  --color-fat: #ef4444;       /* Red */
  --color-calories: #8b5cf6;  /* Purple */
  --color-fiber: #10b981;     /* Emerald */

  /* Nutrient Status */
  --color-deficient: #ef4444;
  --color-low: #f59e0b;
  --color-on-target: #22c55e;
  --color-excess: #f97316;

  /* Spacing */
  --spacing-sidebar: 16rem;
  --spacing-sidebar-collapsed: 4rem;
  --spacing-topbar: 4rem;
  --spacing-chat-panel: 24rem;

  /* Fonts */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Radius */
  --radius-default: 0.5rem;
}
```

### 4.7 BFF Proxy Pattern

The Next.js API route acts as a Backend-for-Frontend proxy, handling:
- Token attachment (auth header injection)
- Cookie-to-header token translation (for SSR)
- CORS bypass (same-origin requests from browser)
- Response transformation (if needed)

```typescript
// app/api/[...proxy]/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(req: NextRequest) {
  return proxy(req)
}

export async function POST(req: NextRequest) {
  return proxy(req)
}

// ... PATCH, DELETE

async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api", "")
  const url = `${BACKEND_URL}${path}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  // Inject auth token from cookie if present
  const token = req.cookies.get("token")?.value
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: req.body,
  })

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  })
}
```

---

## 5. Backend Architecture

### 5.1 Layered Architecture

Strict three-layer architecture — each layer only talks to the layer directly below it.

```
┌─────────────────────────────────────────────────┐
│          API Layer (Routes)                       │
│                                                   │
│  Responsibilities:                                │
│  - HTTP request/response handling                 │
│  - Request validation (Pydantic schemas)          │
│  - Auth guards (dependency injection)             │
│  - Response serialization                         │
│  - WebSocket connection management                │
│  - Rate limiting                                  │
│                                                   │
│  Does NOT:                                        │
│  - Contain business logic                         │
│  - Query the database directly                    │
│  - Call LLM APIs directly                         │
│                                                   │
└──────────────────────┬──────────────────────────┘
                       │ calls
┌──────────────────────┴──────────────────────────┐
│          Service Layer                           │
│                                                   │
│  Responsibilities:                                │
│  - All business logic                             │
│  - Nutrient calculations                          │
│  - TDEE/macro target computation                  │
│  - AI context building and prompt assembly        │
│  - Analytics aggregation                          │
│  - Deficiency detection                           │
│  - Data validation beyond schema (e.g., "does     │
│    this food_item_id exist?")                     │
│                                                   │
│  Does NOT:                                        │
│  - Know about HTTP, request objects, or responses  │
│  - Directly manage WebSocket connections           │
│                                                   │
└──────────────────────┬──────────────────────────┘
                       │ calls
┌──────────────────────┴──────────────────────────┐
│          Data Access Layer                       │
│                                                   │
│  Responsibilities:                                │
│  - Beanie document queries (MongoDB)              │
│  - Redis read/write operations                    │
│  - LangGraph agent invocations (tool calls + LLM)  │
│  - External API calls (USDA, etc.)                │
│                                                   │
└──────────────────────────────────────────────────┘
```

### 5.2 Dependency Injection Pattern

FastAPI's `Depends()` system powers all cross-cutting concerns:

```python
# app/api/deps.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import User
from app.services.auth_service import AuthService
from app.database import get_database
from app.redis import get_redis

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(),
) -> User:
    """Extract and validate JWT, return authenticated user."""
    token = credentials.credentials
    user = await auth_service.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """Ensure user account is active."""
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    return user
```

Usage in routes:

```python
# app/api/v1/food_log.py

from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.services.food_log_service import FoodLogService
from app.schemas.food_log import LogEntryCreate, LogEntryResponse

router = APIRouter(prefix="/log", tags=["food-log"])

@router.post("/", response_model=LogEntryResponse, status_code=201)
async def create_log_entry(
    entry: LogEntryCreate,
    user: User = Depends(get_current_user),
    food_log_service: FoodLogService = Depends(),
):
    return await food_log_service.create_entry(user.id, entry)


@router.get("/", response_model=list[LogEntryResponse])
async def get_daily_log(
    date: str = Query(default=None, description="YYYY-MM-DD, defaults to today"),
    user: User = Depends(get_current_user),
    food_log_service: FoodLogService = Depends(),
):
    target_date = parse_date(date) if date else get_nutrition_day(user)
    return await food_log_service.get_entries_for_date(user.id, target_date)
```

### 5.3 Service Pattern

Every service follows the same pattern:

```python
# app/services/food_log_service.py

from beanie import PydanticObjectId
from datetime import date
from app.models.food_log_entry import FoodLogEntry
from app.models.food_item import FoodItem
from app.schemas.food_log import LogEntryCreate
from app.utils.nutrients import calculate_nutrients


class FoodLogService:
    """Business logic for food logging."""

    async def create_entry(
        self, user_id: PydanticObjectId, data: LogEntryCreate
    ) -> FoodLogEntry:
        # Fetch the food item to get per-100g nutrient data
        food_item = await FoodItem.get(data.food_item_id)
        if not food_item:
            raise ValueError(f"Food item {data.food_item_id} not found")

        # Calculate actual nutrients based on serving
        nutrients = calculate_nutrients(
            food_item.nutrients,
            serving_grams=data.serving_grams,
            quantity=data.quantity,
        )

        # Create and persist the log entry
        entry = FoodLogEntry(
            user_id=user_id,
            date=data.date,
            meal=data.meal,
            food_item_id=food_item.id,
            food_name=food_item.name,
            serving_label=data.serving_label,
            serving_grams=data.serving_grams,
            quantity=data.quantity,
            nutrients=nutrients,
        )
        await entry.insert()

        # Invalidate daily summary cache
        await self._invalidate_daily_cache(user_id, data.date)

        return entry

    async def get_entries_for_date(
        self, user_id: PydanticObjectId, target_date: date
    ) -> list[FoodLogEntry]:
        return await FoodLogEntry.find(
            FoodLogEntry.user_id == user_id,
            FoodLogEntry.date == target_date,
        ).sort(+FoodLogEntry.logged_at).to_list()

    async def get_daily_totals(
        self, user_id: PydanticObjectId, target_date: date
    ) -> dict:
        """Aggregate all nutrient totals for a given day."""
        entries = await self.get_entries_for_date(user_id, target_date)
        return sum_nutrients([e.nutrients for e in entries])

    async def _invalidate_daily_cache(self, user_id, target_date):
        """Clear cached daily summary when log changes."""
        from app.redis import redis
        cache_key = f"daily_summary:{user_id}:{target_date}"
        await redis.delete(cache_key)
```

### 5.4 Application Factory & Startup

```python
# app/main.py

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_database, close_database
from app.redis import init_redis, close_redis
from app.api.v1.router import v1_router
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.rate_limit import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await init_database()
    await init_redis()
    yield
    # Shutdown
    await close_database()
    await close_redis()


def create_app() -> FastAPI:
    app = FastAPI(
        title="MacroAI API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
    )

    # Middleware (order matters — outermost first)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(RateLimitMiddleware, redis_url=settings.redis_url)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    app.include_router(v1_router, prefix="/api/v1")

    return app


app = create_app()
```

### 5.5 Configuration Management

```python
# app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Application
    app_name: str = "MacroAI"
    debug: bool = False
    secret_key: str  # Used for JWT signing and API key encryption
    api_version: str = "v1"

    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "macroai"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    jwt_algorithm: str = "HS256"
    jwt_access_expiry_minutes: int = 30
    jwt_refresh_expiry_days: int = 7

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Rate Limiting
    rate_limit_per_minute: int = 100

    # Single User Mode (skip registration, auto-auth)
    single_user_mode: bool = False

    # AI (default, can be overridden per-user)
    default_ai_provider: str | None = None
    default_ai_model: str | None = None
    default_ai_api_key: str | None = None
    default_ai_base_url: str | None = None


settings = Settings()
```

---

## 6. Database Architecture

### 6.1 MongoDB Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Embedding vs Referencing** | Nutrients are **embedded** in FoodLogEntry; FoodItem is **referenced** by ID | Nutrients are always read with the log entry (no extra query). Food items are shared and large, so referenced to avoid duplication. |
| **Denormalization** | `food_name` denormalized into FoodLogEntry | Avoids a JOIN-equivalent for every log display. Updated via background task if food name changes. |
| **Daily Summary** | Pre-computed document, updated on write | Avoids aggregating all log entries on every dashboard load. Cache + pre-compute for speed. |
| **Date handling** | `date` field as Python `date` (not `datetime`) | Nutrition days are date-based. Timezone handling done in application layer using user's `nutrition_day_start_hour`. |

### 6.2 Indexing Strategy

```javascript
// docker/mongo-init.js — Run on first startup

// Users
db.users.createIndex({ email: 1 }, { unique: true })

// Food Items — Text search
db.food_items.createIndex(
  { name: "text", brand: "text" },
  { weights: { name: 10, brand: 5 }, name: "food_text_search" }
)
db.food_items.createIndex({ category: 1 })
db.food_items.createIndex({ source: 1 })
db.food_items.createIndex({ created_by: 1 })

// Food Log Entries — Primary query pattern: user + date
db.food_log_entries.createIndex({ user_id: 1, date: 1 })
db.food_log_entries.createIndex({ user_id: 1, date: 1, meal: 1 })
db.food_log_entries.createIndex({ user_id: 1, food_item_id: 1 })  // For "recent foods"

// Weight Entries
db.weight_entries.createIndex({ user_id: 1, date: -1 })

// Chat Messages
db.chat_messages.createIndex({ user_id: 1, session_id: 1, created_at: 1 })

// Chat Sessions
db.chat_sessions.createIndex({ user_id: 1, updated_at: -1 })

// Daily Summaries
db.daily_summaries.createIndex({ user_id: 1, date: -1 }, { unique: true })

// Reminders
db.reminders.createIndex({ user_id: 1, enabled: 1 })

// Checklist Items
db.checklist_items.createIndex({ user_id: 1, date: -1 })
db.checklist_items.createIndex({ user_id: 1, date: 1, type: 1 })

// Recipes
db.recipes.createIndex({ user_id: 1, created_at: -1 })
```

### 6.3 Query Patterns

| Query | Collection | Index Used | Frequency |
|-------|-----------|------------|-----------|
| Get today's food log | `food_log_entries` | `{user_id, date}` | Very High (every page load) |
| Search foods by name | `food_items` | text index `{name, brand}` | High (food logging) |
| Get daily summary | `daily_summaries` | `{user_id, date}` | Very High (dashboard) |
| Get weight trend (30 days) | `weight_entries` | `{user_id, date}` | Medium (analytics) |
| Get chat history | `chat_messages` | `{user_id, session_id, created_at}` | Medium (chat page) |
| Get recent foods | `food_log_entries` | `{user_id, food_item_id}` | High (food search) |
| Get nutrition trend (90 days) | `daily_summaries` | `{user_id, date}` | Low (analytics) |

### 6.4 MongoDB Aggregation Pipelines

**Weekly Macro Averages:**
```python
async def get_weekly_averages(user_id: ObjectId, start_date: date, end_date: date):
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date},
        }},
        {"$group": {
            "_id": None,
            "avg_calories": {"$avg": "$totals.calories"},
            "avg_protein": {"$avg": "$totals.protein_g"},
            "avg_carbs": {"$avg": "$totals.carbs_g"},
            "avg_fat": {"$avg": "$totals.fat_g"},
            "avg_fiber": {"$avg": "$totals.fiber_g"},
            "days_logged": {"$sum": 1},
        }},
    ]
    result = await DailySummary.aggregate(pipeline).to_list()
    return result[0] if result else None
```

**Recent Foods (deduplicated, ordered by frequency):**
```python
async def get_recent_foods(user_id: ObjectId, limit: int = 20):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"logged_at": -1}},
        {"$limit": 200},  # Look at last 200 entries
        {"$group": {
            "_id": "$food_item_id",
            "food_name": {"$first": "$food_name"},
            "count": {"$sum": 1},
            "last_used": {"$max": "$logged_at"},
        }},
        {"$sort": {"count": -1, "last_used": -1}},
        {"$limit": limit},
    ]
    return await FoodLogEntry.aggregate(pipeline).to_list()
```

### 6.5 Redis Usage Patterns

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `session:{user_id}:{token_jti}` | String | 7 days | Refresh token tracking (revocation) |
| `daily:{user_id}:{date}` | Hash | 1 hour | Cached daily nutrient totals |
| `food_search:{hash}` | String (JSON) | 1 hour | Cached food search results |
| `rate:{user_id}:{minute}` | Counter | 60s | Rate limit counter |
| `chat:stream:{session_id}` | Pub/Sub channel | — | Real-time AI response streaming |
| `ws:connections:{user_id}` | Set | — | Track active WebSocket connections |
| `reminder:next:{user_id}` | Sorted Set (score=timestamp) | — | Next pending reminders |

**Cache Invalidation Rules:**
- `daily:{user_id}:{date}` → Invalidated when: food logged, food deleted, food edited
- `food_search:{hash}` → Invalidated when: custom food created/updated (global flush)
- All caches use TTL as safety net; explicit invalidation for write-through consistency

---

## 7. AI Integration Architecture

### 7.1 Overview: LangGraph Agent with Tool Calling

The AI layer is a **LangGraph ReAct agent** — the LLM can read and write to MongoDB through tool functions, not just receive pre-built context strings. This means the AI can autonomously decide what data it needs, fetch it, perform actions (log food, update targets), and respond based on real results.

```
┌──────────────────────────────────────────────────────────┐
│                    LangGraph ReAct Agent                  │
│                                                           │
│   ┌─────────┐     ┌──────────────┐     ┌──────────────┐ │
│   │  Agent   │────►│  Should      │────►│  Tool Node   │ │
│   │  Node    │     │  Continue?   │     │  (execute)   │ │
│   │          │◄────│              │     │              │ │
│   │ (LLM    │     │ tool_calls?  │     │ Runs @tool   │ │
│   │  call)   │     │  yes → tools │     │ functions    │ │
│   │          │     │  no  → END   │     │ against DB   │ │
│   └─────────┘     └──────────────┘     └──────┬───────┘ │
│        ▲                                       │         │
│        │              feedback                 │         │
│        └───────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
┌──────────────┐                   ┌──────────────────┐
│  ChatLiteLLM │                   │  MongoDB          │
│  (BYO model) │                   │  (read/write via  │
│              │                   │   Beanie ODM)     │
│ Claude, GPT, │                   │                   │
│ Ollama, etc. │                   │  - User profile   │
└──────────────┘                   │  - Food log       │
                                   │  - Food database  │
                                   │  - Weight entries  │
                                   │  - Chat state     │
                                   └──────────────────┘
```

**Key packages:**

| Package | Purpose |
|---------|---------|
| `langgraph` 1.0+ | Agent graph orchestration (nodes, edges, state, conditional routing) |
| `langchain-core` 0.3+ | `@tool` decorator, `BaseMessage` types, chat model interface |
| `langchain-community` 0.3+ | `ChatLiteLLM` — bridges LiteLLM into LangChain's chat model interface |
| `langgraph-checkpoint-mongodb` 0.3+ | Persists conversation state (checkpoints) to MongoDB |
| `litellm` 1.81+ | Underlying LLM provider routing (100+ providers) |

### 7.2 LLM Factory

```python
# app/services/ai/llm.py

from langchain_community.chat_models import ChatLiteLLM
from app.models.user import User
from app.utils.crypto import decrypt_api_key

PROVIDER_PREFIXES = {
    "claude": "anthropic/",
    "openai": "",
    "glm": "glm/",
    "local": "openai/",
    "custom": "openai/",
}


def build_chat_model(user: User) -> ChatLiteLLM:
    """Create a ChatLiteLLM instance from the user's AI config."""
    config = user.ai_config
    if not config or not config.provider:
        raise ValueError("No AI provider configured")

    prefix = PROVIDER_PREFIXES.get(config.provider, "")
    model = f"{prefix}{config.model}"
    api_key = decrypt_api_key(config.api_key) if config.api_key else None

    return ChatLiteLLM(
        model=model,
        api_key=api_key,
        api_base=config.base_url,
        max_tokens=4096,
        temperature=0.7,
        streaming=True,
    )
```

### 7.3 Tool Definitions

Tools are plain async Python functions decorated with `@tool`. The LLM sees each function's name, docstring, and type hints — it decides when and how to call them. Each tool receives a `user_id` injected via LangGraph state (not exposed to the LLM).

```python
# app/services/ai/tools.py

from datetime import date, timedelta
from langchain_core.tools import tool
from app.models.food_log import FoodLog
from app.models.food import Food
from app.models.user import User
from app.models.weight import Weight


# ── Read Tools ──────────────────────────────────────────────

@tool
async def get_user_profile(user_id: str) -> str:
    """Get the user's profile: age, height, weight, gender, activity level, and daily macro targets."""
    user = await User.get(user_id)
    p = user.profile
    t = user.targets
    return (
        f"Age: {p.age}, Gender: {p.gender}, Height: {p.height_cm}cm, "
        f"Weight: {p.weight_kg}kg, Activity: {p.activity_level}\n"
        f"Daily targets — Calories: {t.calories}, Protein: {t.protein_g}g, "
        f"Carbs: {t.carbs_g}g, Fat: {t.fat_g}g, Fiber: {t.fiber_g}g"
    )


@tool
async def get_todays_food_log(user_id: str) -> str:
    """Get all food entries logged today, grouped by meal."""
    today = date.today()
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == today,
    ).sort("+meal", "+created_at").to_list()

    if not entries:
        return "No food logged today."

    lines = []
    for e in entries:
        lines.append(
            f"- [{e.meal}] {e.food_name}: {e.calories:.0f} kcal, "
            f"{e.protein_g:.0f}g P, {e.carbs_g:.0f}g C, {e.fat_g:.0f}g F"
        )
    return "\n".join(lines)


@tool
async def get_daily_totals(user_id: str, date_str: str = "") -> str:
    """Get total calories and macros for a given date (YYYY-MM-DD). Defaults to today."""
    target_date = date.fromisoformat(date_str) if date_str else date.today()
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date == target_date,
    ).to_list()

    totals = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0}
    for e in entries:
        totals["calories"] += e.calories
        totals["protein_g"] += e.protein_g
        totals["carbs_g"] += e.carbs_g
        totals["fat_g"] += e.fat_g
        totals["fiber_g"] += e.fiber_g

    return (
        f"Totals for {target_date}: {totals['calories']:.0f} kcal, "
        f"{totals['protein_g']:.0f}g protein, {totals['carbs_g']:.0f}g carbs, "
        f"{totals['fat_g']:.0f}g fat, {totals['fiber_g']:.0f}g fiber"
    )


@tool
async def get_weekly_averages(user_id: str) -> str:
    """Get average daily calories and macros over the past 7 days."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    entries = await FoodLog.find(
        FoodLog.user_id == user_id,
        FoodLog.date >= week_ago,
        FoodLog.date <= today,
    ).to_list()

    if not entries:
        return "No data for the past 7 days."

    # Group by date, compute daily totals, then average
    daily: dict[date, dict] = {}
    for e in entries:
        d = daily.setdefault(e.date, {"cal": 0, "p": 0, "c": 0, "f": 0})
        d["cal"] += e.calories
        d["p"] += e.protein_g
        d["c"] += e.carbs_g
        d["f"] += e.fat_g

    n = len(daily)
    avg_cal = sum(d["cal"] for d in daily.values()) / n
    avg_p = sum(d["p"] for d in daily.values()) / n
    avg_c = sum(d["c"] for d in daily.values()) / n
    avg_f = sum(d["f"] for d in daily.values()) / n

    return (
        f"7-day averages ({n} days logged): {avg_cal:.0f} kcal, "
        f"{avg_p:.0f}g protein, {avg_c:.0f}g carbs, {avg_f:.0f}g fat"
    )


@tool
async def get_weight_trend(user_id: str, days: int = 14) -> str:
    """Get recent weight entries and trend over the specified number of days."""
    cutoff = date.today() - timedelta(days=days)
    weights = await Weight.find(
        Weight.user_id == user_id,
        Weight.date >= cutoff,
    ).sort("+date").to_list()

    if not weights:
        return "No weight entries found."

    lines = [f"- {w.date}: {w.weight_kg:.1f} kg" for w in weights]
    if len(weights) >= 2:
        diff = weights[-1].weight_kg - weights[0].weight_kg
        direction = "up" if diff > 0 else "down"
        lines.append(f"Trend: {direction} {abs(diff):.1f} kg over {days} days")

    return "\n".join(lines)


@tool
async def search_food_database(query: str, limit: int = 10) -> str:
    """Search the food database by name. Returns matching foods with macros per serving."""
    foods = await Food.find(
        {"$text": {"$search": query}},
        limit=limit,
    ).to_list()

    if not foods:
        return f"No foods found matching '{query}'."

    lines = []
    for f in foods:
        lines.append(
            f"- {f.name} (per {f.serving_label}): "
            f"{f.calories:.0f} kcal, {f.protein_g:.0f}g P, "
            f"{f.carbs_g:.0f}g C, {f.fat_g:.0f}g F"
        )
    return "\n".join(lines)


# ── Write Tools ─────────────────────────────────────────────

@tool
async def log_food(
    user_id: str,
    food_name: str,
    meal: str,
    calories: float,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    serving_label: str = "1 serving",
    quantity: float = 1.0,
) -> str:
    """Log a food entry for the user. Meal must be: breakfast, lunch, dinner, or snack."""
    entry = FoodLog(
        user_id=user_id,
        date=date.today(),
        food_name=food_name,
        meal=meal,
        serving_label=serving_label,
        quantity=quantity,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
    )
    await entry.insert()
    return f"Logged: {food_name} ({meal}) — {calories:.0f} kcal"


@tool
async def update_daily_targets(
    user_id: str,
    calories: int,
    protein_g: int,
    carbs_g: int,
    fat_g: int,
) -> str:
    """Update the user's daily macro targets."""
    user = await User.get(user_id)
    user.targets.calories = calories
    user.targets.protein_g = protein_g
    user.targets.carbs_g = carbs_g
    user.targets.fat_g = fat_g
    await user.save()
    return (
        f"Targets updated: {calories} kcal, {protein_g}g protein, "
        f"{carbs_g}g carbs, {fat_g}g fat"
    )
```

**Tool categories and when the LLM uses them (12 tools):**

| Tool | Type | Trigger Example |
|------|------|----------------|
| `get_user_profile` | Read | "What are my macros?" |
| `get_todays_food_log` | Read | "What have I eaten today?" |
| `get_daily_totals` | Read | "How many calories do I have left?" |
| `get_weekly_averages` | Read | "How have I been doing this week?" |
| `get_weekly_report` | Read | "Give me a weekly report" |
| `get_weight_trend` | Read | "Am I losing weight?" |
| `get_nutrient_alerts` | Read | "Any nutrient warnings today?" |
| `search_food_database` | Read | "How much protein is in chicken breast?" |
| `log_food` | Write | "Log 200g chicken breast for lunch" |
| `quick_log` | Write | "I had chicken breast and rice" (NLP parsing) |
| `suggest_meals` | Read | "What should I eat for dinner?" |
| `update_daily_targets` | Write | "Set my calories to 2100" |

### 7.4 Agent Graph

The ReAct agent loops: LLM reasons → calls tools if needed → observes results → responds or loops again.

```python
# app/services/ai/graph.py

from typing import Annotated, Sequence, TypedDict
import json

from langchain_core.messages import BaseMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.mongodb import MongoDBSaver

from app.services.ai.llm import build_chat_model
from app.services.ai.tools import (
    get_user_profile,
    get_todays_food_log,
    get_daily_totals,
    get_weekly_averages,
    get_weekly_report,
    get_weight_trend,
    get_nutrient_alerts,
    search_food_database,
    log_food,
    quick_log,
    suggest_meals,
    update_daily_targets,
)
from app.services.ai.prompts import SYSTEM_PROMPT


# ── State ────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    user_id: str


# ── Tools registry (12 tools) ───────────────────────────

ALL_TOOLS = [
    get_user_profile,
    get_todays_food_log,
    get_daily_totals,
    get_weekly_averages,
    get_weekly_report,
    get_weight_trend,
    get_nutrient_alerts,
    search_food_database,
    log_food,
    quick_log,
    suggest_meals,
    update_daily_targets,
]

tools_by_name = {t.name: t for t in ALL_TOOLS}


# ── Nodes ────────────────────────────────────────────────

async def agent_node(state: AgentState, config: RunnableConfig):
    """Call the LLM with the current messages and bound tools."""
    # The chat model is built per-invocation from the user's AI config
    # (passed via config["configurable"]["user"])
    user = config["configurable"]["user"]
    model = build_chat_model(user).bind_tools(ALL_TOOLS)

    system = SystemMessage(content=SYSTEM_PROMPT)
    response = await model.ainvoke([system] + list(state["messages"]), config)
    return {"messages": [response]}


async def tool_node(state: AgentState):
    """Execute tool calls from the last LLM message."""
    outputs = []
    last_message = state["messages"][-1]
    user_id = state["user_id"]

    for tool_call in last_message.tool_calls:
        # Inject user_id into tools that need it (LLM never sees this param)
        args = tool_call["args"].copy()
        if "user_id" in tools_by_name[tool_call["name"]].args:
            args["user_id"] = user_id

        result = await tools_by_name[tool_call["name"]].ainvoke(args)
        outputs.append(
            ToolMessage(
                content=json.dumps(result) if not isinstance(result, str) else result,
                name=tool_call["name"],
                tool_call_id=tool_call["id"],
            )
        )
    return {"messages": outputs}


# ── Routing ──────────────────────────────────────────────

def should_continue(state: AgentState) -> str:
    """Route to tools if the LLM made tool calls, otherwise end."""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return "end"


# ── Graph Construction ───────────────────────────────────

def build_agent_graph(checkpointer: MongoDBSaver) -> StateGraph:
    """Build and compile the MacroAI ReAct agent graph."""
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)

    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {"tools": "tools", "end": END},
    )
    workflow.add_edge("tools", "agent")

    return workflow.compile(checkpointer=checkpointer)
```

**Agent flow diagram:**

```
User message
     │
     ▼
┌─────────┐      Has tool_calls?
│  Agent   │─────────────────────┐
│  (LLM)  │  No                  │ Yes
│         │──► END (respond)     │
└─────────┘                      ▼
     ▲                    ┌──────────┐
     │                    │  Tool    │
     │                    │  Node    │
     │    ToolMessage     │          │
     └────────────────────│ Execute  │
        (result fed back) │ function │
                          └──────────┘
                               │
                               ▼
                          MongoDB / Beanie
                          (read or write)
```

### 7.5 MongoDB Checkpointer (Conversation Persistence)

LangGraph checkpointing saves the full conversation state (messages, tool calls, tool results) to MongoDB after every step. This gives us:

- **Multi-turn memory** — resume any conversation by `thread_id`
- **Chat history** — load past sessions from the DB
- **Fault tolerance** — if the server restarts mid-conversation, state is preserved

```python
# app/services/ai/checkpointer.py

from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient

_checkpointer: MongoDBSaver | None = None


def init_checkpointer(mongodb_url: str, db_name: str = "macroai") -> MongoDBSaver:
    """Initialize the MongoDB checkpointer. Call once at app startup."""
    global _checkpointer
    client = MongoClient(mongodb_url)
    _checkpointer = MongoDBSaver(
        client=client,
        db_name=db_name,
    )
    return _checkpointer


def get_checkpointer() -> MongoDBSaver:
    if _checkpointer is None:
        raise RuntimeError("Checkpointer not initialized — call init_checkpointer()")
    return _checkpointer
```

**Usage in the chat endpoint:**

```python
# In app/api/v1/chat.py (WebSocket handler)

from app.services.ai.graph import build_agent_graph
from app.services.ai.checkpointer import get_checkpointer

checkpointer = get_checkpointer()
graph = build_agent_graph(checkpointer)

# Each conversation is identified by thread_id
config = {
    "configurable": {
        "thread_id": session_id,   # unique per chat session
        "user": current_user,       # passed to agent_node for LLM config
    }
}

# Streaming invocation
async for event in graph.astream(
    {"messages": [("user", user_message)], "user_id": str(current_user.id)},
    config=config,
    stream_mode="messages",
):
    # event contains streamed tokens — forward to WebSocket
    await websocket.send_json({"type": "chat.token", "content": event.content})
```

**What gets stored in MongoDB:**

| Collection | Contents |
|-----------|----------|
| `checkpoints` | Full agent state snapshots (messages, tool calls, results) per step |
| `checkpoint_writes` | Pending writes for crash recovery |

Both collections are auto-created by the checkpointer on first use.

> **Note on async:** The dedicated `AsyncMongoDBSaver` was removed in LangGraph 1.0 (upstream PyMongo driver changes). The sync `MongoDBSaver` works correctly in async FastAPI contexts — LangGraph handles the event loop bridging internally via its async methods (`aput`/`aget`/`alist`). If a native async checkpointer is re-added upstream, we can swap it in without changing the graph code.

### 7.6 System Prompt

The system prompt defines the agent's personality and rules. Unlike the old architecture, the agent **does not receive pre-built context** — it calls tools to fetch exactly the data it needs.

```python
# app/services/ai/prompts.py

SYSTEM_PROMPT = """You are MacroAI, a knowledgeable nutrition and fitness AI assistant.

## Your Role
- Provide evidence-based nutrition advice personalized to the user's real data
- You have tools to read the user's profile, food log, weight trend, and more
- You can also log food and update targets on behalf of the user
- Be direct, concise, and actionable

## Rules
- ALWAYS use your tools to fetch current data before giving advice — never guess
- NEVER recommend foods the user has listed as allergies or intolerances
- RESPECT the user's dietary restrictions at all times
- When suggesting foods, include approximate macros
- When logging food for the user, confirm what you logged
- If the user asks about something outside your expertise (medical conditions,
  clinical diagnoses), recommend they consult a healthcare professional
- Use metric units unless the user prefers imperial
- Keep responses focused — 2-4 paragraphs max unless the user asks for detail

## Tool Usage Guidelines
- For questions about current intake: call get_todays_food_log or get_daily_totals
- For trend questions: call get_weekly_averages or get_weight_trend
- For food lookups: call search_food_database
- For logging: call log_food (always confirm with the user what you logged)
- For target changes: call update_daily_targets (confirm the new values)
- You may chain multiple tool calls in one turn if needed

## Important
- The user_id parameter is injected automatically — never ask the user for it
- Dates are in YYYY-MM-DD format
- Meal values must be: breakfast, lunch, dinner, or snack"""

SYSTEM_PROMPT_WEEKLY_REPORT = """You are MacroAI generating a weekly nutrition report.

You have access to tools. Use them to gather the user's data, then produce a report:
1. **Summary**: Overall adherence to targets (1-2 sentences)
2. **Wins**: What went well (2-3 bullet points referencing specific data)
3. **Areas to Improve**: What needs attention (2-3 bullet points with specific numbers)
4. **Next Week Focus**: One specific, actionable recommendation

Be honest but encouraging. Reference actual numbers from the tools."""
```

### 7.7 How the Old Context Builder Is Replaced

| Old Architecture | New Architecture (LangGraph) |
|-----------------|------------------------------|
| `ContextBuilder` pre-fetches all data upfront | Agent calls tools on demand — fetches only what it needs |
| Context assembled as one big string in system prompt | Data fetched as structured tool results mid-conversation |
| Fixed token budget for context | Token usage adapts to conversation (simple questions use fewer tools) |
| No write capability — AI is read-only | Agent can log food, update targets via write tools |
| `LLMRouter` calls `litellm.acompletion()` directly | `ChatLiteLLM` wrapped in LangGraph graph with tool binding |
| Manual session management | Checkpointer auto-persists state per `thread_id` |

### 7.8 Token Budget Management

Since the agent fetches data via tools instead of stuffing everything into the system prompt, the token budget is naturally more efficient:

| Component | Approx Tokens | Notes |
|-----------|---------------|-------|
| System prompt | ~500 | Static, always included (updated with new tool guidance) |
| Tool definitions (schema) | ~900 | Auto-generated from 12 `@tool` signatures + docstrings |
| Tool call + result (per tool) | ~100-300 | Only for tools actually called |
| Conversation history | Variable | Managed by checkpointer |
| **Typical single-turn** | **~1,800-3,000** | Still much less than a fixed context approach |

**Context window strategy** (unchanged):
- If context window < 16K: Keep last 10 messages in checkpoint, summarize older
- If context window 16K-64K: Keep last 20 messages
- If context window > 64K: Full history, no summarization

Auto-detect model context window via LiteLLM's model info and trim the checkpoint message history before each invocation.

### 7.9 Security: Tool Call Guardrails

The agent has write access to the database, so we enforce guardrails:

1. **`user_id` is never exposed to the LLM** — it's injected server-side from the authenticated JWT user. The LLM cannot fabricate or modify it.
2. **Write tools require confirmation by default** — the system prompt instructs the agent to confirm with the user before logging food or changing targets. This is a soft guardrail (prompt-level).
3. **Rate limiting** — tool calls are counted per session. If the agent makes more than 20 tool calls in a single turn, the loop is terminated with a fallback response.
4. **Scoped writes** — tools can only write to the authenticated user's data. There is no tool to access other users' data.
5. **Audit trail** — all tool calls and results are persisted in the checkpoint. Every AI-initiated write is traceable.

---

## 8. Real-Time Architecture

### 8.1 WebSocket Design

```
┌────────────┐          ┌──────────────┐          ┌───────────┐
│  Browser   │◄────────►│  FastAPI WS  │◄────────►│   Redis   │
│  Client    │ WebSocket│  Handler     │  Pub/Sub  │  Pub/Sub  │
└────────────┘          └──────┬───────┘          └───────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  AI Provider │
                        │  (streaming) │
                        └──────────────┘
```

### 8.2 WebSocket Protocol

**Connection:**
```
ws://localhost:8000/api/v1/chat/ws?token={jwt_token}
```

**Message Types (Client → Server):**
```typescript
// Send a chat message
{ "type": "chat.message", "content": "How am I doing today?", "session_id": "abc123" }

// Request to stop streaming
{ "type": "chat.stop" }

// Ping (keepalive)
{ "type": "ping" }
```

**Message Types (Server → Client):**
```typescript
// AI response token (streaming)
{ "type": "chat.token", "content": "Based on", "session_id": "abc123" }

// AI response complete
{ "type": "chat.done", "session_id": "abc123", "message_id": "msg456" }

// Error
{ "type": "chat.error", "error": "AI provider not configured", "code": "AI_NOT_CONFIGURED" }

// Pong
{ "type": "pong" }
```

### 8.3 WebSocket Handler

```python
# app/api/v1/chat.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.ai.chat_service import ChatService
from app.services.auth_service import AuthService
import json

router = APIRouter(prefix="/chat", tags=["chat"])

@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str,  # Query param
):
    # Authenticate
    auth_service = AuthService()
    user = await auth_service.verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    chat_service = ChatService()

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg["type"] == "chat.message":
                # Stream AI response back token by token
                async for token_data in chat_service.stream_response(
                    user=user,
                    content=msg["content"],
                    session_id=msg.get("session_id"),
                ):
                    await websocket.send_json({
                        "type": "chat.token",
                        "content": token_data,
                        "session_id": msg.get("session_id"),
                    })

                await websocket.send_json({
                    "type": "chat.done",
                    "session_id": msg.get("session_id"),
                })

    except WebSocketDisconnect:
        pass  # Client disconnected
    except Exception as e:
        await websocket.send_json({
            "type": "chat.error",
            "error": str(e),
        })
```

### 8.4 Client-Side WebSocket

```typescript
// frontend/src/lib/websocket.ts

type WSMessage = {
  type: string
  content?: string
  session_id?: string
  error?: string
}

type WSHandler = {
  onToken: (content: string, sessionId: string) => void
  onDone: (sessionId: string) => void
  onError: (error: string) => void
  onStatusChange: (status: "connecting" | "connected" | "disconnected") => void
}

export class ChatWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private handlers: WSHandler

  constructor(handlers: WSHandler) {
    this.handlers = handlers
  }

  connect(token: string) {
    const url = `${process.env.NEXT_PUBLIC_WS_URL}/api/v1/chat/ws?token=${token}`
    this.handlers.onStatusChange("connecting")

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.handlers.onStatusChange("connected")
      this.startPingInterval()
    }

    this.ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data)

      switch (msg.type) {
        case "chat.token":
          this.handlers.onToken(msg.content!, msg.session_id!)
          break
        case "chat.done":
          this.handlers.onDone(msg.session_id!)
          break
        case "chat.error":
          this.handlers.onError(msg.error!)
          break
        case "pong":
          break // Keepalive acknowledged
      }
    }

    this.ws.onclose = () => {
      this.handlers.onStatusChange("disconnected")
      this.attemptReconnect(token)
    }
  }

  send(content: string, sessionId?: string) {
    this.ws?.send(JSON.stringify({
      type: "chat.message",
      content,
      session_id: sessionId,
    }))
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000)
      this.reconnectAttempts++
      setTimeout(() => this.connect(token), delay)
    }
  }

  private startPingInterval() {
    setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }))
      }
    }, 30000)
  }

  disconnect() {
    this.ws?.close()
  }
}
```

---

## 9. Authentication & Security

### 9.1 Auth Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client   │                    │ Next.js  │                    │ FastAPI  │
│  Browser  │                    │  BFF     │                    │ Backend  │
└─────┬─────┘                    └─────┬────┘                    └─────┬────┘
      │                                │                               │
      │  1. POST /login (email, pass)  │                               │
      │───────────────────────────────►│  2. Proxy to backend          │
      │                                │──────────────────────────────►│
      │                                │                               │
      │                                │  3. Return {access, refresh}  │
      │                                │◄──────────────────────────────│
      │  4. Set httpOnly cookies       │                               │
      │◄───────────────────────────────│                               │
      │     access_token (30min)       │                               │
      │     refresh_token (7d)         │                               │
      │                                │                               │
      │  5. Subsequent API requests    │                               │
      │───────────────────────────────►│  6. Read cookie, add          │
      │     (cookies sent auto)        │     Authorization header      │
      │                                │──────────────────────────────►│
      │                                │                               │
      │                                │  7. Validate JWT              │
      │                                │◄──────────────────────────────│
      │  8. Return data                │                               │
      │◄───────────────────────────────│                               │
```

### 9.2 JWT Token Structure

**Access Token (short-lived):**
```json
{
  "sub": "user_id_here",
  "email": "user@example.com",
  "role": "user",
  "exp": 1707400000,
  "iat": 1707398200,
  "jti": "unique_token_id"
}
```

**Refresh Token (long-lived):**
```json
{
  "sub": "user_id_here",
  "type": "refresh",
  "exp": 1708004600,
  "iat": 1707398200,
  "jti": "unique_token_id"
}
```

### 9.3 API Key Encryption

User AI API keys are encrypted at rest using AES-256-GCM:

```python
# app/utils/crypto.py

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, base64
from app.config import settings

def _get_key() -> bytes:
    """Derive encryption key from app secret."""
    return settings.secret_key.encode()[:32].ljust(32, b'\0')

def encrypt_api_key(plaintext: str) -> str:
    """Encrypt an API key for storage."""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()

def decrypt_api_key(encrypted: str) -> str:
    """Decrypt a stored API key."""
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted)
    nonce, ciphertext = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
```

### 9.4 Security Checklist

| Concern | Mitigation |
|---------|-----------|
| XSS | React auto-escaping; CSP headers; sanitize markdown rendering in chat |
| CSRF | SameSite=Strict cookies; CSRF token not needed with JWT in httpOnly cookie |
| Injection | Pydantic validation on all inputs; Beanie parameterized queries |
| Auth bypass | JWT validation on every protected route via `Depends(get_current_user)` |
| Rate limiting | Redis sliding window: 100 req/min per user, 20 req/min for AI endpoints |
| Secret exposure | `.env` for secrets; never logged; encrypted API keys in DB |
| Dependency vulns | GitHub Dependabot for both Python and Node.js |

---

## 10. API Design Standards

### 10.1 REST Conventions

| Convention | Standard |
|-----------|---------|
| Base path | `/api/v1/` |
| Resource naming | Plural nouns: `/foods`, `/log`, `/reminders` |
| HTTP methods | GET (read), POST (create), PATCH (partial update), DELETE (remove) |
| Status codes | 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 422 (Validation Error), 429 (Rate Limited), 500 (Server Error) |
| Date format | ISO 8601: `2026-02-08`, `2026-02-08T14:30:00Z` |
| Pagination | Cursor-based for lists (next_cursor); offset for analytics |

### 10.2 Response Envelope

**Success response:**
```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-02-08T14:30:00Z"
  }
}
```

**List response (paginated):**
```json
{
  "data": [ ... ],
  "meta": {
    "total": 150,
    "next_cursor": "eyJpZCI6ICIxMjMifQ==",
    "has_more": true
  }
}
```

**Error response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid serving size",
    "details": [
      { "field": "serving_grams", "message": "Must be greater than 0" }
    ]
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 10.3 API Versioning Strategy

- **URL-based versioning**: `/api/v1/`, `/api/v2/`
- v1 is the only version for the foreseeable future
- Breaking changes → new version; non-breaking additions → same version
- Old versions maintained for 6 months after new version ships

---

## 11. Caching Strategy

### 11.1 Multi-Layer Cache

```
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐
│  Browser     │   │  TanStack    │   │    Redis      │   │  MongoDB │
│  (HTTP cache)│◄──│  Query Cache │◄──│   (L2 Cache)  │◄──│  (Source │
│              │   │  (L1 Cache)  │   │               │   │   of     │
│  - Static    │   │              │   │  - Daily sums │   │   truth) │
│    assets    │   │  - 30s stale │   │  - Search     │   │          │
│  - PWA cache │   │  - In-memory │   │  - 1hr TTL    │   │          │
└─────────────┘   └──────────────┘   └──────────────┘   └──────────┘
```

### 11.2 Cache Policies by Data Type

| Data | L1 (TanStack) staleTime | L2 (Redis) TTL | Invalidation Trigger |
|------|-------------------------|----------------|---------------------|
| Daily nutrition totals | 30s | 1 hour | Food log write |
| Food search results | 60s | 1 hour | Custom food create |
| User profile | 5 min | None (small, always fresh) | Profile update |
| Weekly averages | 5 min | 6 hours | Daily summary compute |
| Weight entries | 2 min | None | Weight log write |
| Food database items | 10 min | 24 hours | Rarely changes |
| Chat sessions list | 30s | None | New message |

### 11.3 Write-Through Pattern

When a food log entry is created:
1. Write to MongoDB
2. Delete Redis cache for `daily:{user_id}:{date}`
3. Respond to client with new entry
4. Client invalidates TanStack Query cache for `["nutrition", "daily"]`
5. TanStack Query refetches, which hits Redis (miss) → MongoDB → repopulates Redis

---

## 12. Background Jobs & Task Queue

### 12.1 ARQ Worker Setup

```python
# app/tasks/worker.py

from arq import create_pool
from arq.connections import RedisSettings
from app.config import settings
from app.tasks.daily_summary import compute_daily_summary
from app.tasks.weekly_report import generate_weekly_report
from app.tasks.reminder_dispatch import check_and_dispatch_reminders


async def startup(ctx):
    """Initialize DB connections for worker."""
    from app.database import init_database
    await init_database()


async def shutdown(ctx):
    """Clean up."""
    from app.database import close_database
    await close_database()


class WorkerSettings:
    functions = [
        compute_daily_summary,
        generate_weekly_report,
        check_and_dispatch_reminders,
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        # Compute daily summaries for all users at 4 AM (covers most "nutrition day" resets)
        cron(compute_daily_summary, hour=4, minute=0),
        # Check reminders every minute
        cron(check_and_dispatch_reminders, minute={0, 1, 2, ..., 59}),
        # Weekly reports every Sunday at 6 PM
        cron(generate_weekly_report, weekday=6, hour=18, minute=0),
    ]
```

### 12.2 Job Types

| Job | Trigger | Frequency | Description |
|-----|---------|-----------|-------------|
| `compute_daily_summary` | Cron (4 AM) + on-demand | Daily | Aggregate all log entries into DailySummary document |
| `generate_weekly_report` | Cron (Sunday 6 PM) | Weekly | AI-generated weekly nutrition report |
| `check_and_dispatch_reminders` | Cron (every minute) | Per-minute | Check for due reminders, push to WebSocket/notification |
| `update_food_database` | Cron (monthly) | Monthly | Refresh USDA food data |
| `cleanup_expired_sessions` | Cron (daily) | Daily | Remove expired refresh tokens from Redis |

---

## 13. Error Handling & Observability

### 13.1 Error Handling Strategy

**Backend Exceptions:**
```python
# Custom exception hierarchy
class MacroAIError(Exception):
    """Base exception."""
    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code

class NotFoundError(MacroAIError):
    def __init__(self, resource: str, id: str):
        super().__init__(f"{resource} {id} not found", "NOT_FOUND", 404)

class AINotConfiguredError(MacroAIError):
    def __init__(self, message: str = "AI provider not configured"):
        super().__init__(message, "AI_NOT_CONFIGURED", 503)

class AIProviderError(MacroAIError):
    def __init__(self, provider: str, detail: str):
        super().__init__(f"AI provider '{provider}' error: {detail}", "AI_PROVIDER_ERROR", 502)

class RateLimitError(MacroAIError):
    def __init__(self):
        super().__init__("Rate limit exceeded", "RATE_LIMITED", 429)
```

**Global Exception Handler:**
```python
# In main.py
@app.exception_handler(MacroAIError)
async def macroai_error_handler(request, exc: MacroAIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
            },
            "meta": {"request_id": request.state.request_id},
        },
    )
```

**Frontend Error Handling:**
```typescript
// lib/api/client.ts
import ky from "ky"

export const api = ky.create({
  prefixUrl: "/api",
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          // Try refresh, then retry
          const refreshed = await refreshToken()
          if (refreshed) return ky(request)
          // If refresh fails, redirect to login
          window.location.href = "/login"
        }
      },
    ],
    beforeError: [
      async (error) => {
        const body = await error.response?.json().catch(() => null)
        if (body?.error) {
          error.message = body.error.message
          error.code = body.error.code
        }
        return error
      },
    ],
  },
})
```

### 13.2 Logging Strategy

**Structured JSON Logging:**
```python
import structlog

logger = structlog.get_logger()

# In service layer:
logger.info("food_logged", user_id=str(user.id), food_name=entry.food_name, calories=entry.nutrients.calories)
logger.warning("ai_slow_response", provider=config.provider, latency_ms=elapsed)
logger.error("ai_provider_failed", provider=config.provider, error=str(e))
```

**Log Levels:**
| Level | Use |
|-------|-----|
| DEBUG | Database queries, cache hits/misses, AI token counts |
| INFO | Food logged, user registered, AI chat message, weight logged |
| WARNING | AI slow response, rate limit approaching, cache miss on hot key |
| ERROR | AI provider failure, database error, unhandled exception |

### 13.3 Health Check

```python
@app.get("/health")
async def health():
    checks = {}

    # MongoDB
    try:
        await db.command("ping")
        checks["mongodb"] = "ok"
    except Exception:
        checks["mongodb"] = "error"

    # Redis
    try:
        await redis.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "error"

    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 503,
        content={"status": "healthy" if all_ok else "degraded", "checks": checks},
    )
```

---

## 14. Testing Strategy

### 14.1 Test Pyramid

```
          ┌───────────┐
          │   E2E     │  5-10 tests
          │ (Playwright)│  Critical user journeys
          ├───────────┤
          │Integration│  30-50 tests
          │ (API tests)│  Full endpoint testing with test DB
          ├───────────┤
          │   Unit    │  100+ tests
          │           │  Services, utils, calculations
          └───────────┘
```

### 14.2 Backend Testing

**Stack**: pytest + pytest-asyncio + httpx

**Test Database**: Separate MongoDB database (`macroai_test`), cleared between test modules.

```python
# tests/conftest.py

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import create_app
from app.database import init_database
from app.config import settings

settings.mongodb_database = "macroai_test"

@pytest_asyncio.fixture
async def app():
    app = create_app()
    await init_database()
    yield app
    # Clean up test database
    from app.database import db
    await db.client.drop_database("macroai_test")

@pytest_asyncio.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest_asyncio.fixture
async def auth_client(client):
    """Client with authenticated user."""
    # Register and login a test user
    await client.post("/api/v1/auth/register", json={
        "email": "test@test.com",
        "password": "testpass123",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@test.com",
        "password": "testpass123",
    })
    token = resp.json()["data"]["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    yield client
```

**Unit test example:**
```python
# tests/test_nutrition.py

from app.utils.nutrients import calculate_nutrients, sum_nutrients
from app.utils.tdee import calculate_tdee, calculate_macros

def test_calculate_nutrients_scaling():
    per_100g = {"calories": 165, "protein_g": 31, "carbs_g": 0, "fat_g": 3.6}
    result = calculate_nutrients(per_100g, serving_grams=150, quantity=1)
    assert result["calories"] == pytest.approx(247.5)
    assert result["protein_g"] == pytest.approx(46.5)

def test_tdee_calculation():
    tdee = calculate_tdee(weight_kg=80, height_cm=178, age=30, gender="male", activity="moderate")
    assert 2600 < tdee < 2900  # Reasonable range

def test_macro_calculation_cut():
    macros = calculate_macros(weight_kg=80, tdee=2740, goal="cut")
    assert macros["protein_g"] >= 160  # High protein for cut
    assert macros["calories"] < 2740  # Deficit
```

### 14.3 Frontend Testing

**Stack**: Vitest + React Testing Library + Playwright

```
frontend/
  src/
    __tests__/
      components/              # Component unit tests
        food-search.test.tsx
        macro-progress.test.tsx
      hooks/                   # Hook tests
        use-food-log.test.ts
      utils/                   # Utility tests
        nutrients.test.ts
        tdee.test.ts
  e2e/
    food-logging.spec.ts       # E2E: Log food, see macros update
    onboarding.spec.ts         # E2E: Complete onboarding flow
    ai-chat.spec.ts            # E2E: Send message, get response
```

### 14.4 What to Test

| Layer | What | Coverage Target |
|-------|------|----------------|
| Backend unit | Nutrient calculations, TDEE formulas, macro splits, context builder | 95% |
| Backend integration | All API endpoints, auth flows, food search | 80% |
| Frontend unit | Nutrient display formatting, date helpers, form validation | 90% |
| Frontend component | Food search, macro progress bars, chart rendering | 70% |
| E2E | Onboarding → food logging → dashboard → chat | 3-5 critical paths |

---

## 15. DevOps & Deployment

### 15.1 Docker Multi-Stage Builds

**Frontend Dockerfile:**
```dockerfile
# docker/frontend.Dockerfile

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

**Backend Dockerfile:**
```dockerfile
# docker/backend.Dockerfile

# Stage 1: Dependencies
FROM python:3.12-slim AS deps
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock* ./
RUN pip install uv && uv sync --frozen --no-dev

# Stage 2: Production
FROM python:3.12-slim AS runner
WORKDIR /app
COPY --from=deps /app/.venv ./.venv
COPY backend/app ./app
COPY backend/seeds ./seeds

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 15.2 Docker Compose (Production)

```yaml
# docker-compose.yml

services:
  frontend:
    build:
      context: .
      dockerfile: docker/frontend.Dockerfile
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: docker/backend.Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - MONGODB_DATABASE=macroai
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - CORS_ORIGINS=["http://localhost:3000"]
      - SINGLE_USER_MODE=${SINGLE_USER_MODE:-false}
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  worker:
    build:
      context: .
      dockerfile: docker/backend.Dockerfile
    command: arq app.tasks.worker.WorkerSettings
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - MONGODB_DATABASE=macroai
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - mongodb
      - redis
    restart: unless-stopped

  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
      - ./docker/mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro
    ports:
      - "27017:27017"
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

### 15.3 Docker Compose (Development)

```yaml
# docker-compose.dev.yml

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src      # Hot reload
    environment:
      - BACKEND_URL=http://backend:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000

  backend:
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend/app:/app/app        # Hot reload
    ports:
      - "8000:8000"

  # MongoDB and Redis same as production
```

### 15.4 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  backend-lint-test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports: [27017:27017]
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: uv sync --frozen
        working-directory: backend
      - run: uv run ruff check .
        working-directory: backend
      - run: uv run ruff format --check .
        working-directory: backend
      - run: uv run pytest --cov=app --cov-report=xml
        working-directory: backend
        env:
          MONGODB_URL: mongodb://localhost:27017
          REDIS_URL: redis://localhost:6379
          SECRET_KEY: test-secret-key-for-ci

  frontend-lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run lint
        working-directory: frontend
      - run: npm run type-check
        working-directory: frontend
      - run: npm run test
        working-directory: frontend

  build:
    needs: [backend-lint-test, frontend-lint-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build
```

### 15.5 Environment Configuration

```bash
# .env.example

# Required
SECRET_KEY=          # Generate with: openssl rand -hex 32

# Optional (defaults shown)
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=macroai
REDIS_URL=redis://localhost:6379
SINGLE_USER_MODE=false
DEBUG=false

# Frontend
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# AI (optional — can also be set per-user in settings UI)
DEFAULT_AI_PROVIDER=
DEFAULT_AI_MODEL=
DEFAULT_AI_API_KEY=
DEFAULT_AI_BASE_URL=
```

---

## 16. Performance Budget

### 16.1 Frontend

| Metric | Budget | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.0s | Lighthouse |
| Largest Contentful Paint (LCP) | < 1.5s | Lighthouse |
| Time to Interactive (TTI) | < 2.0s | Lighthouse |
| Total JS bundle (gzipped) | < 200KB | Webpack analyzer |
| Per-route JS (gzipped) | < 80KB | Next.js build output |
| Image assets | WebP, lazy-loaded | Next.js Image |

**Bundle breakdown target:**
| Chunk | Max Size (gzipped) |
|-------|-------------------|
| React + Next.js runtime | ~90KB |
| ShadCN UI + Radix (unified package) | ~25KB |
| Tremor charts (analytics only) | ~35KB (lazy loaded) |
| TanStack Query | ~12KB |
| Zustand | ~1KB |
| Application code | ~30KB |
| **Total** | **~193KB** |

### 16.2 Backend

| Metric | Budget |
|--------|--------|
| API response (p50) | < 50ms |
| API response (p95) | < 200ms |
| API response (p99) | < 500ms |
| Food search (p95) | < 150ms |
| AI first token | < 2s |
| WebSocket latency | < 50ms |
| MongoDB query (p95) | < 50ms |
| Redis operation (p95) | < 5ms |

### 16.3 Infrastructure (Minimum Requirements)

| Deployment | CPU | RAM | Storage |
|-----------|-----|-----|---------|
| Solo instance | 1 vCPU | 1 GB | 2 GB |
| Household (5 users) | 2 vCPU | 2 GB | 5 GB |
| Community (50 users) | 4 vCPU | 4 GB | 20 GB |

---

## 17. Technology Decision Records

### TDR-001: Zustand over Redux Toolkit

**Context**: The PRD initially specified Redux Toolkit for global state management.

**Decision**: Use Zustand for global client state, TanStack Query for server state.

**Rationale**:
- **90% of "state" is server state** (food logs, nutrition data, user profile). TanStack Query handles this with caching, refetching, and optimistic updates — Redux would duplicate this.
- **Remaining global state is minimal**: auth tokens, UI preferences (sidebar, theme, chat panel), WebSocket connection status. This doesn't warrant Redux's boilerplate (slices, reducers, actions, selectors).
- **Zustand is 1KB** vs Redux Toolkit's ~12KB. Simpler API. No providers needed (can use outside React).
- **DevTools**: Zustand has a devtools middleware that works with Redux DevTools browser extension.

**Trade-offs**: Redux has better ecosystem for complex async workflows (sagas, thunks). If state complexity grows significantly (e.g., complex multi-step form orchestration), we can migrate individual slices.

---

### TDR-002: Next.js 16 (stable)

**Context**: The concept doc specified Next.js 16.

**Decision**: Target Next.js 16 (stable since October 2025, 16.1 shipped December 2025).

**Key features we leverage**:
- **Turbopack** is now the default bundler — faster dev and production builds. Filesystem caching in dev for near-instant restarts.
- **`"use cache"` directive** — all caching is opt-in (no more implicit caching confusion from Next.js 14/15). Mark pages, components, or functions with `"use cache"` to cache them. Dynamic code runs at request time by default.
- **React 19.2** integration with the App Router.
- **Async request APIs** — `cookies()`, `headers()`, `params`, `searchParams` must all be `await`ed (synchronous access removed).

**Migration notes from Next.js 15 patterns**:
- Replace any `experimental_ppr` config with `"use cache"` directives.
- All `cookies()`, `headers()`, `params`, `searchParams` calls must be awaited.
- Run `npx next typegen` for auto-generated `PageProps`, `LayoutProps`, `RouteContext` type helpers.

---

### TDR-003: Native WebSocket over Socket.IO

**Context**: Real-time communication needed for AI chat streaming and live dashboard updates.

**Decision**: Use native WebSocket API (browser) + FastAPI native WebSocket (server).

**Rationale**:
- **Socket.IO adds ~40KB** to the client bundle for features we don't need (auto-reconnect rooms, broadcasting, fallback to long-polling).
- FastAPI has first-class WebSocket support — no adapter needed.
- We implement reconnection logic ourselves (~50 lines) which is simpler and more controllable.
- SSE is available as fallback for environments where WebSocket is blocked.

---

### TDR-004: ARQ over Celery for Task Queue

**Context**: Need background task processing for daily summaries, weekly reports, and reminder dispatch.

**Decision**: Use ARQ (async Redis queue).

**Rationale**:
- **Async-native**: ARQ uses `asyncio`, matching our FastAPI backend. Celery requires threading/multiprocessing.
- **Lightweight**: ARQ is a single dependency. Celery pulls in Kombu, Billiard, Vine, etc.
- **Redis already in stack**: ARQ uses Redis, which we already run for caching. No additional infrastructure.
- **Sufficient for our scale**: ARQ handles thousands of jobs/second. We run < 100 jobs/day.
- **Cron built-in**: ARQ has native cron job support.

**Trade-offs**: Celery has better monitoring (Flower), more mature retry/routing, and scales to massive workloads. If we need these, migration from ARQ to Celery is straightforward since both are Redis-backed.

---

### TDR-005: Beanie ODM + PyMongo Async (Motor Deprecation)

**Context**: Need async MongoDB access from FastAPI. Motor (the traditional async driver) is **being deprecated on May 14, 2026**, with end-of-support on May 14, 2027.

**Decision**: Use Beanie ODM 2.x. Plan migration path to PyMongo `AsyncMongoClient` as Beanie adopts it.

**Rationale**:
- **Pydantic-native documents**: Beanie documents ARE Pydantic models. This means our MongoDB documents share the same validation as our API schemas. No manual mapping.
- **FastAPI integration**: Beanie documents work seamlessly with FastAPI's dependency injection and response serialization.
- **Aggregation pipelines**: Beanie supports raw aggregation pipelines when ODM abstractions aren't enough.
- **Beanie 2.0**: Major version released, undergoing governance transition with new contributors.

**Motor Deprecation Mitigation**:
- MongoDB's official replacement is **PyMongo's `AsyncMongoClient`** — a unified sync/async driver in the `pymongo` package.
- Beanie 2.x currently uses Motor internally. As the Beanie project migrates to PyMongo async, we upgrade Beanie.
- If Beanie does not migrate in time, we have two fallbacks:
  1. **ODMantic** — alternative async ODM also built on Pydantic
  2. **Raw PyMongo `AsyncMongoClient`** — drop the ODM, use Pydantic models with manual document mapping (our service layer already isolates data access)
- Our layered architecture (services → data access) means the ODM is only used in the data access layer. Swapping it does not affect business logic or API routes.

---

### TDR-006: ky over axios/fetch for HTTP client

**Context**: Frontend needs an HTTP client for API calls.

**Decision**: Use ky (tiny fetch wrapper).

**Rationale**:
- **3KB gzipped** vs axios's 13KB. Significant for our performance budget.
- **Fetch-based**: Uses native `fetch` under the hood. No polyfill needed in modern browsers.
- **Hooks system**: `beforeRequest`, `afterResponse`, `beforeError` hooks — perfect for auth token injection and error normalization.
- **Retries built-in**: Configurable retry with backoff for transient failures.
- **TypeScript-first**: Excellent type definitions.

---

### TDR-007: Serwist over next-pwa for PWA support

**Context**: Need Progressive Web App capabilities (install, offline, push notifications).

**Decision**: Use Serwist (actively maintained fork of next-pwa).

**Rationale**:
- **next-pwa is unmaintained**: Last release was years ago. Known issues with App Router.
- **Serwist is the official successor**: Created by a next-pwa maintainer. Full App Router support.
- **Service worker generation**: Automatic precaching of static assets, runtime caching strategies.
- **Push notification support**: Built-in utilities for Web Push API integration.

---

### TDR-008: Tremor over Recharts/Nivo for charts

**Context**: Need charts for macro bars, calorie trends, weight trend, micronutrient heatmap.

**Decision**: Use Tremor.

**Rationale**:
- **Acquired by Vercel (Jan 2025)**: Now fully open-source (MIT license), actively maintained by the Vercel team.
- **Tailwind CSS native**: Styled with Tailwind utilities — perfect match for our stack. No CSS-in-JS or separate theming.
- **ShadCN compatible**: Designed to work alongside ShadCN UI. Shared design language.
- **Dashboard-optimized**: Built specifically for data dashboards — our primary use case. Bar charts, line charts, area charts, donut charts all available with minimal code.
- **Minimal boilerplate**: A Tremor chart is 5-10 lines vs 30+ for Recharts or Nivo.
- **Built on Recharts**: Tremor uses Recharts under the hood, so we get the same rendering quality with a much better DX.

**Considered alternatives**:
- **Recharts**: More control but significantly more code per chart. Tremor wraps it anyway.
- **Nivo**: Rich chart types (waffle, sankey, sunburst) but 80KB+, verbose API, not Tailwind-native.
- **Chart.js / react-chartjs-2**: Canvas-based (not SVG), harder to style with Tailwind, less React-idiomatic.

**Fallback**: If Tremor lacks a specific chart type we need (e.g., micronutrient heatmap), we use Recharts directly for that single chart — they are compatible since Tremor is built on Recharts.

---

### TDR-009: uv over pip/poetry for Python dependency management

**Context**: Need a Python package manager for the backend.

**Decision**: Use uv.

**Rationale**:
- **10-100x faster** than pip for dependency resolution and installation.
- **Lockfile support**: `uv.lock` ensures reproducible builds (like npm's `package-lock.json`).
- **Drop-in replacement**: Compatible with `pyproject.toml` and PEP 621.
- **Used in CI**: Faster CI builds save time and money.
- **Growing ecosystem**: Rapidly becoming the standard Python package manager.

---

### TDR-010: LiteLLM for AI provider abstraction

**Context**: Need to support multiple LLM providers (Claude, OpenAI, local models, etc.) with a unified interface.

**Decision**: Use LiteLLM via the `ChatLiteLLM` LangChain adapter.

**Rationale**:
- **100+ providers supported**: Claude, OpenAI, Azure, Cohere, Ollama, vLLM, llama.cpp, and any OpenAI-compatible API.
- **Unified interface**: Same `completion()` call regardless of provider. Handles auth, formatting, and response normalization.
- **LangChain integration**: `ChatLiteLLM` from `langchain-community` bridges LiteLLM into LangChain's chat model interface, enabling tool binding via `.bind_tools()`.
- **Streaming support**: Async generator streaming works consistently across providers.
- **Cost tracking**: Built-in token counting and cost estimation per provider.
- **Model fallback**: Can configure fallback models if primary fails.
- **Active maintenance**: Frequent releases, responsive maintainers.

**Trade-offs**: Adds a dependency. The `build_chat_model()` factory in `llm.py` isolates LiteLLM behind our own interface, making replacement feasible.

---

### TDR-011: LangGraph for AI agent orchestration

**Context**: The AI assistant needs to read user data (profile, food log, weight history) and write data (log food, update targets) in MongoDB. A simple prompt-stuffing approach (pre-build context string → send to LLM → return text) cannot handle write operations or dynamic data fetching.

**Decision**: Use LangGraph with a ReAct agent pattern and MongoDB checkpointing.

**Rationale**:
- **Tool calling**: `@tool`-decorated Python functions let the LLM call Beanie ODM queries directly. The LLM decides what data to fetch and what actions to take.
- **ReAct loop**: Agent reasons, calls tools, observes results, and repeats until it has enough information to respond. This replaces the fixed context builder.
- **State persistence**: `langgraph-checkpoint-mongodb` saves full conversation state (messages, tool calls, results) to MongoDB per `thread_id`. Gives us multi-turn memory, chat history, and crash recovery for free.
- **Streaming**: `graph.astream(stream_mode="messages")` yields tokens as they're generated — works natively with FastAPI WebSocket handlers.
- **BYO model**: `ChatLiteLLM` as the LLM backbone means any provider works (Claude, GPT, Ollama, etc.).
- **Production-ready**: LangGraph 1.0.8 (Feb 2026) — stable API, active development, large ecosystem.

**Alternatives considered**:
- **Raw LiteLLM tool calling**: LiteLLM supports function calling via its `tools` parameter, but we'd need to build our own execution loop, state management, conversation persistence, and streaming coordination. LangGraph provides all of this.
- **Instructor library**: Great for structured extraction, but doesn't support agentic loops (multi-step tool calling, state persistence).
- **Full LangChain**: Too heavy. LangGraph is the focused orchestration layer without LangChain's broader abstractions (chains, retrievers, agents). We use `langchain-core` for tool/message types only.

**Trade-offs**: Adds `langgraph`, `langchain-core`, `langchain-community`, and `langgraph-checkpoint-mongodb` as dependencies. However, LangGraph is lightweight (the core is ~5K LOC) and the dependency tree is manageable. The graph structure in `graph.py` is ~60 lines — if LangGraph became unmaintained, reimplementing the ReAct loop manually would be straightforward.

**Known issue**: `AsyncMongoDBSaver` was removed in LangGraph 1.0 due to PyMongo driver changes (Motor deprecation). The sync `MongoDBSaver` with its async methods (`aput`/`aget`/`alist`) works correctly in async contexts. Monitor upstream for a native async checkpointer re-addition.

---

*This document defines the technical foundation for MacroAI. It should be read alongside the [PRD](./PRD.md) for feature context. Update this document as architectural decisions evolve during implementation.*
