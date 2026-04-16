# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要 (Project Overview)

「組織型AIエージェント基盤SaaS」for SMB owners. The user (社長) issues instructions, and per-department AIs (営業 / SNSマーケ / 経理 / データ分析 / 総合 / 秘書) classify, plan, execute, and report. AIガバナンス (audit log + PII screening + risk events) is built-in.

UI strings, system prompts, and most comments are in Japanese — preserve language style and business terms when editing user-facing text.

## Architecture

Three independently-deployable services in an npm-workspace monorepo, plus an optional n8n workflow tier:

```
Browser (web :3000) ──▶ api-gateway :4000 ──▶ ai-engine :8000 ──▶ Groq / OpenAI / Anthropic
                                  │                  │
                                  ▼                  ▼
                             Prisma DB         AILog / RiskEvent
                          (SQLite | Postgres)   (audit + PII)
                                  │
                                  ▼
                             n8n :5678 (optional)  ──▶ task execution workflows
```

- **`apps/web`** — React 18 + Vite + Tailwind SPA. Zustand for global state (auth, chat). React Router for routing. Talks to api-gateway via axios (`src/services/api.ts`); JWT in `Authorization` header is auto-injected from `useAuthStore`. Vite dev proxy `/api → :4000` (`apps/web/vite.config.ts`). Production served by nginx with SSE/WebSocket-aware location blocks (`apps/web/nginx.conf`).
- **`apps/api-gateway`** — Fastify + TypeScript. Owns the database (Prisma), auth (JWT via `@fastify/jwt`), file uploads, REST/WebSocket/SSE endpoints. **Never calls LLMs directly** — proxies all AI work to ai-engine. Routes are registered under `/api/{auth,chat,governance,files,tasks,webhooks,agents}` in `src/index.ts`.
- **`apps/ai-engine`** — FastAPI + async SQLAlchemy. Owns LLM provider integrations, Intent classification, agent system prompts, PII screening, and audit logging. **All LLM calls must go through `llm_router`** (`app/llm/router.py`); never instantiate providers directly outside `app/llm/providers/`.
- **`apps/n8n-workflows`** — JSON workflow exports executed by an optional n8n instance. api-gateway tries n8n first for chat (`org-ai Chat Response` workflow) and task execution (`org-ai Task Execute`), then falls back to ai-engine if n8n is unavailable or returns no result.
- **`packages/shared-types`** — TypeScript-only types shared by web ↔ api-gateway (`User`, `Task`, `APIResponse<T>`, etc.). Build before either dependent app.
- **`packages/db-schema`** — Prisma schema + migrations. The schema declares `provider = "postgresql"`, but ai-engine's `app/db.py` accepts both `file:` (SQLite) and `postgres://` URLs at runtime. For local dev, the api-gateway also runs against the SQLite file by setting `DATABASE_URL=file:../../data/app.db` (Prisma migrations were authored for Postgres, so SQLite-only setups may need to use raw SQL or run a Postgres locally).

### Request flow worth knowing

- **Chat (streaming)**: `web POST /api/chat/sessions/:id/messages/stream` (SSE) → api-gateway persists user message, opens SSE → ai-engine `POST /orchestrate/stream` → `classify_intent` (LLM call) picks department → agent system prompt + Groq streaming → tokens proxied back as `{type: 'token'|'department'|'done'}` events. api-gateway also writes the final assistant message to Prisma. `chat.ts` has an n8n-cloud branch and a non-streaming fallback that mirrors the same flow.
- **Plan-based LLM routing** (`app/llm/router.py`): `STARTER → Groq (llama-3.3-70b-versatile)`, `PRO → OpenAI (gpt-4o)`, `MAX → Anthropic (claude-sonnet-4-6)`. Each provider auto-falls-back to a smaller model on error; PRO/MAX additionally fall back to Groq on provider failure. **Streaming is Groq-only.**
- **PII screening** (`app/governance/pii_screener.py`): regex + Luhn checks for EMAIL / JP PHONE / CREDIT_CARD / MY_NUMBER. Detected values are masked to `[PII_*]` *before* the prompt reaches the LLM. `audit_logger.log_llm_call` writes every call to `AILog` and inserts a `RiskEvent` (severity HIGH if `risk_score >= 0.5`) when PII was detected. Audit writes are fired with `asyncio.create_task` so failures don't block responses.
- **Task lifecycle**: `PENDING` (draft) → `PENDING_APPROVAL` (awaiting OWNER approval) → `QUEUED` (status change triggers execution) → either `triggerN8nWorkflow` (resolved by env `N8N_WORKFLOW_ID` or by name lookup against n8n cloud) or `executeTaskViaAiEngine` (calls `/orchestrate` directly) → `DONE`/`FAILED`. n8n posts back to `/api/webhooks/n8n/task-complete` and `/api/webhooks/n8n/task-log` (auth via `x-webhook-token` header, secret `N8N_WEBHOOK_AUTH_TOKEN`). WebSocket `/api/tasks/:taskId/stream` polls `TaskLog` every 2s; auth token is passed as `?token=` query param because browsers can't set headers on `WebSocket`.
- **TaskManager (`apps/web/src/taskmanager/`)** — a sub-app inside web with its own multi-agent pipeline (Orchestrator 部長 → Manager 課長 → Executor 社員 → Risk リスクマネジメント). It calls **Groq directly from the browser** using `VITE_GROQ_API_KEY` (`taskmanager/ai/client.ts`), persists tasks/projects locally via Dexie/IndexedDB (`taskmanager/db/index.ts`), and best-effort syncs to api-gateway (`taskmanager/db/sync.ts`). The local-first design means the TaskManager keeps working with the api-gateway down. Note this is a **separate API key** from server-side `GROQ_API_KEY`.
- **Agent JSON contracts**: each `app/agents/*.py` `system_prompt` instructs the model to emit a fenced ` ```json {...} ``` ` block with a `taskType` discriminator (e.g. `email`, `meeting_notes`, `proposal`, `sns`, `expense_report`, `data_visualization`). The frontend `apps/web/src/components/Chat/InlineChatResult.tsx` parses these blocks to render rich UI. **Editing an agent prompt's JSON shape requires updating both the prompt and the renderer.**

