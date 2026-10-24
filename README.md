# Debug Dynasty

> **Tagline:** *Find the Bug. Fix the Code. Master the Logic.*

Debug Dynasty is a developer productivity platform and debugging workbench featuring Monaco editors, intelligent language detection, AST-level root cause diagnosis, isolated sandbox execution, and benchmark evaluation.

---

## Single-URL Quickstart

You can use the complete application through a **single browser URL** in either Development or Production mode.

| Mode | Browser URL | How it Works |
|---|---|---|
| **Development** | **`http://localhost:5173/`** | Vite dev server with hot module reload; reverse-proxies `/api/*` to FastAPI backend on port 8000. |
| **Production** | **`http://localhost:8000/`** | FastAPI serves the compiled React app (`dist/`), static assets, client SPA routes, and all API endpoints on a single port. |

---

## 1. Quick Start Commands

### Prerequisites
- Node.js 18+ (tested with npm)
- Python 3.10+ (tested with Python 3.12)

### Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
pip install -r requirements.txt
```

---

### Option A: Development Mode (Recommended for Coding)

Run the backend and frontend. You only need to open **one URL** in your browser:

1. **Terminal 1 — Start FastAPI Backend:**
   ```bash
   python main.py
   # or
   npm run backend
   ```
   *(Runs on internal port `http://127.0.0.1:8000`)*

2. **Terminal 2 — Start Frontend Dev Server:**
   ```bash
   npm run dev
   ```

3. **Open Browser:**
   👉 **`http://localhost:5173/`**

All frontend pages, hot-reloading, and API requests (`/api/debug`, `/api/health`, `/api/languages`, `/api/history`, `/api/evaluation`) work seamlessly with zero CORS issues.

---

### Option B: Production Mode (Single Process & Single Port)

Compile the React frontend into static assets and let FastAPI serve everything from port 8000:

```bash
# Build frontend and launch FastAPI
npm run start:prod

# Or manually:
npm run build
python main.py
```

**Open Browser:**
👉 **`http://localhost:8000/`**

- Serves the frontend entry point and client-side routes (`/`, `/debugger`, `/history`, `/evaluation`, `/settings`).
- Serves static assets (`/assets/*`).
- Handles all API endpoints (`/api/*`).
- Missing API endpoints safely return structured JSON 404s rather than HTML.

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend service status and runner health |
| `GET` | `/api/languages` | Supported languages and execution capabilities |
| `POST` | `/api/debug` | Analyzes code, pinpoints root cause, generates suggested patch |
| `POST` | `/api/validate-fix` | Dry-run AST verification and syntax checks |
| `POST` | `/api/run-tests` | Runs test cases against user code |
| `GET` | `/api/history` | Retrieves past debugging sessions from `debugger.db` |
| `DELETE` | `/api/history/{id}` | Deletes a session record |
| `GET` | `/api/evaluation` | Aggregate benchmark metrics and accuracy rates |
| `GET` | `/api/evaluation/benchmark` | List of benchmark test cases |
| `GET` | `/docs` | Interactive Swagger UI API documentation |

---

## 3. Automated Tests & Build

```bash
# Run all 30 unit tests (frontend, client, language detection, history, evaluation)
npm test

# Test endpoint integration (dev proxy and production single-server)
python test_endpoints.py

# Verify production build bundle
npm run build
```

---

## 4. Architecture & Configuration

- **Vite Proxy:** Configured in [`vite.config.ts`](file:///c:/Users/MAHALAXMI/OneDrive/Desktop/project/vite.config.ts) to route `/api`, `/health`, and `/docs` to `http://127.0.0.1:8000`.
- **FastAPI Static Mount & SPA Fallback:** Implemented in [`main.py`](file:///c:/Users/MAHALAXMI/OneDrive/Desktop/project/main.py) to resolve `dist/` dynamically and route valid frontend routes to `index.html`.
- **API Client:** [`src/api/client.ts`](file:///c:/Users/MAHALAXMI/OneDrive/Desktop/project/src/api/client.ts) uses relative paths (`/api/...`) by default so both `http://localhost:5173` and `http://localhost:8000` work without requiring hostname changes.
- **SQLite Database:** [`debugger.db`](file:///c:/Users/MAHALAXMI/OneDrive/Desktop/project/debugger.db) stores debugging history and benchmark evaluation records.
