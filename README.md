<div align="center">

<img src="https://img.shields.io/badge/AssessAI-Teacher's%20Assessment%20Creator-6366f1?style=for-the-badge&logo=sparkles&logoColor=white" alt="AssessAI" />

<br /><br />

<img width="1919" height="868" alt="image" src="https://github.com/user-attachments/assets/951c3868-45e9-4265-872c-42a967fb3736" />

<br /><br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.0-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Zustand](https://img.shields.io/badge/State-Zustand-FFB300?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-009688?style=flat-square&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Monorepo](https://img.shields.io/badge/Monorepo-npm%20Workspaces-CB3837?style=flat-square&logo=npm&logoColor=white)](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](./LICENSE)

<br />

**AssessAI** is a teacher-facing web application for building school assessments, generating structured, AI-powered question papers, and downloading them as polished, exam-ready PDFs — all with real-time job progress updates.

</div>

---

## Table of Contents

- [Product Overview](#product-overview)
- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Approach](#approach)
  - [AI Generation Pipeline](#ai-generation-pipeline)
  - [Data Flow](#data-flow)
  - [State Management](#state-management)
  - [Realtime Updates](#realtime-updates)
  - [PDF Export](#pdf-export)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Workspace Scripts](#workspace-scripts)
- [Question Type Catalog](#question-type-catalog)

---

## Product Overview

AssessAI enables a teacher to:

- **Build** an assessment from a structured form (title, subject, class, due date, instructions, question configuration)
- **Attach** an optional reference document (image/PDF) as a style guide for the AI
- **Generate** a normalized, section-structured question paper via Google Gemini
- **Monitor** generation in real time via a WebSocket-driven progress indicator
- **View** the output in a clean, exam-style paper layout
- **Download** the finished paper as a formatted A4 PDF

---

## Architecture Overview

AssessAI follows a **three-tier, event-driven monorepo architecture**. The frontend, API server, background worker, and shared types are co-located but independently deployable.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Next.js)                          │
│                                                                     │
│  ┌──────────────┐   REST /api   ┌──────────────┐   ws://…/ws        │
│  │  Zustand     │ ◄───────────► │  Express API │  ◄──────────────   │
│  │  Store       │               │  :4001       │                    │
│  └──────────────┘               └──────┬───────┘                    │
│                                        │                            │
│                               ┌────────┴─────────┐                  │
│                               │    MongoDB       │                  │
│                               │  (Assessments,   │                  │
│                               │  ExamPapers,│                  │
│                               │  SourceDocuments,    │                  │
│                               │  QuestionCategorys)  │                  │
│                               └────────┬─────────┘                  │
│                                        │                            │
│                          ┌─────────────┴──────────────┐             │
│                          │       Redis / BullMQ       │             │
│                          │Queue: assessment-generation│             │
│                          └─────────────┬──────────────┘             │
│                                        │                            │
│                          ┌─────────────▼──────────────┐             │
│                          │       Background Worker    │             │
│                          │  (generate-assessment.job) │             │
│                          │                            │             │
│                          │  1. Build structured prompt│             │
│                          │  2. Call Gemini 2.0 Flash  │             │
│                          │  3. Parse + normalize JSON │             │
│                          │  4. Persist ExamPaper │             │
│                          │  5. Cache PDF buffer       │             │
│                          │  6. Broadcast WS event     │             │
│                          └────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Concern | Decision | Rationale |
|---|---|---|
| **Monorepo** | npm workspaces | Keeps `@core` types in sync across `api`, `web`, and `worker` without a build step |
| **Queue** | BullMQ over Redis | Durable, retryable background jobs; decouples HTTP request lifetime from AI call duration |
| **Realtime** | Native WebSocket (`ws`) | Lightweight; no Socket.IO overhead needed for simple broadcast events |
| **AI provider** | Gemini via adapter | Adapter pattern isolates the SDK; swapping providers requires only one file change |
| **PDF** | PDFKit on the server | Consistent A4 output regardless of browser; cached in Redis for 15 minutes post-generation |
| **State** | Zustand + `persist` | Lightweight, zero-boilerplate; the workflow step and draft survive page refresh |
| **Validation** | Zod on API env config | Fail-fast at boot if required env vars are missing or malformed |

---

## Repository Structure

```
assess-ai/
├── apps/
│   ├── api/                        # Express API + WebSocket server
│   │   └── src/
│   │       ├── adapters/
│   │       │   └── gemini.adapter.ts       # Google Gemini integration
│   │       ├── bootstrap/
│   │       │   └── seed.ts                 # DB seeding (QuestionCategorys)
│   │       ├── config/
│   │       │   ├── env.ts                  # Zod-validated env schema
│   │       │   ├── mongo.ts                # Mongoose connection
│   │       │   ├── redis.ts                # ioredis client
│   │       │   └── socket.ts               # WebSocket server + broadcast
│   │       ├── controllers/
│   │       │   └── assessments.controller.ts
│   │       ├── models/                     # Mongoose schemas
│   │       │   ├── Assessment.ts
│   │       │   ├── ExamPaper.ts
│   │       │   ├── SourceDocument.ts
│   │       │   └── QuestionCategory.ts
│   │       ├── queues/
│   │       │   └── generation.queue.ts     # BullMQ queue definition
│   │       ├── routes/
│   │       │   └── assessments.ts          # REST route declarations
│   │       ├── services/
│   │       │   ├── assessment.service.ts
│   │       │   ├── cache.service.ts        # In-process TTL cache
│   │       │   ├── composer.service.ts   # Core generation orchestration
│   │       │   ├── exporter.service.ts          # PDFKit A4 paper renderer
│   │       │   └── category.service.ts
│   │       └── workers/
│   │           └── generation.worker.ts    # BullMQ worker bootstrap
│   │
│   ├── web/                        # Next.js 15 frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── assessment/             # Builder, workspace, confirmation, progress
│   │       │   ├── avatar/                 # DiceBear school avatar
│   │       │   ├── navigation/             # Side nav
│   │       │   ├── output/                 # Generated paper renderer
│   │       │   ├── shell/                  # Desktop + mobile layout shells
│   │       │   └── ui/                     # Confirmation modal, toast
│   │       ├── lib/
│   │       │   ├── api.ts                  # Typed fetch wrappers
│   │       │   └── websocket.ts            # WS client + event dispatcher
│   │       ├── store/
│   │       │   ├── assessment-store.ts     # Main Zustand workflow store
│   │       │   ├── notification-store.ts
│   │       │   └── ui-store.ts
│   │       └── types/
│   │           └── assessment.ts
│   │
│   └── worker/                     # Standalone BullMQ worker process
│       └── src/
│           ├── jobs/
│           │   ├── generate-assessment.job.ts
│           │   └── export-pdf.job.ts
│           └── index.ts
│
├── packages/
│   └── shared/                     # Shared types, schemas, workflow logic
│       └── src/
│           ├── schemas/
│           │   ├── assessment.ts           # Assessment + Question types
│           │   ├── exam-paper.ts      # Paper output schema
│           │   └── websocket.ts            # WS event type map
│           └── workflow/
│               └── assessment-generation.ts  # Prompt builder + normalizer
│
├── package.json                    # Root workspace config
└── tsconfig.base.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [Next.js 15](https://nextjs.org/) (React 19, App Router) |
| **Language** | TypeScript 5.8 across all packages |
| **Styling** | Tailwind CSS + custom CSS variables (globals.css) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Avatars** | [DiceBear](https://www.dicebear.com/) (`@dicebear/collection`) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) with `persist` middleware |
| **API Server** | [Express 4](https://expressjs.com/) on Node.js |
| **Realtime** | Native WebSocket via [`ws`](https://github.com/websockets/ws) |
| **Database** | [MongoDB](https://www.mongodb.com/) via [Mongoose 8](https://mongoosejs.com/) |
| **Cache / Queue** | [Redis](https://redis.io/) via [ioredis](https://github.com/redis/ioredis) + [BullMQ 5](https://bullmq.io/) |
| **AI Provider** | [Google Gemini 2.0 Flash](https://ai.google.dev/) (`@google/generative-ai`) |
| **PDF Generation** | [PDFKit](https://pdfkit.org/) |
| **Schema Validation** | [Zod](https://zod.dev/) (env config) |
| **Runtime** | [tsx](https://github.com/privatenumber/tsx) (dev), TypeScript compiler (build) |

---

## Approach

### AI Generation Pipeline

The generation pipeline lives in `packages/core/src/workflow/assessment-generation.ts`, making it testable and usable by both the API and any future worker.

```
Teacher submits form
        │
        ▼
POST /api/assessments/:id/confirm
        │
        ▼
┌───────────────────────────────────────────┐
│  composer.service.ts                    │
│                                           │
│  1. Mark assessment status → "processing" │
│  2. Broadcast WS: assessment:processing   │
│                                           │
│  3. [Optional] Analyze reference doc      │
│     via Gemini Vision (gemini-2.0-flash)  │
│     → Extract: structure, question types, │
│       marking scheme, language style      │
│                                           │
│  4. buildStructuredAssessmentPrompt()     │
│     Constructs a deterministic prompt:    │
│     - Subject, class, title, due date     │
│     - Per-type question counts + marks    │
│     - Question type catalog labels        │
│     - JSON output schema hint             │
│     - Reference document analysis (if any)│
│                                           │
│  5. Call Gemini (generateContent)         │
│                                           │
│  6. extractJsonPayload() — strips any     │
│     markdown fences or prose preamble     │
│                                           │
│  7. normalizeExamPaper()             │
│     - Fills missing IDs, texts, marks     │
│     - Calculates totalMarks if absent     │
│     - Infers totalTimeMinutes (≥30 min)   │
│     - Builds answerKey from sections      │
│                                           │
│  8. ensurePersistableAnswerKey()          │
│     - Cross-references answer key with    │
│       question IDs; fills any gaps        │
│                                           │
│  9. Persist ExamPaper to MongoDB     │
│ 10. Render PDF → cache in Redis (15 min)  │
│ 11. Broadcast WS: assessment:completed    │
└───────────────────────────────────────────┘
```

The prompt instructs Gemini to return **only strict JSON** (no markdown, no prose) matching a defined schema, which makes `extractJsonPayload()` a simple brace-extraction rather than a fragile regex parse.

---

### Data Flow

```
┌──────────┐  POST /assessments     ┌──────────┐
│          │ ─────────────────────► │          │  save draft
│          │                        │  Express │ ──────────► MongoDB
│  Next.js │  POST /confirm         │   API    │
│  Client  │ ─────────────────────► │  :4001   │  enqueue job
│          │                        │          │ ──────────► Redis/BullMQ
│          │  WS assessment:*       │          │
│          │ ◄───────────────────── │ WebSocket│ ◄──────────── Worker
│          │                        └──────────┘   broadcasts
│          │  GET /pdf                              on each stage
│          │ ─────────────────────► PDFKit → Redis cache → binary download
└──────────┘
```

**Assessment lifecycle stages:**

| Status | Stage | Progress |
|---|---|---|
| `draft` | `builder` | 0% |
| `queued` | `confirmation` | 10% |
| `processing` | `generating` | 20% → 40% → 75% |
| `completed` | `ready` | 100% |
| `failed` | `error` | 0% |

---

### State Management

The frontend uses a single **Zustand** store (`assessment-store.ts`) that models the entire teacher workflow as a finite-state machine with these steps:

```
empty → builder → confirmation → generating → result
            ▲                           |
            |___________________________|
                    
                (return to builder)
```

The store is persisted to `localStorage` under the key `assess-ai-assessment-workflow` (step, catalog, and draft only — never sensitive data or binary assets). This means a teacher can close the tab mid-form and resume where they left off.

Key store responsibilities:
- Holding `AssessmentDraft` (form data + question type rows)
- Tracking `progress` and `progressMessage` fed by WebSocket events
- Holding the final `ExamPaper` once generation completes
- Managing `assessmentId` for create vs. update flows

---

### Realtime Updates

The WebSocket server is mounted on the same HTTP server as Express at path `/ws`. It maintains a `Set<WsClient>` and broadcasts typed JSON envelopes to all connected clients:

```typescript
// WebSocket event envelope shape (packages/core)
interface WebSocketServerEnvelope<T extends WebSocketEventName> {
  type: T;           // 'assessment:queued' | 'assessment:processing' | ...
  data: WebSocketEventPayloadMap[T];
}
```

The frontend WebSocket client (`apps/web/src/lib/websocket.ts`) listens for these events and dispatches progress updates directly into the Zustand store — no polling required.

---

### PDF Export

`exporter.service.ts` uses **PDFKit** to produce an A4 document server-side with:

- School name header (centered, bold)
- Subject, class, time allowed, maximum marks metadata row
- Name / Roll Number fields for the student
- Sections labeled **Section A, Section B, …** with per-section instructions
- Questions numbered per section with marks annotation
- Answer key appended at the end

The PDF buffer is cached in Redis for **15 minutes** after generation. Subsequent download requests (`GET /assessments/:id/pdf`) serve the cached buffer; if it has expired it is regenerated on demand via `createPaperPdfBuffer()`.

---

## API Reference

Base URL: `http://localhost:4001/api`

| Method | Path | Description |
|---|---|---|
| `GET` | `/assessments/question-types` | List available question type options |
| `GET` | `/assessments` | List all assessments (sorted newest first) |
| `POST` | `/assessments` | Create a new assessment draft |
| `PUT` | `/assessments/:id` | Update an existing draft |
| `DELETE` | `/assessments/:id` | Delete assessment + generated paper + media |
| `POST` | `/assessments/:id/confirm` | Trigger AI generation (queues job + blocks until done) |
| `POST` | `/assessments/:id/regenerate` | Re-run generation for an existing assessment |
| `GET` | `/assessments/:id` | Get assessment by ID |
| `GET` | `/assessments/:id/paper` | Get the generated paper JSON |
| `GET` | `/assessments/:id/pdf` | Download the generated paper as A4 PDF |

**WebSocket** endpoint: `ws://localhost:4001/ws`

Emitted events: `assessment:queued`, `assessment:processing`, `assessment:completed`, `assessment:failed`

---

## Data Models

### Assessment

```typescript
{
  title: string
  subject: string
  className: string
  dueDate: string
  instructions: string
  sourceFileName?: string
  sourceAssetId?: ObjectId        // ref → SourceDocument
  questionTypes: QuestionConfig[]
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed'
  stage: 'builder' | 'confirmation' | 'generating' | 'ready' | 'error'
  progress: number                // 0–100
  progressMessage: string
  generationRequestedAt?: Date
  generatedPaperId?: ObjectId     // ref → ExamPaper
  questionTypeSnapshot: QuestionCategoryOption[]  // catalog snapshot at generation time
  lastError?: string
}
```

### ExamPaper

```typescript
{
  assessmentId: ObjectId
  title: string
  subject: string
  className: string
  totalMarks: number
  totalTimeMinutes: number
  sections: Array<{
    title: string
    instruction: string
    questions: Array<{
      id: string
      text: string
      marks: number
      difficulty: 'easy' | 'moderate' | 'hard'
      answer?: string
    }>
  }>
  answerKey: GeneratedQuestion[]
  notes?: string[]
}
```

### SourceDocument

Stores uploaded reference documents as binary buffers in MongoDB (base64-decoded at ingest time). Used by the Gemini Vision analysis step.

---

## Environment Variables

Create a `.env` file at the repository root:

```env
# Server
NODE_ENV=development
API_PORT=4001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/assess-ai

# Redis (optional — queue falls back to in-process if unset)
REDIS_URL=redis://localhost:6379

# Google Gemini (required for AI generation)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Storage mode
ASSESSMENT_STORAGE=database      # or 'memory' for ephemeral dev

# Upload limit
UPLOAD_MAX_MB=10

# CORS
CORS_ORIGIN=*
```

> The env schema is validated with Zod at startup (`apps/api/src/config/env.ts`). The server will exit immediately if required variables are missing or malformed.

---

## Security & Input Sanitization

AssessAI implements comprehensive input sanitization and validation to prevent XSS, injection attacks, and malicious payloads:

### Backend Security (`apps/api/`)

**Sanitization Middleware** (`src/middleware/sanitization.middleware.ts`):
- Automatically sanitizes all incoming request bodies, URL parameters, and query strings
- Removes control characters and escapes HTML special characters
- Prevents directory traversal and null byte injection

**Input Validation** (`src/validators/assessment.validator.ts`):
- Validates assessment payload structure and constraints
- Enforces field length limits (e.g., title ≤ 255 chars, instructions ≤ 5000 chars)
- Validates date formats (YYYY-MM-DD)
- Constrains question counts (1-100) and marks (1-100)
- Validates MongoDB ObjectId format for all resource IDs

**Controller Error Handling**:
- All endpoints validate input before processing
- Returns 400 Bad Request for invalid data
- Returns 404 Not Found for invalid ObjectIds
- Includes detailed error messages for debugging

### Frontend Security (`apps/web/`)

**Form Input Sanitization** (`src/lib/useSanitization.ts`):
- `sanitizeFormInput()`: Sanitizes string inputs, removes malicious characters
- `sanitizeAndValidateFile()`: Validates file types and size limits before upload
- `sanitizeFormData()`: Recursively sanitizes form object properties

**File Upload Validation**:
- Enforces file type whitelist: JPEG, PNG, PDF, TXT
- File size limit: 10 MB
- Filenames sanitized to prevent path traversal (`/`, `\`, `..`, special chars)
- MIME type validation against allowed types

**Shared Utilities** (`packages/core/utils/sanitize.ts`):
- `sanitizeString()`: Escapes HTML entities, removes control characters
- `sanitizeText()`: Removes null bytes and control chars (preserves formatting)
- `sanitizeEmail()`: Validates email format
- `sanitizeUrl()`: Blocks dangerous protocols (javascript:, data:, vbscript:)
- `sanitizeNumber()`: Enforces min/max constraints
- `sanitizeFilename()`: Prevents directory traversal, limits length to 255 chars
- `validateMimeType()`: Checks file type against whitelist

### Best Practices Applied

✅ **All user input is sanitized at multiple layers** (frontend validation + backend middleware + specific validators)
✅ **MongoDB injection prevention** via Mongoose schema validation + input sanitization
✅ **XSS prevention** via HTML entity escaping on all string inputs
✅ **File upload security** via whitelist validation + filename sanitization
✅ **Error messages** are informative but don't expose sensitive system details
✅ **Type safety** via TypeScript across all layers
✅ **Environment variables** validated with Zod at startup

---

## Getting Started

**Prerequisites:** Node.js ≥ 18, MongoDB, Redis (optional)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/assess-ai.git
cd assess-ai

# 2. Install all workspace dependencies
npm install

# 3. Copy and configure environment
cp .env.example .env
# → Set GEMINI_API_KEY at minimum

# 4. Start the Next.js frontend
npm run dev:web
# → http://localhost:3000

# 5. (Separate terminal) Start the API server
npm run dev --workspace @assess-ai/api
# → http://localhost:4001

# 6. (Optional) Start the background worker
npm run dev --workspace @assess-ai/worker
```

---

## Workspace Scripts

Run from the repository root:

| Script | Description |
|---|---|
| `npm run dev` | Start all packages in parallel |
| `npm run dev:web` | Start only the Next.js frontend |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run typecheck` | Type-check all packages |

---

## Question Type Catalog

The database is seeded on first boot with four default question types:

| Type | Label | Default Marks | Default Difficulty | Max Questions |
|---|---|---|---|---|
| `multiple-choice-questions` | Multiple Choice Questions | 1 | Easy | 20 |
| `short-questions` | Short Questions | 2 | Moderate | 15 |
| `diagram-graph-based-questions` | Diagram/Graph-Based Questions | 5 | Moderate | 10 |
| `numerical-problems` | Numerical Problems | 5 | Hard | 10 |

These are stored in the `QuestionCategory` collection and served via `GET /api/assessments/question-types`. Teachers can configure count, marks per question, and difficulty per type when building an assessment.

---

<div align="center">

Built with ❤️ for educators · Powered by [Google Gemini](https://ai.google.dev/) · Generated PDFs inspired by DPS Bokaro exam formats

</div>
