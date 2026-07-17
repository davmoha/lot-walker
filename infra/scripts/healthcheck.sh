#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Lot Walker — Health Check Script
# Run: bash infra/scripts/healthcheck.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="${DOMAIN:-localhost}"
API_URL="${API_URL:-http://localhost:3001}"

echo "═══════════════════════════════════════════════════"
echo "  Lot Walker Health Check — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════"

# ── Docker services ───────────────────────────────────────────────────────────
echo ""
echo "▶ Docker service status:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || \
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null

# ── API health ────────────────────────────────────────────────────────────────
echo ""
echo "▶ API health endpoint:"
HEALTH=$(curl -sf "${API_URL}/health" 2>/dev/null || echo "UNREACHABLE")
echo "  ${HEALTH}"

# ── PostgreSQL ────────────────────────────────────────────────────────────────
echo ""
echo "▶ PostgreSQL:"
docker exec $(docker ps -qf "name=postgres") pg_isready -U lotwalkr 2>/dev/null && \
  echo "  ✓ PostgreSQL is ready" || echo "  ✗ PostgreSQL is NOT ready"

# ── Redis ─────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Redis:"
docker exec $(docker ps -qf "name=redis") redis-cli -a "${REDIS_PASSWORD:-}" ping 2>/dev/null && \
  echo "  ✓ Redis is ready" || echo "  ✗ Redis is NOT ready"

# ── Ollama ────────────────────────────────────────────────────────────────────
echo ""
echo "▶ Ollama:"
OLLAMA=$(curl -sf "http://localhost:11434/api/tags" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('Models: '+', '.join(m['name'] for m in d.get('models',[])))" 2>/dev/null || echo "UNREACHABLE")
echo "  ${OLLAMA}"

# ── Disk usage ────────────────────────────────────────────────────────────────
echo ""
echo "▶ Disk usage:"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5" full)"}'

# ── Memory ───────────────────────────────────────────────────────────────────
echo ""
echo "▶ Memory:"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2}'

echo ""
echo "═══════════════════════════════════════════════════"
