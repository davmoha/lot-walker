# Lot Walker

**Multi-tenant automotive lot walkthrough platform** — VIN scanning, issue tracking, voice-to-action, shop kiosk, and analytics for car dealerships.

---

## Architecture

```
lot-walker/
├── backend/          Node.js/Express API (ES Modules)
├── frontend/         Vite + React + TypeScript + TailwindCSS PWA
├── migrations/       PostgreSQL schema with RLS policies
├── infra/
│   ├── caddy/        Caddyfile (automatic HTTPS via Let's Encrypt)
│   ├── ollama/       Ollama entrypoint (auto-pulls llama3.1:8b)
│   └── scripts/      deploy.sh, healthcheck.sh
├── docs/             Kiosk setup guide, onboarding checklist
├── docker-compose.yml         Development
└── docker-compose.prod.yml    Production
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22, Express, PostgreSQL 16, Redis 7 |
| Frontend | Vite, React 18, TypeScript, TailwindCSS, Recharts |
| AI | Ollama (llama3.1:8b-instruct-q4_K_M) + Deepgram Nova-3 |
| Auth | JWT + PostgreSQL RLS (row-level security) |
| Proxy | Caddy 2 (automatic Let's Encrypt TLS) |
| Backups | Daily PostgreSQL dumps to S3 |

---

## Features by Phase

| Phase | Feature |
|---|---|
| 1 | Multi-tenant PostgreSQL with RLS, Redis, Ollama |
| 2 | JWT auth, role-based middleware, full CRUD API |
| 3 | Login page, Super Admin dashboard, company management |
| 4 | Company Admin: users, departments, technicians, settings |
| 5 | Smart CSV import with fuzzy header mapping and VIN cleansing |
| 6 | Lot Walkthrough PWA: VIN scanner, offline queue, issue form |
| 7 | Shop Kiosk: large-format tablet UI, 30s auto-refresh, close modal |
| 8 | Voice-to-Action: Deepgram STT → Ollama → DB insert + email |
| 9 | Reports: Time-to-Line, Dept Bottleneck, Tech Velocity, CSV export |
| 10 | Production Docker Compose, SSL, backups, kiosk docs |

---

## Quick Start (Development)

```bash
# Clone
git clone https://github.com/davmoha/lot-walker.git
cd lot-walker

# Start infrastructure
docker compose up -d

# Backend
cd backend
cp .env.example .env   # Fill in your values
pnpm install
pnpm dev

# Frontend
cd ../frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`. The API runs on `http://localhost:3001`.

---

## Production Deployment

```bash
# On your VPS (Ubuntu 22.04+):
DOMAIN=yourdomain.com bash infra/scripts/deploy.sh
```

The script installs Docker, clones the repo, prompts you to fill in `.env.prod`, then builds and starts all services with automatic HTTPS.

See [docs/KIOSK_TABLET_SETUP.md](docs/KIOSK_TABLET_SETUP.md) for tablet configuration and [docs/ONBOARDING_CHECKLIST.md](docs/ONBOARDING_CHECKLIST.md) for new dealership setup.

---

## Environment Variables

Copy `.env.prod.example` to `.env.prod` and fill in all values. Key variables:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `JWT_SECRET` | 64-character random string for JWT signing |
| `SMTP_*` | Transactional email credentials (SendGrid, Mailgun, etc.) |
| `DEEPGRAM_API_KEY` | Deepgram API key for voice transcription |
| `BACKUP_S3_BUCKET` | S3 bucket for daily PostgreSQL backups |

---

## Security

All tenant data is isolated at the database level via PostgreSQL **Row Level Security (RLS)** policies. Every authenticated request sets `app.current_company_id` as a session variable, and all queries are filtered by this value. Cross-tenant data access is structurally impossible even with raw SQL.

---

## License

Proprietary — All rights reserved.
