# MacroAI

Open-source, self-hosted AI nutrition tracker. Track macros, log food, monitor weight trends, and chat with an AI nutrition assistant — all on your own hardware with your own API keys.

## Features

- **Dashboard** — Macro progress bars, micronutrient tracking (fiber, sugar, sodium, saturated fat), nutrient alerts, daily insights, today's meal log
- **Food Logging** — Search 120+ foods, log by meal (breakfast/lunch/dinner/snack), set servings, delete entries. Extended nutrients tracked automatically.
- **AI Chat** — LangGraph ReAct agent with 12 tools. Natural language food logging ("log 200g chicken breast for lunch"), meal recommendations based on remaining macros, nutrient alerts, weekly reports, and more. Bring your own LLM (Claude, OpenAI, Ollama, or any OpenAI-compatible provider).
- **Nutrient Alerts** — Real-time warnings for sodium (>2300mg), sugar (>50g), saturated fat (>20g), and low fiber (<25g)
- **Analytics** — Calorie trend, daily macros bar chart, macro split donut, micronutrient heatmap, weekly report with target adherence. Date range selector (7/14/30/90 days).
- **Weight Tracking** — Log daily weight, 7-day rolling average, 30-day trend, weight line chart
- **Profile & Targets** — Mifflin-St Jeor TDEE calculator, auto-suggested macros by goal (cut/maintain/bulk)
- **Daily Checklist** — Auto-generated daily tasks (protein target, calorie target, 3+ meals, 25g+ fiber), custom items, auto-check based on logged data
- **Streak Tracking** — Consecutive days with 80%+ checklist completion, flame badge on dashboard and analytics
- **Goal Templates** — Pre-built plans (Fat Loss, Lean Bulk, Maintenance, Health Optimization) that auto-calculate macros from your profile
- **Reminders** — Configurable reminders for meals, supplements, hydration, and custom tasks with toggle switches
- **Onboarding** — 3-step wizard: profile, goals, review targets
- **PWA Ready** — Web app manifest, mobile-optimized bottom nav, installable

## Quick Start

```bash
# Clone and configure
git clone https://github.com/yourusername/macro-ai.git
cd macro-ai
cp .env.example .env
# Edit .env — set SECRET_KEY (generate with: openssl rand -hex 32)

# Start all services (builds frontend, backend, nginx, MongoDB, Redis)
docker compose up -d
```

Open [http://localhost](http://localhost) (port 80 via nginx), register an account, and complete onboarding.

Nginx serves as a reverse proxy — all traffic goes through port 80:
- `/` → Next.js frontend
- `/api/` → FastAPI backend
- `/api/v1/chat/ws` → WebSocket (AI chat)
- `/health` → Backend health check

### Seed the Food Database

```bash
docker compose exec backend .venv/bin/python -m seeds.seed_foods
```

### Configure AI Chat

1. Go to **Settings** in the app
2. Select your provider (Claude, OpenAI, Local, or Custom)
3. Enter your API key and model name
4. Start chatting in the **AI Chat** tab

## Development (without Docker)

```bash
# Start MongoDB + Redis via Docker
docker compose up mongodb redis -d

# Backend (terminal 1)
cd backend
uv sync
.venv/bin/uvicorn app.main:app --reload

# Frontend (terminal 2) — needs NEXT_PUBLIC_API_URL for cross-origin dev
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000) (hot reload)
- Backend API docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs) (Swagger)
- Backend ReDoc: [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, ShadCN UI, Recharts |
| State | Zustand (client) + TanStack Query (server) |
| Backend | FastAPI, Python 3.12+, Beanie ODM |
| Database | MongoDB 7, Redis 7 |
| AI | LangGraph 1.0 (ReAct agent, 12 tools) + ChatLiteLLM (BYO provider) |
| Proxy | Nginx (reverse proxy, single entry point on port 80) |
| Deploy | Docker Compose |

## Project Structure

```
macro-ai/
├── frontend/           # Next.js 16 app
│   ├── app/            # App Router (auth, app, onboarding)
│   ├── components/     # ShadCN UI + custom components
│   ├── lib/            # API clients, stores, websocket
│   └── Dockerfile      # Multi-stage build (deps → build → runner)
├── backend/            # FastAPI server
│   ├── app/
│   │   ├── api/v1/     # REST + WebSocket endpoints
│   │   ├── models/     # Beanie document models
│   │   ├── schemas/    # Pydantic request/response schemas
│   │   ├── services/   # Business logic + AI agent
│   │   └── utils/      # Crypto, helpers
│   ├── seeds/          # Food database seed data
│   └── Dockerfile      # uv sync + uvicorn
├── nginx/
│   └── nginx.conf      # Reverse proxy (frontend, API, WebSocket)
├── docs/               # PRD + Architecture spec
└── docker-compose.yml  # All services: nginx, frontend, backend, mongodb, redis
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, get JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/users/me` | Get current user |
| PATCH | `/api/v1/users/me/profile` | Update profile |
| PATCH | `/api/v1/users/me/targets` | Update macro targets |
| PUT | `/api/v1/users/me/ai-config` | Save AI provider settings |
| GET | `/api/v1/foods/search` | Search food database |
| POST | `/api/v1/food-log` | Log a food entry |
| GET | `/api/v1/food-log` | Get day's entries |
| GET | `/api/v1/food-log/totals` | Get day's macro totals |
| GET | `/api/v1/food-log/range` | Get totals for date range |
| GET | `/api/v1/food-log/insights` | Get daily nutrition insights |
| GET | `/api/v1/food-log/alerts` | Get nutrient limit alerts |
| POST | `/api/v1/weight` | Log weight (upsert by date) |
| GET | `/api/v1/weight/trend` | Get weight trend + averages |
| GET | `/api/v1/reports/weekly` | Weekly nutrition report |
| GET | `/api/v1/checklist` | Get daily checklist (auto-generates) |
| PATCH | `/api/v1/checklist/{id}/toggle` | Toggle custom checklist item |
| POST | `/api/v1/checklist` | Add custom checklist item |
| GET | `/api/v1/checklist/streak` | Get completion streak |
| GET | `/api/v1/reminders` | List reminders |
| POST | `/api/v1/reminders` | Create reminder |
| PATCH | `/api/v1/reminders/{id}/toggle` | Toggle reminder on/off |
| DELETE | `/api/v1/reminders/{id}` | Delete reminder |
| GET | `/api/v1/templates` | List goal templates |
| POST | `/api/v1/templates/{id}/apply` | Apply template to targets |
| WS | `/api/v1/chat/ws` | Streaming AI chat |
| GET | `/api/v1/chat/sessions` | List chat sessions |

## Docs

- [PRD](docs/PRD.md) — Full requirements, data models, API contracts
- [Architecture](docs/ARCHITECTURE.md) — Tech decisions, patterns, AI agent design

## License

AGPLv3 — see [LICENSE](LICENSE).