## Common Commands

### First-time setup

```bash
cp .env.example .env       # set GROQ_API_KEY and JWT_SECRET (32+ chars)

# Install Node workspaces (root install handles all workspaces)
npm install --workspaces --include-workspace-root

# Generate Prisma client + run migrations + seed demo data
npx prisma generate --schema=packages/db-schema/prisma/schema.prisma
mkdir -p data
DATABASE_URL="file:../../data/app.db" \
  npx prisma migrate dev --name init --schema=packages/db-schema/prisma/schema.prisma
DATABASE_URL="file:../../data/app.db" \
  npx ts-node packages/db-schema/prisma/seed.ts

# Python deps for ai-engine
cd apps/ai-engine && python3 -m venv .venv && source .venv/bin/activate \
  && pip install -r requirements.txt && cd ../..
```

Demo login (created by seed): `admin@demo.com` / `demo1234` (org `demo-org-001`).

### Day-to-day

```bash
# Run web + api-gateway together (root)
npm run dev

# Or per-service (in three terminals):
cd apps/ai-engine && source .venv/bin/activate \
  && GROQ_API_KEY=... uvicorn app.main:app --reload --port 8000
cd apps/api-gateway && DATABASE_URL=file:../../data/app.db JWT_SECRET=... \
  AI_ENGINE_URL=http://localhost:8000 npm run dev   # tsx watch
cd apps/web && npm run dev                          # vite, port 3000

# Single-service builds
npm run build --workspace=packages/shared-types     # required before web/api-gateway build
npm run build --workspace=apps/api-gateway          # tsc → dist/
npm run build --workspace=apps/web                  # vite build
npm run build                                       # turbo (all)

# Prisma utilities
npm run studio  --workspace=packages/db-schema      # GUI
npm run migrate:dev --workspace=packages/db-schema  # new migration
npm run generate --workspace=packages/db-schema     # regenerate client after schema edits

# Whole stack via Docker
docker-compose up --build                           # web + api-gateway + ai-engine + n8n
```

There is **no test suite or linter configured** in this repo at the moment — be explicit when adding either, and don't assume `npm test` exists.

## Project Conventions

- **TypeScript strict; Python type-hinted.** Validate request bodies with `zod` in api-gateway routes, with `pydantic` in ai-engine.
- **Auth**: every api-gateway route except `/api/auth/{login,register}` and `/api/webhooks/*` must use `preHandler: requireAuth` (or `requireOwner` for governance). Webhook routes authenticate via `x-webhook-token`.
- **Org isolation**: after auth, always filter Prisma queries by `payload.orgId` and verify `record.orgId === payload.orgId` before mutating. Never trust client-supplied `orgId`.
- **LLM access**: ai-engine code must call `llm_router.chat` / `llm_router.chat_stream`. Adding a provider means a new file under `app/llm/providers/`, a lazy-loader in `router.py`, and a plan branch.
- **Audit + PII**: any new path that calls an LLM must (a) PII-screen user content via `screen()` *before* sending and (b) `asyncio.create_task(log_llm_call(...))` afterward. Existing helpers in `orchestrator.py` and `main.py:orchestrate_stream` show the pattern.
- **Error format** (api-gateway): `{ success: false, error: { code, message } }`; success is `{ success: true, data }` (paginated lists add `pagination`).
- **Department enum**: `SALES | MARKETING | ACCOUNTING | ANALYTICS | GENERAL` server-side; the older `shared-types` `AgentDepartment` omits `ANALYTICS`. The web layer also references `ASSISTANT` (秘書AI) in `apps/web/src/data/agents.ts` — a UI-only persona without a backend agent. Update all three (`shared-types`, `app/agents/`, `intent_classifier.DEPARTMENTS`, `routes/agents.ts:DEPARTMENTS`) when adding a real department.
- **Plan handling**: `STARTER | PRO | MAX`. The org plan is read once per request in `chat.ts` and forwarded to ai-engine; never hardcode `STARTER`.
- **File uploads** (`/api/files/upload`): MIME allow-list (`apps/api-gateway/src/routes/files.ts`), 20 MB cap (set in `index.ts`), path-traversal check before write, files land in `FILES_DIR` (default `./data/files/<orgId>/`).
- **Streaming**: SSE responses must set `X-Accel-Buffering: no` so reverse proxies (nginx, Render) don't buffer chunks. The web nginx config has dedicated `location` blocks for SSE chat and WebSocket task logs — preserve them when modifying nginx.

