# Project Plan: Library Editor

> Generated from `ROADMAP.md` + full codebase audit.
> Covers current-state issues, Phase 0 (Docker Containerization), Phase 1 (Frontend Virtualization), and downstream roadmap items.

---

## Table of Contents

1. [Current-State Inventory](#1-current-state-inventory)
2. [Phase 0: Docker Containerization & Infrastructure](#2-phase-0-docker-containerization--infrastructure)
3. [Phase 1: Frontend Virtualization](#3-phase-1-frontend-virtualization)
4. [Phase 2: AI Orchestration & The Triad](#4-phase-2-ai-orchestration--the-triad)
5. [Phase 3-6: Knowledge Graph, WASM, Gateway, Real-time Collab](#5-phase-3-6-knowledge-graph-wasm-gateway-real-time-collab)
6. [Cross-Cutting Concerns & Technical Debt](#6-cross-cutting-concerns--technical-debt)
7. [Execution Roadmap](#7-execution-roadmap)

---

## 1. Current-State Inventory

### 1.1 Architecture Overview

```
Browser (React SPA)
  |  REST / JSON
  v
Django Views (editor/views.py)
  |  pymongo
  v
MongoDB (dj_cards_db) ─── SQLite (Django internals only)
```

| Layer | Stack | LOC |
|-------|-------|-----|
| Backend | Python 3.12, Django 6+, MongoDB (pymongo), minimal views | ~400 |
| Frontend | React 19, Vite 7, Tailwind v4, react-virtuoso, @dnd-kit, no TypeScript | ~3370 |
| Dev Ops | Docker multi-stage, `docker-compose.yml` (Mongo + App), shell scripts | ~130 |

### 1.2 Known Issues & Technical Debt

#### P0 — Data Loss / Security / Crash

| ID | Issue | Location | Fix |
|----|-------|----------|-----|
| P0-01 | Hardcoded Docker PAT in plaintext | `setup_infra.sh:24` | Remove inline token, use env vars or `~/.docker/config.json` |
| P0-02 | `SECRET_KEY` is hardcoded and `DEBUG=True` | `dj_cards/settings.py:6-7` | Use env var with fallback to a secret file |
| P0-03 | No db healthcheck → app starts before Mongo | `docker-compose.yml` | Add `depends_on.condition: service_healthy` |
| P0-04 | Global `_client` not thread-safe with gunicorn workers | `editor/utils/mongo.py:6-11` | Use connection pooling per-worker or `django.db.backends`-style lazy connection |

#### P1 — Correctness Bugs

| ID | Issue | Location |
|----|-------|----------|
| P1-01 | `serialize_doc` mutates input dict | `editor/utils/mongo.py:26` (`doc.pop('_id')`) |
| P1-02 | Soft-delete workspace does not cascade to pages → orphan documents | `editor/utils/mongo.py:73-84` |
| P1-03 | `debounce` function duplicated in 2 files | `PageEditor.jsx:324`, `PrototypePageEditor.jsx:73` |
| P1-04 | Cross-container DnD uses mutable array ops → stale state | `PageEditor.jsx:244-285` |
| P1-05 | `npm ci` on first Docker build may fail if `package-lock.json` missing or mismatched | `Dockerfile:7` |
| P1-06 | Flask dependency listed in pyproject.toml but never used | `pyproject.toml:14` |
| P1-07 | `.gitignore` has 6x duplicate entries | `.gitignore:1-6` |
| P1-08 | `docker-compose.yml` runs `init_data` every container restart (wasteful IO) | `docker-compose.yml:20-21` |
| P1-09 | `editor:insert-blocks-data` handler finds `afterId` as `blocks.length - 1` but should find index by ID | `BlockList.jsx:97` |
| P1-10 | `setFocusId` in `deleteBlock` never cleared → stale focus | `BlockList.jsx:42-45` |

#### P2 — Missing Validation / Edge Cases

| ID | Issue | Location |
|----|-------|----------|
| P2-01 | No block type validation on `PUT /api/pages/:id` | `views.py:80-86` |
| P2-02 | `api_upload_file` no file size limit → DoS vector | `views.py:120-171` |
| P2-03 | `api_fonts` no file type validation | `views.py:96-117` |
| P2-04 | No `Content-Type: application/json` check on POST/PUT bodies | `views.py:29,45,63,80` |
| P2-05 | All API views `@csrf_exempt` with no auth alternative | `views.py:22,36,59,71,95,119` |
| P2-06 | `init_data` creates Russian-language content by default | `management/commands/init_data.py` |
| P2-07 | `SlideBlock` has no max-nesting guard → infinite recursion risk | `SlideBlock.jsx:46` |
| P2-08 | `BlockList` file upload stores `ProgressBar` component in render scope | `BlockList.jsx:234-250` |
| P2-09 | No error boundary in React tree | `App.jsx` |
| P2-10 | No state cleanup on `pageId` change while debounce pending | `PageEditor.jsx:29-34` |

#### P3 — Maintainability / Cleanup

| ID | Issue | Location |
|----|-------|----------|
| P3-01 | Two parallel editors with different state models | `PageEditor.jsx` vs `PrototypePageEditor.jsx` |
| P3-02 | No TypeScript despite roadmap mandate | Whole frontend |
| P3-03 | Global `window` event system for block ops (`editor:*`) | `BlockList.jsx:48-123` |
| P3-04 | `deepUpdate` and `findContainer` O(n²) tree walks on every DnD move | `PageEditor.jsx:181-217` |
| P3-05 | No test files exist anywhere in the repo | `editor/tests.py` is empty |
| P3-06 | `npx`/`npm` commands in run scripts with no lockfile verification | `run.sh:14-21` |
| P3-07 | `.dockerignore` excludes `media/` but `docker-compose.yml` mounts it directly → mismatch | `.dockerignore`, `docker-compose.yml:18` |
| P3-08 | No nginx in Docker stack → `runserver` used as production server | `Dockerfile:48`, `docker-compose.yml:19-22` |
| P3-09 | `settings.py` `ALLOWED_HOSTS = ['*']` | `settings.py:8` |
| P3-10 | `setup_infra.sh` requests `sudo` for Docker but doesn't handle it for `poetry` steps | `setup_infra.sh:49` |

### 1.3 What Works (Strengths to Preserve)

- Normalized state model in `PageContext.jsx` + `stateHelpers.js` is clean and correct.
- `react-virtuoso` prototype proves that virtualization works for top-level blocks.
- `mongo.py` abstraction keeps DB access isolated from views.
- Soft-delete pattern is well-intentioned (just incomplete).
- `@dnd-kit` integration is well-structured for same-container moves.
- Debounced save with 1s delay prevents API spam.
- Block serialization for clipboard copy/paste is thoughtfully designed.

---

## 2. Phase 0: Docker Containerization & Infrastructure

### 2.1 Targets from ROADMAP.md

- Full `docker-compose` replacing `poetry run` for everything.
- Services: Backend (Django), DB (Mongo), VectorDB (Qdrant), Frontend (Node/Nginx).
- Volume mounts for hot reload.
- `setup_infra` scripts tuned for containers.
- `pwsh` inside Docker for the Triad.

### 2.2 Execution Plan

#### Step 0.1 — Fix current Dockerfile issues

| Action | Rationale |
|--------|-----------|
| Upgrade `node:18-alpine` → `node:22-alpine` | 18 is EOL in Oct 2025 |
| Remove `npm ci` cache layer; use `npm ci --production` in final stage | Smaller image |
| Add `--check` to `COPY frontend` to fail early on missing paths | Better DX |
| Split backend `COPY` into layers: deps → code → static | Cache efficiency |
| Add `ARG DEBIAN_FRONTEND=noninteractive` | Avoid apt-get prompts |

#### Step 0.2 — Multi-service `docker-compose.yml`

```yaml
services:
  db:          # MongoDB
  qdrant:      # Vector DB for Phase 3
  app:         # Django + gunicorn
  frontend:    # Vite dev server OR nginx static serve
  # (optional) pwsh-runner for Triad scripts
```

Add:
- Healthchecks for `db` and `qdrant`
- Named network for service isolation
- `.env` file support for secrets
- `docker-compose.dev.yml` with hot-reload volumes

#### Step 0.3 — Production-grade backend in Docker

| Task | Detail |
|------|--------|
| Replace `runserver` with **gunicorn** + **uvicorn** workers | Add `gunicorn[uvicorn]` to deps |
| Serve static files via **WhiteNoise** or nginx | `whitenoise` middleware |
| Add `docker-entrypoint.sh` | Run `migrate`, check Mongo readiness, then exec `gunicorn` |

#### Step 0.4 — `docker-compose.dev.yml`

```yaml
services:
  app:
    volumes:
      - .:/app  # hot reload backend
    command: python manage.py runserver 0.0.0.0:8000
  frontend:
    image: node:22-alpine
    working_dir: /app/frontend
    volumes:
      - ./frontend:/app/frontend
    command: npm run dev
    ports:
      - "5173:5173"
```

#### Step 0.5 — Security hardening

| Task | Detail |
|------|--------|
| Move `SECRET_KEY` to env var | `settings.py` → `os.environ.get("DJANGO_SECRET_KEY")` |
| Remove hardcoded Docker PAT from `setup_infra.sh` | Use `~/.docker/config.json` or CI secrets |
| Set `DEBUG=False` as default in production Dockerfile | Override via env var for dev |
| Restrict `ALLOWED_HOSTS` | Derive from env or `SITE_URL` |
| Add file upload size limit | Django `DATA_UPLOAD_MAX_MEMORY_SIZE` + nginx `client_max_body_size` |

#### Step 0.6 — Infrastructure scripts cleanup

| File | Fix |
|------|-----|
| `setup_infra.sh` | Remove hardcoded token; detect Docker Compose v2; add `docker compose up -d` option |
| `setup_infra.bat` | Same fixes for Windows |
| `run.sh` | Delegate to `docker compose up` instead of local poetry |
| `run.bat` | Same |

#### Step 0.7 — Add `pwsh` for Triad scripts

Create a small `pwsh` Docker image or use `mcr.microsoft.com/powershell` as a sidecar.
Triad scripts live in `ops/triad/` with `.ps1` extension.

---

## 3. Phase 1: Frontend Virtualization

### 3.1 Targets from ROADMAP.md

- Flat state architecture: `{ blocks: { [id]: BlockData }, pageLayout: [...] }`
- Full virtualization via `react-virtuoso` or `react-window`.

### 3.2 Current State Analysis

There are two parallel editors:

| Editor | State Model | Virtualization |
|--------|-------------|----------------|
| `PageEditor` (`/workspace/:wsId/:pageId`) | Denormalized nested array in local `useState` | None |
| `PrototypePageEditor` (`/prototype/:pageId`) | Normalized flat map via `PageContext` | `react-virtuoso` (top-level only) |

The normalized model in `PageContext.jsx` + `stateHelpers.js` is already well-designed:

```
{
  blocks: { [id]: { id, type, content, children?, parentId? } },
  rootIds: [id1, id2, ...]
}
```

### 3.3 Execution Plan

#### Step 1.1 — Merge the two editors

**Goal**: `PrototypePageEditor` becomes the one true editor; `PageEditor` is deleted.

| Task | Detail |
|------|--------|
| Port DnD logic from `PageEditor` into `PageContext` or a `useDnD` hook | Move `handleDragEnd`, `findContainer`, `deepUpdate` |
| Port `handleConvertToSlide`, `handleUngroup`, `handleMoveBlockToSlide`, `handleExtractBlockFromSlide` | These are `PageEditor`-only features needed in the prototype |
| Port `FloatingMenu`, `ContextMenu` event dispatch to the new architecture | Use context methods instead of `window` events |
| Delete `PageEditor.jsx` and `BlockList.jsx` | Replaced by `VirtualizedBlockList.jsx` + `PageContext` |

#### Step 1.2 — Unify state management

| Task | Detail |
|------|--------|
| Move `PageContext` from prototype-only to default | Wrap all page editor routes |
| Move debounced save into `PageProvider` | Remove debounce duplication |
| Add `moveBlock(id, toContainerId, toIndex)` to context | DnD integration |
| Add `convertToSlide(blockIds)` and `ungroupSlide(slideId)` to context | Slide wrapper operations |

#### Step 1.3 — Full virtualization (nested too)

| Task | Detail |
|------|--------|
| Replace `BlockList` inside `SlideBlock` with a virtualized list | Nested `Virtuoso` or `react-window FixedSizeList` |
| Calculate `itemHeight` dynamically or estimate via `overscan` | Pre-measure known block types |
| Ensure `@dnd-kit` sortable items work inside `Virtuoso` | `react-virtuoso` supports `Item` components with DnD |

#### Step 1.4 — DnD performance optimization

| Task | Detail |
|------|--------|
| Replace tree-walking `findContainer` with O(1) lookup | Store `block.parentId` in normalized state |
| Replace `deepUpdate` with normalized set state | Update only affected blocks by ID |
| Use `useMemo` on resolved tree before passing to Virtuoso | Avoid re-renders |

#### Step 1.5 — Remove global `window` event system

Replace `window.dispatchEvent` / `window.addEventListener` with:
- Context methods for block operations
- Direct prop callbacks for simple cases

Events to replace: `editor:insert-block`, `editor:delete-block`, `editor:copy-block`, `editor:cut-block`, `editor:insert-blocks-data`.

#### Step 1.6 — Cleanup & polish

| Task | Detail |
|------|--------|
| Move `ProgressBar` to separate component file | `src/components/ProgressBar.jsx` |
| Add proper loading/error states to all API calls | Consistent pattern |
| Add `useEffect` cleanup for debounced saves on unmount | `clearTimeout` on unmount |
| Add `aria-*` attributes for accessibility | `role`, `aria-label` on buttons |

---

## 4. Phase 2: AI Orchestration & The Triad

### 4.1 Targets from ROADMAP.md

- TypeScript describes graph ontology.
- Pydantic validates LLM inputs/outputs.
- PowerShell (pwsh) orchestrates heavy processes in Docker.

### 4.2 Pre-requisites from Phase 0

- Docker with `pwsh` sidecar container.
- Proper `docker-compose` service for Triad execution.

### 4.3 Execution Plan

#### Step 2.1 — Add Pydantic models

| Task | Detail |
|------|--------|
| Define Pydantic models for Block, Page, Workspace | `editor/schemas/block.py`, `page.py`, `workspace.py` |
| Add request/response validation in views | Use `pydantic.BaseModel.model_validate` |
| Add OpenAI `Structured Outputs` integration | Pydantic models as response format |

#### Step 2.2 — TypeScript type generation

| Task | Detail |
|------|--------|
| Create `types/` directory in frontend | `types/block.ts`, `types/page.ts`, `types/workspace.ts` |
| Generate from Pydantic or hand-write to match API contracts | `zod` schemas for runtime validation |

#### Step 2.3 — Triad runner service

| Task | Detail |
|------|--------|
| Create `ops/triad/` directory | `.ps1` scripts for infra tasks |
| Add `pwsh-runner` service to `docker-compose.yml` | Based on `mcr.microsoft.com/powershell` |
| Django management command to invoke `pwsh` inside container | Subprocess with `docker exec` |

---

## 5. Phase 3-6: Knowledge Graph, WASM, Gateway, Real-time Collab

### 5.1 Phase 3: Knowledge Graph Data Layer

| Step | Detail |
|------|--------|
| 3.1 | Add Qdrant service to `docker-compose.yml` (already begun in Phase 0) |
| 3.2 | Add `qdrant_client` to Python deps |
| 3.3 | Create `editor/utils/qdrant.py` with collection management |
| 3.4 | Implement vector embedding on page save (block content → embedding) |
| 3.5 | Hybrid search: MongoDB filter + Qdrant semantic similarity |

### 5.2 Phase 4: Graph Visualization (Rust/WASM)

| Step | Detail |
|------|--------|
| 4.1 | Create `editor/rust/` crate with `wasm-pack` |
| 4.2 | Implement force-directed layout algorithm in Rust |
| 4.3 | Create `GraphView` React component with WebGL renderer |
| 4.4 | Wire up `/api/graph` endpoint returning nodes + edges from MongoDB + Qdrant |

### 5.3 Phase 5: Integrations & LLM Gateway

| Step | Detail |
|------|--------|
| 5.1 | Create `editor/llm/` with generic OpenAI client |
| 5.2 | Support `OPENAI_BASE_URL` for custom endpoints |
| 5.3 | Add `/api/llm/chat` and `/api/llm/structured` endpoints |
| 5.4 | Add Cerebras-compatible testing strategy |

### 5.4 Phase 6: Real-time Collaboration (Rust + CRDT)

| Step | Detail |
|------|--------|
| 6.1 | Add `yjs` to frontend deps |
| 6.2 | Add Django Channels + Redis to backend stack |
| 6.3 | Create Rust module via `maturin` + `PyO3` binding `y-crdt` |
| 6.4 | WebSocket endpoint: auth → apply patch via Rust → broadcast result |
| 6.5 | Add presence indicators and conflict resolution UI |

---

## 6. Cross-Cutting Concerns & Technical Debt

### 6.1 Testing Strategy

Currently: **zero tests**. This must be established early.

| Priority | Area | Tooling | Target |
|----------|------|---------|--------|
| High | Backend API | `pytest-django` + `mongomock` | All views + mongo utils |
| High | Frontend state | `vitest` + `@testing-library/react` | `PageContext`, `stateHelpers` |
| High | Block normalization | `vitest` | `normalizePage`, `denormalizePage` |
| Medium | DnD logic | `vitest` with mock events | `handleDragEnd`, moves |
| Medium | Integration | `playwright` | Critical user flows |
| Low | E2E | `playwright` + `docker compose` | Full stack |

### 6.2 Monitoring & Observability

| Task | Detail |
|------|--------|
| Add `structlog` or `django-request-logging` | Request/response logging |
| Add `/api/health` endpoint | DB connectivity, Qdrant status |
| Add Docker healthchecks | Container-level monitoring |

### 6.3 Code Quality

| Task | Detail |
|------|--------|
| ESLint + Prettier config in frontend | Already has eslint.config.js |
| Ruff / mypy for backend | Add to pyproject.toml |
| Pre-commit hooks | `pre-commit-config.yaml` |

---

## 7. Execution Roadmap

### 7.1 Priority Ordering

```
Phase 0 (Infrastructure) ────────┐
                                   ├──> Phase 1 (Virtualization)
Phase 2 (Triad) ────── pre-req ───┘
                                  │
Phase 3 (Knowledge Graph) ───────┤
                                  ├──> Phase 5 (LLM Gateway)
Phase 4 (Graph Viz / WASM) ──────┘
                                  │
Phase 6 (Real-time Collab) ──────┘
```

### 7.2 Recommended Phase Order

| Order | Phase | Duration | Dependencies |
|-------|-------|----------|--------------|
| 1 | **0: Docker Containerization** | 3-5 days | None |
| 2 | **1: Frontend Virtualization** | 5-8 days | Phase 0 (for test environment) |
| 3 | **Testing Scaffold** | 3-4 days | Phases 0+1 (stable code to test) |
| 4 | **2: AI Orchestration / Triad** | 5-7 days | Phase 0 (Docker pwsh) |
| 5 | **3: Knowledge Graph** | 4-6 days | Phase 0 (Qdrant in compose) |
| 6 | **5: LLM Gateway** | 3-5 days | Phases 2+3 |
| 7 | **4: Graph Viz / WASM** | 7-10 days | Phase 3 |
| 8 | **6: Real-time Collab** | 10-14 days | Phase 0 (Redis, Channels) |

### 7.3 Quick Wins (Do First, 1-2 days)

These are low-effort, high-impact fixes:

1. Fix `SECRET_KEY` → env var, `DEBUG` → env var
2. Remove hardcoded Docker PAT from `setup_infra.sh`
3. Upgrade Node 18 → 22 in Dockerfile
4. Add MongoDB healthcheck to `docker-compose.yml`
5. Add `depends_on.condition: service_healthy` for `app`
6. Remove Flask from `pyproject.toml`
7. Deduplicate `.gitignore`
8. Deduplicate `debounce` helper (extract to `utils/debounce.js`)
9. Fix `serialize_doc` mutation (copy input first)
10. Extract `ProgressBar` to own component file

### 7.4 Immediate Architectural Decisions Needed

1. **TypeScript migration**: Incremental (rename .jsx → .tsx per file) or big bang? Recommend incremental per component.
2. **State model unification**: Keep `PageContext` as the single source of truth; delete `PageEditor`.
3. **DnD library**: `@dnd-kit` works but evaluate `react-beautiful-dnd` or `use-gesture` for nested virtualized lists.
4. **Virtuoso vs react-window**: Virtuoso is already in deps and works; stay with it. Upgrade to latest if needed.

### 7.5 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MongoDB connection issues in Docker | Medium | High | Healthcheck + retry in entrypoint |
| Virtualized DnD breaks with nested lists | High | High | Prototype first; fallback to non-nested virtualization |
| TypeScript migration stalls | Medium | Low | Allow JS files to coexist; use `allowJs` |
| `react-virtuoso` + `@dnd-kit` incompatibility | Medium | Medium | Test early; have `react-window` as backup |
| pwsh image size | Low | Medium | Use alpine-based PowerShell image |

---

## Appendix A: File Manifest (Key Files)

```
/
├── .dockerignore                 # Needs fix: media/ exclusion contradicts compose
├── .gitignore                    # Needs fix: 6 duplicate lines
├── Dockerfile                    # Phase 0 target
├── docker-compose.yml            # Phase 0 target
├── pyproject.toml                # Needs fix: remove Flask
├── manage.py                     # OK
├── dj_cards/settings.py          # Needs fix: SECRET_KEY, DEBUG, ALLOWED_HOSTS
├── editor/
│   ├── urls.py                   # OK (simple)
│   ├── views.py                  # Needs: validation, auth, error handling
│   ├── utils/mongo.py            # Needs: thread safety, no mutation, cascade delete
│   ├── management/commands/init_data.py  # OK (consider English default)
├── frontend/
│   ├── src/
│   │   ├── api.js                # OK (simple fetch wrapper)
│   │   ├── App.jsx               # Needs: error boundary
│   │   ├── contexts/PageContext.jsx   # Phase 1 unification target
│   │   ├── utils/stateHelpers.js     # OK (keep, extend)
│   │   ├── utils/clipboardUtils.js   # OK
│   │   ├── components/
│   │   │   ├── BlockList.jsx         # Phase 1: deprecate
│   │   │   ├── BlockWrapper.jsx      # Phase 1: keep, minor updates
│   │   │   ├── VirtualizedBlockList.jsx  # Phase 1: extend
│   │   │   ├── FloatingMenu.jsx      # Keep
│   │   │   ├── ContextMenu.jsx       # Keep
│   │   │   ├── blocks/SlideBlock.jsx # Phase 1: virtualize nested list
│   │   │   └── ... (12 block types)
│   │   └── pages/
│   │       ├── PageEditor.jsx        # Phase 1: deprecate
│   │       └── PrototypePageEditor.jsx  # Phase 1: becomes default
```

## Appendix B: Dependency Audit

| Package | Version | Status | Note |
|---------|---------|--------|------|
| `django` | 6.x | ✅ Used | Core backend |
| `pymongo` | 4.x | ✅ Used | MongoDB driver |
| `dnspython` | 2.x | ✅ Used | DNS for MongoDB URI |
| `pillow` | 12.x | ✅ Used | Thumbnail generation |
| `flask` | 3.x | ❌ Unused | Remove |
| `react` | 19.2 | ✅ Used | Core frontend |
| `react-virtuoso` | 4.17 | ✅ Used | Virtualization |
| `@dnd-kit/core` | 6.3 | ✅ Used | Drag & drop |
| `@dnd-kit/sortable` | 10.0 | ✅ Used | Sortable lists |
| `react-router-dom` | 7.11 | ✅ Used | Routing |
| `react-zoom-pan-pinch` | 3.7 | ✅ Used | Mermaid zoom |
| `html-to-image` | 1.11 | ✅ Used | Export |
| `jspdf` | 3.0 | ✅ Used | PDF export |
| `uuid` | 13.0 | ✅ Used | Block ID generation |
| `mermaid` | 11.12 | ✅ Used | Diagrams |
| `katex` | 0.16 | ✅ Used | LaTeX |
| `prismjs` | 1.30 | ✅ Used | Syntax highlighting |
| `lucide-react` | 0.562 | ✅ Used | Icons |
| `tailwindcss` | 4.1 | ✅ Used | Styling |

---

*Last updated: 2026-06-02*
*Generated from codebase audit and ROADMAP.md analysis.*
