#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Lot Walker — VPS Deployment Script
# Tested on Ubuntu 22.04 / 24.04
# Run as root or sudo user:  bash infra/scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/davmoha/lot-walker.git}"
APP_DIR="${APP_DIR:-/opt/lot-walker}"
DOMAIN="${DOMAIN:-yourdomain.com}"

echo "════════════════════════════════════════════════"
echo "  Lot Walker — Deployment Script"
echo "  Domain: ${DOMAIN}"
echo "════════════════════════════════════════════════"

# ── 1. System updates ─────────────────────────────────────────────────────────
echo ""
echo "[1/8] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Install Docker ─────────────────────────────────────────────────────────
echo ""
echo "[2/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  usermod -aG docker "${SUDO_USER:-ubuntu}"
  echo "  ✓ Docker installed"
else
  echo "  ✓ Docker already installed ($(docker --version))"
fi

# ── 3. Install Docker Compose plugin ─────────────────────────────────────────
echo ""
echo "[3/8] Checking Docker Compose..."
docker compose version &>/dev/null && echo "  ✓ Docker Compose available" || \
  (apt-get install -y docker-compose-plugin && echo "  ✓ Docker Compose installed")

# ── 4. Clone / update repo ───────────────────────────────────────────────────
echo ""
echo "[4/8] Cloning repository..."
if [ -d "${APP_DIR}/.git" ]; then
  cd "${APP_DIR}" && git pull origin master
  echo "  ✓ Repository updated"
else
  git clone "${REPO_URL}" "${APP_DIR}"
  echo "  ✓ Repository cloned to ${APP_DIR}"
fi

cd "${APP_DIR}"

# ── 5. Environment file ───────────────────────────────────────────────────────
echo ""
echo "[5/8] Checking environment file..."
if [ ! -f .env.prod ]; then
  cp .env.prod.example .env.prod
  echo "  ⚠  .env.prod created from example."
  echo "  ⚠  EDIT ${APP_DIR}/.env.prod before continuing!"
  echo "  ⚠  Set POSTGRES_PASSWORD, JWT_SECRET, SMTP credentials, etc."
  echo ""
  echo "  Run: nano ${APP_DIR}/.env.prod"
  echo "  Then re-run this script."
  exit 1
else
  echo "  ✓ .env.prod exists"
fi

# ── 6. Update Caddyfile domain ────────────────────────────────────────────────
echo ""
echo "[6/8] Configuring Caddyfile for domain: ${DOMAIN}..."
sed -i "s/yourdomain.com/${DOMAIN}/g" infra/caddy/Caddyfile
echo "  ✓ Caddyfile updated"

# ── 7. Build and start services ───────────────────────────────────────────────
echo ""
echo "[7/8] Building and starting services..."
docker compose -f docker-compose.prod.yml pull --quiet
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

echo "  ✓ Services started"

# ── 8. Health check ───────────────────────────────────────────────────────────
echo ""
echo "[8/8] Waiting for services to be healthy (60s)..."
sleep 60
bash infra/scripts/healthcheck.sh

echo ""
echo "════════════════════════════════════════════════"
echo "  ✓ Deployment complete!"
echo "  App URL: https://${DOMAIN}"
echo "  Logs:    docker compose -f docker-compose.prod.yml logs -f"
echo "════════════════════════════════════════════════"
