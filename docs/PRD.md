# MacroAI - Product Requirements Document

**Version**: 1.4
**Last Updated**: 2026-02-09
**Status**: Phase 4 Complete (v1.0.0 Production-Ready)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Goals & Success Metrics](#4-product-goals--success-metrics)
5. [Feature Requirements](#5-feature-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Models](#7-data-models)
8. [API Contracts](#8-api-contracts)
9. [AI Integration Specification](#9-ai-integration-specification)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [MVP Scope (Phase 1)](#11-mvp-scope-phase-1)
12. [Roadmap & Milestones](#12-roadmap--milestones)
13. [Open-Source Strategy](#13-open-source-strategy)
14. [Open Questions & Risks](#14-open-questions--risks)

---

## 1. Executive Summary

**MacroAI** is an open-source, self-hosted, AI-powered fitness and nutrition platform. It combines deep nutritional tracking (macros, micronutrients, supplements, additives) with AI-driven insights, meal planning, and accountability — all while keeping user data private and under their control.

The platform consists of a **Next.js 16 frontend** and a **Python (FastAPI) backend**, backed by **MongoDB** and **Redis**, with a pluggable AI layer supporting both local and cloud LLMs via a bring-your-own-key model.

**Key differentiators over existing tools (MyFitnessPal, Cronometer, etc.):**

- Fully self-hosted and privacy-first — no corporate data harvesting
- AI-native — LLM-powered chat, recommendations, and analysis built into every surface
- Open source — community-driven, extensible, forkable
- Deep micronutrient tracking — vitamins, minerals, supplements, and additive alerts
- Bring-your-own-model — works with local LLMs, Claude, OpenAI, GLM, or any provider
- Single codebase deployable as web, PWA, and mobile

---

## 2. Problem Statement

### Current Landscape

Existing nutrition and fitness tracking apps share common flaws:

1. **Privacy hostile** — User dietary, health, and body data is stored on corporate servers, monetized through ads or sold to third parties
2. **AI-absent or shallow** — Most apps lack meaningful AI integration; those that have it offer generic, non-personalized responses
3. **Closed ecosystems** — No ability to self-host, extend, or integrate with custom workflows
4. **Micronutrient blindness** — Most apps focus on calories and macros while ignoring vitamins, minerals, supplement timing, and nutrient interactions
5. **No accountability systems** — Tracking without follow-through; no reminders, checklists, or AI-driven nudges
6. **Subscription-gated** — Core features locked behind monthly subscriptions

### Core Problem

There is no open-source, self-hosted nutrition platform that combines comprehensive nutrient tracking with personalized AI assistance, accountability systems, and full data ownership.

### Who Feels This Pain

- Privacy-conscious fitness enthusiasts who don't want their health data on corporate servers
- Developers and power users who want to customize and extend their tools
- People serious about nutrition (cutting, bulking, health optimization) who need micronutrient-level tracking
- Users who want AI-powered coaching without paying for proprietary apps with limited AI

---

## 3. Target Users & Personas

### Persona 1: "The Optimizer" (Primary)

- **Profile**: 20-40 year old, active (gym 4-7 days/week), nutrition-conscious
- **Goals**: Fat loss or lean bulk with precise macro/micro tracking
- **Tech comfort**: High — comfortable with Docker, self-hosting, API keys
- **Pain points**: Current apps don't track micronutrients deeply enough; wants AI to analyze their diet and suggest improvements
- **Key needs**: Detailed tracking, AI recommendations, supplement management, progress analytics

### Persona 2: "The Privacy-First User"

- **Profile**: Any age, moderate fitness interest, strong privacy values
- **Goals**: Track nutrition without giving data to corporations
- **Tech comfort**: Moderate — can follow setup instructions, may use Docker
- **Pain points**: Doesn't trust MyFitnessPal/Noom/etc. with health data
- **Key needs**: Self-hosting, data ownership, simple UI, basic AI assistance

### Persona 3: "The Developer/Contributor"

- **Profile**: Software developer, interested in health tech
- **Goals**: Use the platform AND contribute to it
- **Tech comfort**: Very high — will read source code, submit PRs, build plugins
- **Pain points**: No good open-source alternative to build on
- **Key needs**: Clean codebase, good docs, modular architecture, API-first design

### Persona 4: "The Guided Beginner"

- **Profile**: New to fitness/nutrition, overwhelmed by options
- **Goals**: Get started with a structured plan
- **Tech comfort**: Low-moderate — needs clear onboarding
- **Pain points**: Doesn't know what to eat, how much protein they need, what supplements to take
- **Key needs**: AI onboarding, templates, goal-based plans, simple defaults

---

## 4. Product Goals & Success Metrics

### Product Goals

| # | Goal | Description |
|---|------|-------------|
| G1 | Comprehensive tracking | Track macros, micronutrients, supplements, hydration, and additives at Cronometer-level depth |
| G2 | AI-native experience | AI assists with every major user action — logging, planning, analysis, recommendations |
| G3 | Self-hosted & private | Zero reliance on external services (except optional user-provided AI APIs) |
| G4 | Open-source community | Build a contributor ecosystem around the project |
| G5 | Single-codebase multi-platform | Web + PWA + mobile from one Next.js codebase |
| G6 | Easy deployment | One-command Docker setup; no DevOps expertise required |

### Success Metrics (Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| GitHub stars | 1,000 in first 6 months | GitHub API |
| Active self-hosted instances | 500+ | Optional anonymous telemetry (opt-in) |
| Daily active usage per instance | 1+ food logs per day | Local analytics |
| AI chat engagement | 3+ messages per session | Local analytics |
| Contributor PRs | 50+ in first year | GitHub |
| Docker pulls | 5,000+ in first 6 months | Docker Hub |

---

## 5. Feature Requirements

### 5.1 User Management & Profiles

#### 5.1.1 Registration & Authentication

**User Stories:**
- As a user, I want to create an account on my self-hosted instance so I can start tracking
- As an admin, I want to manage user accounts on my instance
- As a user, I want my credentials stored securely

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Email + password registration | Must Have |
| AUTH-02 | JWT-based session management | Must Have |
| AUTH-03 | Password hashing (bcrypt/argon2) | Must Have |
| AUTH-04 | Single-user mode (no registration needed for solo instances) | Should Have |
| AUTH-05 | Multi-user support (household/family instances) | Should Have |
| AUTH-06 | OAuth providers (Google, GitHub) — optional | Nice to Have |
| AUTH-07 | Admin role for instance management | Should Have |

**Acceptance Criteria:**
- User can register with email and password
- Passwords are hashed with bcrypt or argon2 (never stored in plaintext)
- JWT tokens expire after configurable duration (default: 7 days)
- Single-user mode skips registration flow and auto-authenticates

#### 5.1.2 User Profile

**User Stories:**
- As a user, I want to set my physical stats so AI can personalize recommendations
- As a user, I want to update my goals (cut, bulk, maintain) and have targets recalculate

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| PROF-01 | Store age, height, weight, gender | Must Have |
| PROF-02 | Activity level selection | Must Have |
| PROF-03 | Goal selection (fat loss, maintenance, lean bulk, aggressive bulk) | Must Have |
| PROF-04 | Auto-calculate TDEE using Mifflin-St Jeor equation | Must Have |
| PROF-05 | Auto-calculate macro targets based on goal + body weight | Must Have |
| PROF-06 | Location / timezone | Should Have |
| PROF-07 | Dietary restrictions (vegan, vegetarian, allergies, intolerances) | Should Have |
| PROF-08 | Food preferences (likes, dislikes, cuisine types) | Should Have |
| PROF-09 | Cooking skill level & available equipment | Nice to Have |
| PROF-10 | Budget preferences | Nice to Have |
| PROF-11 | Weight history tracking with graph | Must Have |
| PROF-12 | Body measurement tracking (waist, chest, arms, etc.) | Should Have |

**Acceptance Criteria:**
- TDEE auto-calculates when weight, height, age, gender, and activity level are set
- Changing goal recalculates macro targets immediately
- Weight entries are timestamped and graphable over time
- Profile data is used as context for AI interactions

---

### 5.2 Nutrition & Macro Tracking

#### 5.2.1 Food Logging

**User Stories:**
- As a user, I want to log foods I eat with accurate nutritional data
- As a user, I want to search a food database to find items quickly
- As a user, I want to see my daily totals update in real-time as I log

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| LOG-01 | Search food database by name | Must Have |
| LOG-02 | Log food with serving size (grams, cups, pieces, etc.) | Must Have |
| LOG-03 | Assign food to meal (breakfast, lunch, dinner, snacks, custom) | Must Have |
| LOG-04 | Edit and delete logged entries | Must Have |
| LOG-05 | Copy meals from previous days | Should Have |
| LOG-06 | Quick-add calories/macros without searching | Should Have |
| LOG-07 | Create custom foods with full nutrient profile | Must Have |
| LOG-08 | Create recipes (combine multiple foods) | Should Have |
| LOG-09 | Barcode scanning (mobile/PWA) | Nice to Have |
| LOG-10 | AI-assisted logging ("I had 2 eggs and toast") | Should Have |
| LOG-11 | Favorite foods for quick access | Should Have |
| LOG-12 | Recent foods list | Must Have |

**Acceptance Criteria:**
- Food search returns results within 300ms
- Logged food immediately updates daily macro/calorie totals
- All 4 tiers of nutrient data tracked per the extended tracking guide:
  - **Tier 1**: Calories, protein, carbs, fat, fiber
  - **Tier 2**: Sugar (total + added), saturated fat, sodium, caffeine, trans fat
  - **Tier 3**: Vitamins (A, B-complex, C, D, E, K), minerals (calcium, magnesium, iron, zinc, potassium, selenium, iodine)
  - **Tier 4**: Additive alerts (artificial sweeteners, HFCS, sodium nitrate, MSG)

#### 5.2.2 Food Database

**User Stories:**
- As a user, I want access to a comprehensive food database so I don't have to enter nutrition data manually
- As a user, I want to add custom foods and share them across my instance

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| FDB-01 | Seed database with USDA FoodData Central data | Must Have |
| FDB-02 | Include common branded foods and supplements | Should Have |
| FDB-03 | Support for custom user-created foods | Must Have |
| FDB-04 | Full micronutrient data per food item (50+ nutrients) | Must Have |
| FDB-05 | Serving size options per food (100g, cup, piece, tbsp, etc.) | Must Have |
| FDB-06 | Supplement database (whey, creatine, vitamins, etc.) | Should Have |
| FDB-07 | Periodic database updates from USDA API | Nice to Have |
| FDB-08 | Community food submissions (multi-user instances) | Nice to Have |

**Acceptance Criteria:**
- Database ships with 8,000+ common foods from USDA
- Each food item includes macros + at least 25 micronutrients where data is available
- Supplement entries include timing recommendations and interaction notes
- Users can create and save custom foods that persist across sessions

#### 5.2.3 Macro & Nutrient Targets

**User Stories:**
- As a user, I want to see my progress toward daily macro targets
- As a user, I want alerts when I'm approaching limits (sodium, sugar, caffeine)

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| TGT-01 | Display daily macro progress (protein, carbs, fat, calories) as progress bars | Must Have |
| TGT-02 | Display fiber and sugar tracking | Must Have |
| TGT-03 | Configurable macro targets (auto-calculated or manual override) | Must Have |
| TGT-04 | Alert when sodium > 2300mg | Should Have |
| TGT-05 | Alert when caffeine > 400mg | Should Have |
| TGT-06 | Alert when added sugar > 25g | Should Have |
| TGT-07 | Weekly micronutrient summary (vitamin D, magnesium, iron, zinc, etc.) | Should Have |
| TGT-08 | Omega-3 tracking (EPA + DHA) | Should Have |
| TGT-09 | Hydration tracking | Should Have |
| TGT-10 | Additive flagging (Tier 4 alerts) | Nice to Have |

**Acceptance Criteria:**
- Macro progress bars update in real-time as food is logged
- Alerts are non-blocking (notification/toast, not modal)
- Weekly micronutrient view shows averages vs targets with color coding (red = deficient, yellow = low, green = on target)

---

### 5.3 Food Intelligence System (AI)

#### 5.3.1 Diet Recommendations

**User Stories:**
- As a user, I want AI to suggest foods that fill gaps in my nutrition
- As a user, I want AI to recommend what to eat based on my remaining macros for the day

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| REC-01 | "What should I eat?" — AI suggests meals based on remaining macros/calories | Must Have |
| REC-02 | Deficiency detection — identify nutrients consistently below target | Should Have |
| REC-03 | Food suggestions to fix deficiencies (e.g., "You're low on magnesium — try pumpkin seeds or spinach") | Should Have |
| REC-04 | Foods to reduce/avoid based on excess intake | Should Have |
| REC-05 | AI-generated meal plans (daily or weekly) | Should Have |
| REC-06 | Suggestions respect dietary restrictions and preferences | Must Have |
| REC-07 | Supplement recommendations based on gaps | Nice to Have |
| REC-08 | Adjust recommendations based on training intensity and phase (cut/bulk) | Should Have |

**Acceptance Criteria:**
- Recommendations reference the user's actual logged data from the past 7 days
- Suggestions respect all dietary restrictions set in profile
- AI cites specific nutrient data (e.g., "You averaged 180mg magnesium this week — target is 400mg")
- Recommendations include specific food items with quantities

#### 5.3.2 Natural Language Food Logging

**User Stories:**
- As a user, I want to describe my meal in plain English and have AI parse it into food log entries

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| NLP-01 | Parse "I had 2 eggs, toast with butter, and a coffee" into structured food entries | Should Have |
| NLP-02 | AI infers reasonable serving sizes when not specified | Should Have |
| NLP-03 | User confirms/edits AI-parsed entries before saving | Must Have (if NLP-01 is implemented) |
| NLP-04 | Learn from user corrections over time | Nice to Have |

**Acceptance Criteria:**
- Parsed results shown in editable preview before committing to log
- Accuracy >= 85% on common food descriptions
- Handles meals with 1-10 items

---

### 5.4 AI Assistant & Chat System

#### 5.4.1 Chat Interface

**User Stories:**
- As a user, I want to chat with an AI assistant that knows my nutrition data, goals, and history
- As a user, I want real-time streaming responses

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| CHAT-01 | Persistent chat interface accessible from any page | Must Have |
| CHAT-02 | Real-time streaming responses via WebSocket | Must Have |
| CHAT-03 | Chat history preserved across sessions | Must Have |
| CHAT-04 | Context injection — AI has access to user profile, recent logs, targets, progress | Must Have |
| CHAT-05 | Conversation threading / topics | Nice to Have |
| CHAT-06 | Quick action buttons (e.g., "Log this meal", "Show my macros today") | Should Have |
| CHAT-07 | AI can trigger actions (log food, set reminder, generate report) | Nice to Have |
| CHAT-08 | Markdown rendering in chat responses | Must Have |
| CHAT-09 | Chat works with any configured LLM provider | Must Have |

**Acceptance Criteria:**
- First token appears within 2 seconds of sending message
- Chat context includes: user profile, today's food log, current macro progress, 7-day trends, active goals
- Conversation history stored in MongoDB, retrievable by session
- Chat degrades gracefully when no AI provider is configured (shows setup prompt)

#### 5.4.2 AI Context & Memory

**User Stories:**
- As a user, I want the AI to remember my preferences and past conversations
- As a user, I want the AI to reference my actual data when giving advice

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| CTX-01 | System prompt includes user profile, goals, dietary restrictions | Must Have |
| CTX-02 | Include today's food log and macro progress in context | Must Have |
| CTX-03 | Include 7-day nutrition averages in context | Should Have |
| CTX-04 | Include weight trend in context | Should Have |
| CTX-05 | Conversation memory within session | Must Have |
| CTX-06 | Long-term memory (key facts persisted across sessions) | Nice to Have |
| CTX-07 | RAG over knowledge base (nutrition docs) | Nice to Have |

**Acceptance Criteria:**
- AI never gives advice that contradicts user's dietary restrictions
- AI references actual numbers from user data (not generic advice)
- Context window management handles token limits gracefully (summarization for older messages)

---

### 5.5 Accountability & Automation

#### 5.5.1 Reminders & Notifications

**User Stories:**
- As a user, I want reminders to take supplements, drink water, and log meals
- As a user, I want to customize when and what I'm reminded about

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| REM-01 | Configurable meal reminders (breakfast, lunch, dinner, snacks) | Should Have |
| REM-02 | Supplement reminders with specific timing (e.g., "Take Vitamin D at 1:30 PM") | Should Have |
| REM-03 | Hydration reminders (configurable interval) | Should Have |
| REM-04 | Sleep reminder | Nice to Have |
| REM-05 | Pre-workout nutrition reminder | Nice to Have |
| REM-06 | Browser push notifications (PWA) | Should Have |
| REM-07 | In-app notification center | Must Have |
| REM-08 | Reminder snooze and dismiss | Should Have |

**Acceptance Criteria:**
- Reminders fire at configured times (timezone-aware)
- Push notifications work on supported browsers when app is closed (PWA)
- Users can enable/disable individual reminders

#### 5.5.2 Daily Checklist

**User Stories:**
- As a user, I want a daily checklist of nutrition tasks to complete
- As a user, I want the checklist to auto-populate based on my targets and supplements

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| CHK-01 | Default daily checklist items: protein target, supplement stack, hydration | Should Have |
| CHK-02 | Auto-check items based on logged data (e.g., protein goal auto-checks when 170g logged) | Should Have |
| CHK-03 | Custom checklist items | Should Have |
| CHK-04 | Streak tracking (consecutive days completing checklist) | Nice to Have |
| CHK-05 | AI-generated daily focus (e.g., "Focus on magnesium today — you've been low all week") | Nice to Have |

**Acceptance Criteria:**
- Checklist resets daily based on user's configured "nutrition day start" time
- Auto-check triggers within 30 seconds of logging relevant data
- Completion percentage visible on dashboard

---

### 5.6 Dashboard & Analytics

#### 5.6.1 Daily Dashboard

**User Stories:**
- As a user, I want a single-page view of today's nutrition status
- As a user, I want to see at a glance if I'm on track

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-01 | Calorie and macro progress rings/bars | Must Have |
| DASH-02 | Today's meal log summary | Must Have |
| DASH-03 | Remaining macros display ("You have 45g protein left") | Must Have |
| DASH-04 | Daily checklist widget | Should Have |
| DASH-05 | AI insight card (one daily AI-generated tip based on data) | Should Have |
| DASH-06 | Quick food log entry from dashboard | Must Have |
| DASH-07 | Water intake tracker | Should Have |
| DASH-08 | Today's supplement checklist | Should Have |

**Acceptance Criteria:**
- Dashboard loads within 1 second
- All data is real-time (no stale caches)
- Mobile-responsive layout

#### 5.6.2 Analytics & Trends

**User Stories:**
- As a user, I want to see how my nutrition has trended over weeks and months
- As a user, I want to correlate weight changes with nutrition data

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| ANA-01 | Weekly macro averages (bar chart) | Must Have |
| ANA-02 | Monthly calorie trend (line chart) | Must Have |
| ANA-03 | Weight trend chart (with rolling average) | Must Have |
| ANA-04 | Protein distribution across meals | Should Have |
| ANA-05 | Micronutrient heatmap (weekly view showing deficiencies) | Should Have |
| ANA-06 | Streak and consistency metrics | Nice to Have |
| ANA-07 | AI-generated weekly summary report | Should Have |
| ANA-08 | Exportable reports (PDF or CSV) | Nice to Have |
| ANA-09 | Custom date range selection | Must Have |
| ANA-10 | Compare periods (this week vs last week) | Nice to Have |

**Acceptance Criteria:**
- Charts render with 90+ days of data without performance degradation
- Weight trend uses 7-day rolling average to smooth daily fluctuations
- Weekly AI summary references specific data points and trends

---

### 5.7 Onboarding & Templates

#### 5.7.1 Guided Onboarding

**User Stories:**
- As a new user, I want a step-by-step setup that gets me tracking within 5 minutes
- As a new user, I want the system to calculate my targets so I don't have to figure it out myself

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| ONB-01 | Step-by-step profile setup wizard | Must Have |
| ONB-02 | Goal selection with visual explanations (cut, maintain, bulk) | Must Have |
| ONB-03 | Auto-calculated targets shown with "why these numbers" explanations | Must Have |
| ONB-04 | AI provider setup (or skip for later) | Must Have |
| ONB-05 | Template selection (cut template, bulk template, health template) | Should Have |
| ONB-06 | Sample day pre-loaded (show what a logged day looks like) | Nice to Have |
| ONB-07 | Quick tour / feature highlights | Should Have |

**Acceptance Criteria:**
- Complete onboarding in < 5 minutes
- User has working macro targets after onboarding
- Skip option available at every step

#### 5.7.2 Goal & Plan Templates

**User Stories:**
- As a user, I want to select a pre-built plan that matches my goal
- As a user, I want AI to generate a custom plan based on my profile

**Requirements:**
| ID | Requirement | Priority |
|----|-------------|----------|
| TPL-01 | Pre-built templates: fat loss, lean bulk, maintenance, health optimization | Should Have |
| TPL-02 | Templates include macro targets, food suggestions, supplement stack, meal timing | Should Have |
| TPL-03 | AI-generated custom plan based on profile + preferences | Should Have |
| TPL-04 | Templates are editable after selection | Must Have (if TPL-01 implemented) |

**Acceptance Criteria:**
- Each template includes at minimum: daily calorie target, macro split, protein distribution schedule, and top 10 recommended foods
- AI-generated plans are based on user profile data (not generic)

---

## 6. Technical Architecture

### 6.1 System Overview

```
                    +-------------------+
                    |   Web Browser /   |
                    |   PWA / Mobile    |
                    +---------+---------+
                              |
                              | HTTPS
                              |
                    +---------+---------+
                    |   Next.js 16      |
                    |   (Frontend +     |
                    |    SSR + API      |
                    |    Routes)        |
                    +---------+---------+
                              |
                              | HTTP/WebSocket
                              |
                    +---------+---------+
                    |   FastAPI         |
                    |   (Python Backend)|
                    |                   |
                    |   - REST API      |
                    |   - WebSocket     |
                    |   - AI Routing    |
                    |   - Task Queue    |
                    +---------+---------+
                              |
                +-------------+-------------+
                |                           |
        +-------+-------+          +-------+-------+
        |   MongoDB     |          |   Redis       |
        |               |          |               |
        |  - User data  |          |  - Sessions   |
        |  - Food logs  |          |  - Cache      |
        |  - Food DB    |          |  - Task queue  |
        |  - Chat hist  |          |  - Rate limits |
        |  - Analytics  |          |  - Real-time   |
        +---------------+          +---------------+
                |
        +-------+-------+
        |   AI Providers |
        |                |
        |  - Local LLM   |
        |  - Claude API  |
        |  - OpenAI API  |
        |  - GLM API     |
        +----------------+
```

### 6.2 Frontend Architecture

**Stack:**
- **Framework**: Next.js 16 (App Router, React Server Components, Turbopack, `"use cache"`)
- **Styling**: Tailwind CSS 4
- **Components**: ShadCN UI (Radix primitives)
- **State Management**: Redux Toolkit (global state) + React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts or Nivo
- **Real-time**: WebSocket client (native or Socket.IO client)
- **PWA**: next-pwa for service worker, offline support, push notifications

**Directory Structure:**
```
frontend/
  src/
    app/                    # Next.js App Router pages
      (auth)/               # Auth pages (login, register)
      (dashboard)/          # Authenticated pages
        dashboard/          # Main dashboard
        log/                # Food logging
        analytics/          # Charts and trends
        chat/               # AI chat
        profile/            # User profile
        settings/           # App settings
      api/                  # Next.js API routes (BFF proxy)
    components/
      ui/                   # ShadCN primitives
      features/             # Feature-specific components
        food-log/
        dashboard/
        chat/
        analytics/
        profile/
      layout/               # Layout components (nav, sidebar)
    lib/
      api/                  # API client (fetch wrapper)
      store/                # Redux store + slices
      hooks/                # Custom React hooks
      utils/                # Utility functions
      validators/           # Zod schemas
    types/                  # TypeScript type definitions
```

### 6.3 Backend Architecture

**Stack:**
- **Framework**: FastAPI (Python 3.12+)
- **Database ORM**: Motor (async MongoDB driver) + Beanie ODM
- **Caching**: Redis via aioredis
- **Task Queue**: Celery or ARQ (async Redis queue)
- **WebSocket**: FastAPI WebSocket + Redis pub/sub for scaling
- **AI Client**: LiteLLM (unified interface for multiple LLM providers)
- **Auth**: python-jose (JWT), passlib (hashing)
- **Validation**: Pydantic v2

**Directory Structure:**
```
backend/
  app/
    main.py                 # FastAPI app entry
    config.py               # Settings (env-based)
    database.py             # MongoDB connection
    redis.py                # Redis connection
    api/
      v1/
        routes/
          auth.py           # Auth endpoints
          users.py          # User profile endpoints
          food_log.py       # Food logging endpoints
          food_db.py        # Food database search
          nutrition.py      # Targets, analytics
          chat.py           # AI chat (WebSocket + REST)
          reminders.py      # Reminder CRUD
          analytics.py      # Analytics/reports
        dependencies.py     # Auth dependencies, rate limiting
    models/                 # Beanie document models
      user.py
      food_item.py
      food_log_entry.py
      chat_message.py
      reminder.py
    schemas/                # Pydantic request/response schemas
    services/               # Business logic layer
      nutrition.py          # Macro/micro calculations
      ai/
        router.py           # LLM provider routing
        context.py          # Context builder for AI
        prompts.py          # System prompts
      food_search.py        # Food database search logic
      analytics.py          # Analytics computation
      reminders.py          # Reminder scheduling
    tasks/                  # Background tasks
      weekly_report.py
      reminder_dispatch.py
    seeds/                  # Database seed data
      usda_foods.json
      supplements.json
```

### 6.4 Infrastructure

**Docker Compose Setup:**
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [mongodb, redis]
    environment:
      - MONGODB_URL=mongodb://mongodb:27017/macroai
      - REDIS_URL=redis://redis:6379

  mongodb:
    image: mongo:7
    volumes: ["mongo_data:/data/db"]
    ports: ["27017:27017"]

  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
    ports: ["6379:6379"]
```

**Deployment Options:**
1. **Docker Compose** (recommended) — single command: `docker compose up`
2. **Manual** — Run frontend/backend separately, bring own MongoDB/Redis
3. **Cloud** — Deploy to any cloud with Docker support (Railway, Fly.io, DigitalOcean)

---

## 7. Data Models

### 7.1 User

```
User {
  _id: ObjectId
  email: string (unique)
  password_hash: string
  role: "admin" | "user"
  created_at: datetime
  updated_at: datetime

  profile: {
    display_name: string
    age: int
    height_cm: float
    weight_kg: float
    gender: "male" | "female" | "other"
    activity_level: "sedentary" | "light" | "moderate" | "very_active" | "extreme"
    timezone: string (e.g., "America/Port_of_Spain")
    location: string (optional)
  }

  goals: {
    phase: "cut" | "maintain" | "lean_bulk" | "aggressive_bulk"
    target_weight_kg: float (optional)
    custom_targets: boolean  // if true, use manual targets instead of auto-calculated
  }

  targets: {
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    fiber_g: int
    sugar_limit_g: int
    sodium_limit_mg: int
    caffeine_limit_mg: int
    water_ml: int
  }

  preferences: {
    dietary_restrictions: string[]  // ["vegetarian", "lactose_intolerant"]
    food_likes: string[]
    food_dislikes: string[]
    cuisine_types: string[]
    cooking_skill: "minimal" | "intermediate" | "advanced"
    meal_frequency: int
    nutrition_day_start_hour: int  // e.g., 4 for 4 AM
  }

  ai_config: {
    provider: "claude" | "openai" | "glm" | "local" | "custom"
    api_key: string (encrypted)
    model: string  // e.g., "claude-sonnet-4-5-20250929"
    base_url: string (optional, for local/custom)
  }
}
```

### 7.2 Food Item (Database)

```
FoodItem {
  _id: ObjectId
  source: "usda" | "user" | "community"
  usda_fdc_id: int (optional)
  name: string
  brand: string (optional)
  category: string  // "protein", "grain", "vegetable", "fruit", "dairy", "supplement", etc.
  created_by: ObjectId (optional, for user-created)

  serving_options: [
    {
      label: string  // "100g", "1 medium", "1 cup", "1 scoop"
      grams: float   // weight in grams for this serving
    }
  ]

  // Per 100g values
  nutrients: {
    // Tier 1 - Core Macros
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float

    // Tier 2 - Detailed Macros
    sugar_total_g: float
    sugar_added_g: float
    saturated_fat_g: float
    trans_fat_g: float
    sodium_mg: float
    caffeine_mg: float
    cholesterol_mg: float

    // Tier 3 - Vitamins
    vitamin_a_mcg: float
    vitamin_c_mg: float
    vitamin_d_iu: float
    vitamin_e_mg: float
    vitamin_k_mcg: float
    vitamin_b1_mg: float
    vitamin_b2_mg: float
    vitamin_b3_mg: float
    vitamin_b5_mg: float
    vitamin_b6_mg: float
    vitamin_b7_mcg: float
    vitamin_b9_mcg: float
    vitamin_b12_mcg: float

    // Tier 3 - Minerals
    calcium_mg: float
    iron_mg: float
    magnesium_mg: float
    phosphorus_mg: float
    potassium_mg: float
    zinc_mg: float
    selenium_mcg: float
    copper_mcg: float
    manganese_mg: float
    chromium_mcg: float
    iodine_mcg: float

    // Tier 3 - Fatty Acids
    omega3_mg: float
    omega6_mg: float
    monounsaturated_fat_g: float
    polyunsaturated_fat_g: float
  }

  // Tier 4 - Additives (flags)
  additives: string[]  // ["aspartame", "sucralose", "msg", "sodium_nitrate", "hfcs"]

  // Supplement-specific
  supplement_info: {
    timing: string  // "with food", "empty stomach", "before bed"
    interactions: string[]  // ["separate from calcium", "take with fat"]
    form: string  // "capsule", "powder", "softgel"
  } (optional)
}
```

### 7.3 Food Log Entry

```
FoodLogEntry {
  _id: ObjectId
  user_id: ObjectId
  date: date  // nutrition day date
  meal: "breakfast" | "lunch" | "dinner" | "snack" | string (custom)
  logged_at: datetime

  food_item_id: ObjectId
  food_name: string  // denormalized for fast reads
  serving_label: string  // "1 medium", "100g"
  serving_grams: float
  quantity: float  // number of servings

  // Calculated values (serving_grams * quantity * nutrient_per_100g / 100)
  nutrients: {
    // Tier 1 — Core Macros
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float

    // Tier 2 — Extended (tracked since Phase 2)
    sugar_g: float
    sodium_mg: float
    saturated_fat_g: float
  }

  notes: string (optional)
  ai_logged: boolean  // true if logged via NLP
}
```

### 7.4 Weight Entry

```
WeightEntry {
  _id: ObjectId
  user_id: ObjectId
  date: date
  weight_kg: float
  notes: string (optional)
  logged_at: datetime
}
```

### 7.5 Chat Message

```
ChatMessage {
  _id: ObjectId
  user_id: ObjectId
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: datetime
  model_used: string (optional)  // e.g., "claude-sonnet-4-5-20250929"
  token_count: int (optional)
  context_snapshot: {  // What data the AI had access to
    daily_macros: object
    profile_summary: string
  } (optional)
}
```

### 7.6 Reminder

```
Reminder {
  _id: ObjectId
  user_id: ObjectId
  type: "meal" | "supplement" | "hydration" | "sleep" | "workout" | "custom"
  title: string
  description: string (optional)
  time: string  // "14:30" (24hr format)
  days: string[]  // ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  enabled: boolean
  created_at: datetime
}
```

### 7.7 Checklist Item

```
ChecklistItem {
  _id: ObjectId
  user_id: ObjectId
  date: date
  title: string
  type: "auto" | "custom"
  checked: boolean
  auto_check_field: string  // e.g. "protein_g", "calories", "fiber_g" (auto items only)
  auto_check_target: float  // e.g. 170 (auto items only)
  created_at: datetime
}
```

**Auto-check behavior**: Auto items are evaluated on every GET /checklist request by comparing the user's daily food log totals against the `auto_check_target` (90% threshold for calorie/protein targets). Default auto items generated daily: calorie target, protein target, 3+ meals, 25g+ fiber.

### 7.8 Recipe

```
Recipe {
  _id: ObjectId
  user_id: ObjectId
  name: string
  description: string (optional)
  servings: int (default 1)
  ingredients: [RecipeIngredient]
  total: NutrientTotals  // auto-calculated sum of all ingredients
  per_serving: NutrientTotals  // total / servings
  created_at: datetime
  updated_at: datetime
}

RecipeIngredient {
  food_id: string
  food_name: string
  quantity: float  // number of servings of the food item
  serving_label: string
  calories: float
  protein_g: float
  carbs_g: float
  fat_g: float
  fiber_g: float
  sugar_g: float
  sodium_mg: float
  saturated_fat_g: float
}

NutrientTotals {
  calories: float
  protein_g: float
  carbs_g: float
  fat_g: float
  fiber_g: float
  sugar_g: float
  sodium_mg: float
  saturated_fat_g: float
}
```

### 7.9 Daily Summary (Pre-computed)

```
DailySummary {
  _id: ObjectId
  user_id: ObjectId
  date: date

  totals: {
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_total_g: float
    sodium_mg: float
    caffeine_mg: float
    // ... all nutrients summed
  }

  targets: {
    // Snapshot of user targets on this date
    calories: int
    protein_g: int
    // ...
  }

  meals_logged: int
  checklist_completion: float  // 0.0 - 1.0
  water_ml: int
  ai_insight: string (optional)  // Daily AI-generated insight
}
```

---

## 8. API Contracts

### 8.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| POST | `/api/v1/auth/refresh` | Refresh JWT token |
| POST | `/api/v1/auth/logout` | Invalidate token |

### 8.2 User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user profile |
| PATCH | `/api/v1/users/me` | Update profile |
| PATCH | `/api/v1/users/me/targets` | Update nutrition targets |
| PATCH | `/api/v1/users/me/preferences` | Update preferences |
| PATCH | `/api/v1/users/me/ai-config` | Update AI provider settings |
| GET | `/api/v1/users/me/tdee` | Calculate TDEE based on current profile |

### 8.3 Food Database

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/foods/search?q={query}&limit=20` | Search food database |
| GET | `/api/v1/foods/{id}` | Get food item details |
| POST | `/api/v1/foods` | Create custom food |
| PATCH | `/api/v1/foods/{id}` | Update custom food |
| DELETE | `/api/v1/foods/{id}` | Delete custom food |
| GET | `/api/v1/foods/recent` | Get recently logged foods |
| GET | `/api/v1/foods/favorites` | Get favorite foods |
| POST | `/api/v1/foods/{id}/favorite` | Toggle favorite |

### 8.4 Food Logging

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/food-log?date={YYYY-MM-DD}` | Get day's food log |
| POST | `/api/v1/food-log` | Log a food entry |
| PATCH | `/api/v1/food-log/{id}` | Update log entry |
| DELETE | `/api/v1/food-log/{id}` | Delete log entry |
| GET | `/api/v1/food-log/totals?date={YYYY-MM-DD}` | Get daily nutrient totals |
| GET | `/api/v1/food-log/range-totals?start={date}&end={date}` | Get aggregated totals over date range |
| GET | `/api/v1/food-log/insights` | Get rule-based daily insights |
| GET | `/api/v1/food-log/alerts` | Get nutrient alerts (sodium, sugar, sat fat, fiber) |

### 8.5 Nutrition & Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/nutrition/daily?date={YYYY-MM-DD}` | Get daily nutrient totals |
| GET | `/api/v1/nutrition/weekly?start={date}` | Get weekly averages |
| GET | `/api/v1/nutrition/trends?start={date}&end={date}&nutrients=calories,protein` | Get trend data |
| GET | `/api/v1/nutrition/micronutrient-report?period=7d` | Micronutrient summary |

### 8.6 Weight Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/weight?start={date}&end={date}` | Get weight entries |
| POST | `/api/v1/weight` | Log weight |
| DELETE | `/api/v1/weight/{id}` | Delete weight entry |
| GET | `/api/v1/weight/trend` | Get weight trend with rolling average |

### 8.7 AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| WebSocket | `/api/v1/chat/ws` | Real-time chat connection |
| GET | `/api/v1/chat/sessions` | List chat sessions |
| GET | `/api/v1/chat/sessions/{id}/messages` | Get session messages |
| POST | `/api/v1/chat/message` | Send message (REST fallback) |
| DELETE | `/api/v1/chat/sessions/{id}` | Delete chat session |

### 8.8 Reminders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reminders` | List all reminders |
| POST | `/api/v1/reminders` | Create reminder |
| PATCH | `/api/v1/reminders/{id}` | Update reminder |
| DELETE | `/api/v1/reminders/{id}` | Delete reminder |
| PATCH | `/api/v1/reminders/{id}/toggle` | Enable/disable reminder |

### 8.9 Checklist

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/checklist?date={YYYY-MM-DD}` | Get daily checklist (auto-generates defaults, runs auto-check) |
| PATCH | `/api/v1/checklist/{id}/toggle` | Toggle custom checklist item |
| POST | `/api/v1/checklist` | Add custom checklist item |
| DELETE | `/api/v1/checklist/{id}` | Delete custom checklist item |
| GET | `/api/v1/checklist/streak` | Get consecutive-day streak (>= 80% completion) |

### 8.10 Goal Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/templates` | List all pre-built goal templates |
| GET | `/api/v1/templates/{id}` | Get template details |
| POST | `/api/v1/templates/{id}/apply` | Apply template — calculates TDEE and sets macro targets |

### 8.11 Reports & Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reports/weekly?start={YYYY-MM-DD}` | Get weekly report (breakdown, averages, adherence, highlights) |
| GET | `/api/v1/reports/export?start={date}&end={date}&format=csv` | Export food log as CSV (StreamingResponse) |
| GET | `/api/v1/users/me/export` | Full JSON data export (profile, food logs, weight, recipes, reminders, checklist) |

### 8.12 Recipes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/recipes` | List user's recipes |
| GET | `/api/v1/recipes/{id}` | Get recipe detail |
| POST | `/api/v1/recipes` | Create recipe (auto-calculates nutrients from ingredients) |
| PATCH | `/api/v1/recipes/{id}` | Update recipe (recalculates if ingredients change) |
| DELETE | `/api/v1/recipes/{id}` | Delete recipe |
| POST | `/api/v1/recipes/{id}/log` | Log recipe as food log entry (meal + servings) |

### 8.13 AI Recommendations (via Chat)

AI recommendations are delivered through the chat agent's tool calling rather than dedicated REST endpoints. The agent has access to these tools:

| Tool | Description |
|------|-------------|
| `suggest_meals` | Calculates remaining macro budget, suggests foods from DB |
| `get_nutrient_alerts` | Checks daily totals against nutrient limits |
| `get_weekly_report` | Generates weekly report data for the agent to summarize |
| `quick_log` | NLP food logging — parses natural language descriptions into food entries |

---

## 9. AI Integration Specification

### 9.1 Architecture: LLM Abstraction Layer

```
User Request
     |
     v
AI Router (services/ai/router.py)
     |
     +-- Validates provider config
     +-- Builds context (services/ai/context.py)
     +-- Selects prompt template (services/ai/prompts.py)
     +-- Routes to provider via LiteLLM
     |
     v
LiteLLM (unified SDK)
     |
     +-- Claude API (Anthropic)
     +-- OpenAI API
     +-- GLM API
     +-- Local LLM (Ollama, llama.cpp, vLLM)
     +-- Any OpenAI-compatible API
     |
     v
Response streamed back to user
```

### 9.2 Provider Configuration

Users configure their AI provider through the settings UI:

```json
{
  "provider": "claude",
  "api_key": "sk-ant-...",
  "model": "claude-sonnet-4-5-20250929",
  "base_url": null,
  "max_tokens": 4096,
  "temperature": 0.7
}
```

**Supported providers:**
| Provider | Config Required | Model Examples | Notes |
|----------|----------------|----------------|-------|
| Claude (Anthropic) | API key | claude-sonnet-4-5-20250929 | Recommended default |
| OpenAI | API key | gpt-4o, gpt-4-turbo | GPT-4o, GPT-4 |
| GLM/Zhipu/Z.AI | API key | glm-4-plus, glm-4-air, glm-4-flash | Chinese LLM, uses `zai/` prefix via LiteLLM |
| Ollama (local) | Base URL | llama3, mistral, etc. | No API key needed |
| vLLM (local) | Base URL | Any supported | OpenAI-compatible |
| llama.cpp (local) | Base URL | Any supported | OpenAI-compatible |
| Custom | Base URL + optional API key | Any | Any OpenAI-compatible endpoint |

### 9.3 Context Building

Every AI interaction includes structured context built from user data:

```
System Prompt:
  - Platform: "You are MacroAI, a nutrition and fitness AI assistant..."
  - Rules: dietary restriction awareness, evidence-based advice, reference user data

User Context (injected per-request):
  - Profile: age, gender, weight, height, activity level
  - Goal: current phase (cut/bulk/maintain), target weight
  - Today's Log: meals logged, current macro totals, remaining
  - Targets: calorie/macro targets with % completion
  - 7-Day Averages: recent nutrition trends
  - Weight Trend: last 7 weigh-ins with direction
  - Deficiencies: nutrients consistently below target
  - Dietary Restrictions: allergies, preferences
  - Supplement Stack: current supplements and timing
```

### 9.4 Prompt Templates

The AI agent has **12 tools** organized by function:

| Tool | Type | Description |
|------|------|-------------|
| `get_user_profile` | Read | User profile, stats, targets |
| `get_todays_food_log` | Read | All food entries for today |
| `get_daily_totals` | Read | Aggregated daily macros/calories |
| `get_weekly_averages` | Read | 7-day nutrition averages |
| `get_weekly_report` | Read | Full weekly report data |
| `get_weight_trend` | Read | Weight entries with trend direction |
| `get_nutrient_alerts` | Read | Checks against nutrient limits (sodium, sugar, sat fat, fiber) |
| `search_food_database` | Read | Text search on food DB |
| `log_food` | Write | Log a food entry with full macros |
| `quick_log` | Write | NLP food logging — parses "200g chicken breast" into a structured entry |
| `suggest_meals` | Read | Calculates remaining macro budget, finds fitting foods |
| `update_daily_targets` | Write | Update user's daily macro targets |

### 9.5 Fallback Behavior

When no AI provider is configured:
- Chat shows "Configure an AI provider in Settings to enable chat"
- Recommendation endpoints return 503 with helpful message
- Dashboard insight card shows static tips from knowledge base
- Food logging works normally (AI parsing disabled, search-only)

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Target |
|--------|--------|
| Dashboard load time | < 1 second |
| Food search response | < 300ms |
| API response (p95) | < 500ms |
| AI first token (streaming) | < 2 seconds |
| WebSocket message latency | < 100ms |
| Database query (p95) | < 100ms |
| Frontend bundle size | < 500KB gzipped |

### 10.2 Security

| Requirement | Implementation |
|-------------|----------------|
| Password storage | bcrypt or argon2 hashing |
| API authentication | JWT with short expiry + refresh tokens |
| AI API keys | AES-256 encrypted at rest in MongoDB |
| HTTPS | Required in production (TLS termination) |
| CORS | Configurable, locked to frontend origin by default |
| Rate limiting | Redis-based, 100 req/min per user (configurable) |
| Input validation | Pydantic (backend) + Zod (frontend) |
| SQL injection | N/A (MongoDB), but sanitize all queries |
| XSS | React auto-escaping + CSP headers |

### 10.3 Scalability

| Aspect | Approach |
|--------|----------|
| Single-user instance | Runs on Raspberry Pi 4 / 1 vCPU VPS |
| Multi-user (household) | Default Docker config supports 5-10 users |
| Community instance | Horizontal scaling guide (multiple backend replicas, Redis cluster) |

### 10.4 Reliability

| Requirement | Approach |
|-------------|----------|
| Data persistence | MongoDB with volume mounts; no data loss on container restart |
| Backup | Documented mongodump/mongorestore procedure |
| Graceful degradation | App works without AI provider; all tracking features functional offline |
| Error handling | Structured error responses, never expose stack traces in production |

### 10.5 Accessibility

| Requirement | Standard |
|-------------|----------|
| WCAG compliance | Level AA (2.1) |
| Keyboard navigation | Full keyboard support |
| Screen reader | ARIA labels on all interactive elements |
| Color contrast | 4.5:1 minimum |
| Responsive design | Mobile-first, works 320px - 4K |

### 10.6 Internationalization

| Aspect | Phase |
|--------|-------|
| English (US) | MVP |
| Unit system (metric/imperial) | MVP |
| Multi-language support (i18n framework) | Post-MVP |
| Regional food databases | Post-MVP |

---

## 11. MVP Scope (Phase 1)

### What's IN the MVP

The MVP delivers a functional, end-to-end nutrition tracking platform with core AI features.

| Feature Area | MVP Deliverables |
|-------------|-----------------|
| **Auth** | Email/password registration, JWT auth, single-user mode |
| **Profile** | Basic stats (age, height, weight, gender, activity), goal selection, auto-calculated targets |
| **Food Database** | USDA-seeded database (8K+ foods), search, custom food creation |
| **Food Logging** | Search and log foods, assign to meals, edit/delete entries, recent foods |
| **Macro Tracking** | Calorie + protein + carbs + fat + fiber progress bars, daily totals |
| **Tier 2 Tracking** | Sugar, sodium, saturated fat tracking (display only, no alerts) |
| **Dashboard** | Daily macro progress, meal log summary, remaining macros, quick log |
| **Analytics** | Weekly macro bar chart, weight trend chart, date range selection |
| **Weight Tracking** | Log weight, view trend with rolling average |
| **AI Chat** | Chat with context (profile + today's log + targets), streaming responses, session history |
| **AI Provider Setup** | Configure Claude/OpenAI/local LLM in settings |
| **Onboarding** | Profile wizard, goal selection, auto-target calculation |
| **Docker** | One-command `docker compose up` deployment |
| **PWA** | Installable web app with basic offline support |

### What's OUT of MVP (Delivered in Phase 2+3)

| Feature | Delivered In |
|---------|-------------|
| ~~Micronutrient weekly reports~~ | Phase 2 (Week 12) |
| ~~AI meal recommendations~~ | Phase 2 (Week 10 — `suggest_meals` tool) |
| ~~Natural language food logging~~ | Phase 2 (Week 10 — `quick_log` tool) |
| ~~Reminders~~ | Phase 3 (Week 13 — CRUD + toggle) |
| ~~Daily checklist system~~ | Phase 3 (Week 14 — auto-check + custom items) |
| ~~Goal templates~~ | Phase 3 (Week 15 — 4 pre-built templates with TDEE calculation) |
| ~~Streak tracking~~ | Phase 3 (Week 16 — consecutive-day streaks) |

### Delivered in Phase 4

| Feature | Week |
|---------|------|
| ~~Recipe builder~~ | Week 18 — Full CRUD + log as food entry |
| ~~Export (CSV/JSON)~~ | Week 19 — CSV food log export + full JSON data export |
| ~~Favorite foods~~ | Week 17 — Toggle favorites, shown in log dialog + AI search |
| ~~Copy meals~~ | Week 17 — Copy entries from one date/meal to another |
| ~~Custom food form~~ | Week 17 — Inline creation in log dialog |
| ~~Recent foods~~ | Week 17 — Frequency-ranked quick re-log |
| ~~Dark/light mode~~ | Week 20 — next-themes with system preference |
| ~~Loading skeletons~~ | Week 20 — Dashboard skeleton cards |
| ~~Confirmation dialogs~~ | Week 20 — All destructive actions |

### Still Deferred (Post v1.0)

| Feature | Reason for Deferral |
|---------|-------------------|
| Barcode scanning | Requires mobile camera API |
| Multi-language support (i18n) | English first |
| Community food submissions | Single-user focused |
| Push notifications (Serwist service worker) | Browser push API not yet wired |
| E2E tests | Unit/integration sufficient for now |

### MVP User Journey

```
1. Deploy via Docker (docker compose up)
2. Open browser → Onboarding wizard
3. Enter stats (age, height, weight, gender, activity)
4. Select goal (cut/maintain/bulk)
5. System calculates targets (shown with explanations)
6. Configure AI (enter API key or skip)
7. Land on Dashboard
8. Search and log breakfast → see macro progress update
9. Log lunch and dinner
10. Check dashboard → see daily totals vs targets
11. Open AI chat → "How am I doing today?"
12. AI responds with specific numbers from today's log
13. Log weight → see trend chart
14. Next day → repeat, start seeing weekly trends
```

---

## 12. Roadmap & Milestones

### Phase 1: MVP (Weeks 1-8)

| Week | Milestone |
|------|-----------|
| 1-2 | Project scaffolding: monorepo, Docker, Next.js frontend, FastAPI backend, MongoDB/Redis setup, CI |
| 3 | Auth system + user profile + onboarding wizard |
| 4 | Food database (USDA seed) + food search + custom foods |
| 5 | Food logging + daily macro tracking + dashboard |
| 6 | AI integration layer + chat system + provider configuration |
| 7 | Weight tracking + analytics charts + weekly macro view |
| 8 | PWA setup + polish + testing + documentation + first release |

**Deliverable**: v0.1.0 — Functional self-hosted nutrition tracker with AI chat

### Phase 2: Intelligence (Weeks 9-12) — COMPLETE

| Week | Milestone | Status |
|------|-----------|--------|
| 9 | Extended nutrient tracking (sugar, sodium, sat fat) + nutrient alerts service | Done |
| 10 | NLP food logging (`quick_log` tool) + AI meal suggestions (`suggest_meals` tool) | Done |
| 11 | Daily insights engine (rule-based) + insights API endpoint | Done |
| 12 | Weekly reports API + micronutrient heatmap + expanded analytics | Done |

**Deliverable**: v0.2.0 — Full nutrient tracking with AI-powered recommendations, NLP logging, weekly reports

### Phase 3: Accountability (Weeks 13-16) — COMPLETE

| Week | Milestone | Status |
|------|-----------|--------|
| 13 | Reminder system (CRUD + toggle) with settings UI | Done |
| 14 | Daily checklist (auto-check from food log + custom items) with dedicated page | Done |
| 15 | Goal templates (4 pre-built: fat loss, lean bulk, maintenance, health optimization) | Done |
| 16 | Streak tracking (consecutive days >= 80% completion) + badges across UI | Done |

**Deliverable**: v0.3.0 — Accountability features, reminders, checklists, goal templates, streaks

### Phase 4: Polish & Scale (Weeks 17-20) — COMPLETE

| Week | Milestone | Status |
|------|-----------|--------|
| 17 | Food UX: recent foods, favorites, copy meals, custom food form | Done |
| 18 | Recipe builder: model, CRUD API, frontend page with ingredient search + logging | Done |
| 19 | Export: CSV food log export (StreamingResponse), full JSON data export | Done |
| 20 | Polish: loading skeletons, confirm dialogs, dark/light mode, mobile heatmap fix, AI favorites | Done |

**Deliverable**: v1.0.0 — Production-ready with food UX improvements, recipes, export, and UI polish

### Future Considerations (Post v1.0)

- Plugin / extension system
- Barcode scanning (mobile)
- Workout tracking integration
- Community marketplace (shared recipes, meal plans)
- Regional food database expansions
- Multi-language (i18n)
- Native mobile wrapper (Capacitor or similar)
- Wearable integrations (Fitbit, Apple Health, Google Fit)

---

## 13. Open-Source Strategy

### 13.1 Licensing

**Recommended License**: **AGPLv3**

Rationale:
- Ensures the project stays open source even when hosted as a service
- Copyleft protects against proprietary forks that don't contribute back
- Standard choice for self-hosted open-source platforms (GitLab, Mastodon, Nextcloud)

Alternative considered: MIT — simpler but allows proprietary forks without contribution.

### 13.2 Repository Structure

**Monorepo** (recommended):
```
macro-ai/
  frontend/           # Next.js application
  backend/            # FastAPI application
  docs/               # Documentation
  docker/             # Docker configs
  scripts/            # Setup and utility scripts
  .github/            # GitHub Actions, issue templates, PR templates
  docker-compose.yml  # Root compose file
  LICENSE             # AGPLv3
  README.md           # Quick start + badges
  CONTRIBUTING.md     # Contribution guide
  CODE_OF_CONDUCT.md  # Community standards
  CHANGELOG.md        # Version history
```

### 13.3 Contribution Model

- **Issues**: Bug reports, feature requests, discussions
- **Pull Requests**: Code contributions with required review
- **Branch Strategy**: `main` (stable) + `develop` (integration) + feature branches
- **CI/CD**: GitHub Actions — lint, test, build on every PR
- **Release Cadence**: Monthly releases with semantic versioning

### 13.4 Community

- **GitHub Discussions**: Q&A, ideas, show-and-tell
- **Discord/Matrix**: Real-time community chat (optional, set up when community grows)
- **Documentation**: Self-hosting guide, API docs, contribution guide, architecture overview

---

## 14. Open Questions & Risks

### Open Questions

| # | Question | Impact | Resolution Path |
|---|----------|--------|-----------------|
| Q1 | Should the food database be seeded on first run or shipped as a Docker volume? | Setup UX, image size | Benchmark both approaches; seed script likely better for updates |
| Q2 | Should we use LiteLLM or build a custom LLM abstraction? | AI layer complexity, provider support | Start with LiteLLM; replace only if it becomes limiting |
| Q3 | How should we handle USDA API rate limits for food data enrichment? | Database completeness | Pre-seed with USDA bulk data download; API only for updates |
| Q4 | Should recipes be a first-class entity or implemented as "composite food items"? | Data model, UX | Composite food items in MVP; promote to recipes in Phase 2 |
| Q5 | What's the right balance of SSR vs client-side rendering in Next.js? | Performance, complexity | SSR for initial load (dashboard, food log); CSR for interactive elements (chat, charts) |
| Q6 | How should AI API keys be encrypted at rest? | Security | AES-256 with instance-specific secret; evaluate age encryption |
| Q7 | Should background tasks use Celery or ARQ (lighter-weight)? | Complexity, resource usage | ARQ for MVP (simpler, async-native); Celery if queue needs grow |

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | USDA food data is incomplete for micronutrients | High | Medium | Supplement with Cronometer/OpenFoodFacts data; clearly show when data is unavailable |
| R2 | AI costs concern users (API key billing) | Medium | Medium | Support local LLMs prominently; show token usage estimates; cache common queries |
| R3 | Self-hosting complexity deters non-technical users | Medium | High | One-command Docker setup; video tutorial; hosted demo instance |
| R4 | Next.js 16 minor version breaking changes | Low | Low | Pin to 16.1.x; Turbopack stable; `"use cache"` is the new caching model |
| R5 | Scope creep delays MVP | High | High | Strict MVP scope enforcement; defer nice-to-haves aggressively |
| R6 | Food search performance with large database | Low | Medium | MongoDB text indexes; Redis caching of popular searches; pagination |
| R7 | LLM context windows exceeded with rich user data | Medium | Low | Summarize older data; prioritize recent/relevant context; measure token usage |
| R8 | Motor (async MongoDB driver) deprecated May 2026 | High | Medium | Use Beanie 2.x now; migrate to PyMongo `AsyncMongoClient` when Beanie adopts it. Layered architecture isolates data access for easy swap. |

---

## Appendix A: Nutrient Tracking Tiers (Reference)

Based on the project's nutrition knowledge base:

### Tier 1 — Core Macros (Track Every Meal)
Calories, Protein, Carbohydrates, Fat, Fiber

### Tier 2 — Detailed Macros (Track Daily)
Sugar (total + added), Saturated Fat, Trans Fat, Sodium, Caffeine

### Tier 3 — Micronutrients (Weekly Monitoring)
**Vitamins**: A, B1-B12, C, D, E, K
**Minerals**: Calcium, Iron, Magnesium, Phosphorus, Potassium, Zinc, Selenium, Copper, Manganese, Chromium, Iodine
**Fatty Acids**: Omega-3 (EPA + DHA + ALA), Omega-6

### Tier 4 — Additives (Alert-Based)
Aspartame, Sucralose, Acesulfame-K, Saccharin, MSG, Sodium Nitrate, HFCS, Trans Fats

---

## Appendix B: TDEE Calculation Reference

**Mifflin-St Jeor Equation:**
- Men: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) + 5
- Women: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161

**Activity Multipliers:**
| Level | Multiplier | Description |
|-------|------------|-------------|
| Sedentary | 1.2 | Desk job, no exercise |
| Lightly Active | 1.375 | 1-3 days/week |
| Moderately Active | 1.55 | 3-5 days/week |
| Very Active | 1.725 | 6-7 days/week |
| Extremely Active | 1.9 | Physical job + training |

**Goal Adjustments:**
| Goal | Adjustment |
|------|------------|
| Aggressive Cut | TDEE - 750 |
| Moderate Cut | TDEE - 500 |
| Lean Cut | TDEE - 300 |
| Maintenance | TDEE |
| Lean Bulk | TDEE + 250 |
| Aggressive Bulk | TDEE + 500 |

**Macro Splits:**
| Macro | Calculation |
|-------|-------------|
| Protein | Goal-dependent (1.6-2.4g/kg) x body_weight_kg |
| Fat | Goal-dependent (0.5-1.2g/kg) x body_weight_kg |
| Carbs | (Total Calories - Protein Calories - Fat Calories) / 4 |

---

## Appendix C: Technology Justifications

| Choice | Alternatives Considered | Rationale |
|--------|------------------------|-----------|
| Next.js 16 | Remix, SvelteKit, Nuxt | Largest ecosystem, RSC support, best PWA/SSR story, React component library depth |
| FastAPI | Flask, Django, Express | Async-native, auto OpenAPI docs, Pydantic validation, Python ML/AI ecosystem |
| MongoDB | PostgreSQL, SQLite | Schema flexibility for nutrition data (50+ nutrient fields), JSON-native, scales easily |
| Redis | Memcached, in-memory | Pub/sub for WebSocket scaling, task queues, session store, rate limiting — all in one |
| ShadCN UI | Material UI, Ant Design, Chakra | Unified Radix package, full ownership of components, Tailwind-native, RTL support, no bloat |
| Zustand + TanStack Query | Redux Toolkit, Jotai, Context | TanStack handles server state (90% of state); Zustand (1KB) for minimal global UI state. Redux overkill. |
| LiteLLM | Custom abstraction | Supports 100+ LLM providers (v1.81+), battle-tested, streaming support, active maintenance |
| Beanie | ODMantic, raw PyMongo | Async-native Pydantic documents, great FastAPI integration. Note: Motor deprecated May 2026, plan migration to PyMongo async. |
| Tremor | Recharts, Nivo, Chart.js | Vercel-backed (MIT), Tailwind-native, ShadCN compatible, dashboard-optimized, minimal boilerplate |
| Docker Compose | Kubernetes, manual setup | Simple single-command deployment, perfect for self-hosted, no orchestration overhead |

---

*This document is the foundation for MacroAI's development. It will be updated as decisions are made and implementation progresses.*
