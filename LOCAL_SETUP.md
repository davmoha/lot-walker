# Local Development Setup

Follow these steps in order. This guide assumes a fresh machine (Windows WSL2, Mac, or Linux).

---

## Step 1 — Install Node.js 20 LTS

The project requires **Node.js 20** (or 18 at minimum). The easiest way to manage Node versions is with **nvm**.

### Install nvm (Mac / Linux / WSL2)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Close and reopen your terminal, then run:

```bash
nvm install 20
nvm use 20
node --version   # should print v20.x.x
npm --version    # should print 10.x.x
```

### Windows (without WSL)

Download and install the **Node.js 20 LTS** installer directly from https://nodejs.org — choose the **LTS** version. No nvm needed.

---

## Step 2 — Clone the Repository

```bash
# Replace YOUR_TOKEN with your GitHub Personal Access Token
git clone https://YOUR_TOKEN@github.com/davmoha/lot-walker.git
cd lot-walker
```

If you have SSH keys set up with GitHub, use:

```bash
git clone git@github.com:davmoha/lot-walker.git
cd lot-walker
```

---

## Step 3 — Set Up the Backend

```bash
cd backend

# Copy the example env file and fill in your values
cp .env.example .env
# Edit .env — at minimum set: DATABASE_URL, JWT_SECRET, SMTP_* variables

# Install dependencies (uses npm — no pnpm needed)
npm install

# Start the dev server (auto-restarts on file changes)
npm run dev
```

The API will be available at `http://localhost:3001`.

---

## Step 4 — Set Up the Frontend

Open a **second terminal** in the `lot-walker` folder:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`. It automatically proxies `/api` calls to the backend on port 3001.

---

## Step 5 — Start the Database (Docker)

You need PostgreSQL and Redis running locally. Docker is the easiest way:

```bash
# From the repo root
docker compose up -d postgres redis
```

This starts only the database services (not Ollama, which is large). The migrations in `/migrations/01_schema.sql` are auto-applied on first boot.

If you don't have Docker, you can install PostgreSQL 16 and Redis 7 manually and update your `.env` `DATABASE_URL` accordingly.

---

## Step 6 — Verify Everything Works

| Check | Command | Expected result |
|---|---|---|
| Node version | `node --version` | `v20.x.x` |
| Backend syntax | `cd backend && node --check src/index.js` | No output (no errors) |
| Frontend typecheck | `cd frontend && npm run typecheck` | No output (no errors) |
| Frontend build | `cd frontend && npm run build` | `✓ built in Xs` |
| API health | `curl http://localhost:3001/health` | `{"status":"ok",...}` |

---

## Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `pnpm: command not found` | Old lockfile or docs referenced pnpm | Use `npm install` — pnpm is no longer required |
| `Cannot find module 'vite'` | Dependencies not installed | Run `npm install` inside `frontend/` |
| `Error: Cannot find module '../db/pool.js'` | Backend deps not installed | Run `npm install` inside `backend/` |
| `ECONNREFUSED 5432` | PostgreSQL not running | Run `docker compose up -d postgres` |
| `JWT_SECRET is not defined` | Missing `.env` file | Copy `.env.example` to `.env` and fill in values |
| `SyntaxError: Cannot use import statement` | Node version too old | Upgrade to Node 18+ with nvm |
| Port 5173 already in use | Another Vite process running | Kill it: `lsof -ti:5173 \| xargs kill` |
| Port 3001 already in use | Another backend process running | Kill it: `lsof -ti:3001 \| xargs kill` |