## Environment Variables

| Variable | Required | Where | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | ai-engine | Server-side LLM calls |
| `VITE_GROQ_API_KEY` | ✅ for TaskManager | web build | In-browser Groq calls from `taskmanager/ai/client.ts` |
| `JWT_SECRET` | ✅ | api-gateway | 32+ chars |
| `DATABASE_URL` | ✅ | api-gateway, ai-engine | `file:./data/app.db` for SQLite, `postgres://...` for Postgres |
| `OPENAI_API_KEY` | for `PRO` plan | ai-engine | Falls back to Groq if missing/failing |
| `ANTHROPIC_API_KEY` | for `MAX` plan | ai-engine | Falls back to Groq if missing/failing |
| `AI_ENGINE_URL` | optional | api-gateway | default `http://ai-engine:8000` (docker) / `http://localhost:8000` |
| `FRONTEND_URL` | optional | api-gateway | comma-separated allowed CORS origins |
| `API_GATEWAY_URL` | optional | ai-engine | CORS origins; n8n callback URL base |
| `N8N_URL` / `N8N_CLOUD_URL` | optional | api-gateway | If set, tasks try n8n before AI Engine fallback |
| `N8N_API_KEY`, `N8N_WORKFLOW_ID` | optional | api-gateway | Auth & direct workflow id (skips name lookup) |
| `N8N_WEBHOOK_AUTH_TOKEN` | optional | api-gateway | Validates `x-webhook-token` on `/api/webhooks/n8n/*` (default `org-ai-n8n-secret-token`) |
| `FILES_DIR` | optional | api-gateway | Defaults to `<cwd>/../../data/files` |

## Deployment

- **`render.yaml`** defines three Render services: `org-ai-api-gateway` (Node), `org-ai-ai-engine` (Python, `rootDir: apps/ai-engine`), and `org-ai-n8n` (Postgres-backed n8n image). The api-gateway's `startCommand` runs `prisma migrate deploy` first.
- **`apps/web/vercel.json`** rewrites everything to `/index.html` for SPA routing on Vercel.
- **Docker Compose** (`docker-compose.yml`) wires all four services with healthchecks; the Dockerfiles are multi-stage (builder → runtime) so build context is the repo root.

## Repo Map (orientation only — confirm with Glob/Read)

```
apps/
├── web/src/
│   ├── pages/                 # ChatPage, DashboardPage, TaskManagerPage, GovernancePage, Login/Register
│   ├── components/{Dashboard,Chat,Navigation,Characters,ui}/
│   ├── store/                 # zustand: authStore, chatStore
│   ├── services/api.ts        # axios instance + JWT interceptor
│   └── taskmanager/           # local-first multi-agent task runner (Dexie + Groq)
│       ├── ai/{client,executor,prompts}.ts
│       ├── db/{index,sync}.ts
│       ├── store/index.ts     # zustand for queue/execution state
│       └── components/, types/, utils/
├── api-gateway/src/
│   ├── index.ts               # Fastify bootstrap + route registration
│   ├── routes/                # auth, chat, tasks, governance, files, agents, webhooks
│   ├── middleware/auth.ts     # requireAuth, requireOwner
│   └── utils/prisma.ts        # singleton PrismaClient
├── ai-engine/app/
│   ├── main.py                # FastAPI: /health, /orchestrate, /orchestrate/stream, /llm/chat
│   ├── orchestrator/          # orchestrator.py (agent dispatch), intent_classifier.py
│   ├── agents/                # base.py + sales/marketing/accounting/analytics/general
│   ├── llm/                   # router.py + providers/{groq,openai_provider,anthropic_provider}.py
│   ├── governance/            # pii_screener.py, audit_logger.py
│   ├── models/llm.py          # pydantic request/response schemas
│   └── db.py                  # async SQLAlchemy engine (handles both sqlite+aiosqlite and postgresql+asyncpg)
└── n8n-workflows/             # JSON exports (chat-response, task-execute, task-email-send, task-sns-post, sns-multi-platform, task-document)

packages/
├── shared-types/src/index.ts  # User/Org/Task/Message/APIResponse/JWTPayload
└── db-schema/prisma/          # schema.prisma, migrations/, seed.ts

tasks/                         # original spec docs (00-setup.md … 08-integration.md) — historical, not auto-executed
data/                          # runtime: app.db, files/<orgId>/...  (gitignored)
```
