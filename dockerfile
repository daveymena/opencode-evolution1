##############################################################################
# STAGE 1 — Build del monorepo (frontend + api-server)
##############################################################################
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

# pnpm
RUN npm install -g pnpm@latest

WORKDIR /build

# Copiar archivos de configuración del workspace primero (mejor cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json tsconfig.json ./

# Copiar libs (dependencias internas)
COPY lib/ ./lib/

# Copiar artifacts
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/opencode-evolved/ ./artifacts/opencode-evolved/

# Instalar todas las dependencias (sin frozen para tolerar cambios en lockfile)
RUN pnpm install --no-frozen-lockfile

# Build de las libs primero
RUN pnpm --filter "@workspace/api-zod" run build 2>/dev/null || true
RUN pnpm --filter "@workspace/api-client-react" run build 2>/dev/null || true

# Build del API server
RUN echo "=== Building API server ===" && pnpm --filter "@workspace/api-server" run build && echo "=== API server build OK ==="

# Build del frontend (Vite) — v2
ENV NODE_ENV=production
RUN echo "=== Building frontend ===" && pnpm --filter "@workspace/opencode-evolved" run build && echo "=== Frontend build OK ==="

# Verificar que los builds existen
RUN ls -la /build/artifacts/api-server/dist/ && ls -la /build/artifacts/opencode-evolved/dist/public/

##############################################################################
# STAGE 2 — Imagen final de producción
##############################################################################
FROM node:22-bookworm-slim AS final

# Sistema: git, curl, nginx, python3, golang
RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# OpenCode + OpenClaw
RUN npm install -g opencode-ai @anthropic-ai/claude-code openclaw --force
RUN npx clawhub install opencode-controller --non-interactive 2>/dev/null || true

# pnpm (para el api-server en runtime)
RUN npm install -g pnpm@latest

ENV HOME=/root
ENV BROWSER=echo
ENV DISPLAY=

# ── Copiar artefactos del build ───────────────────────────────────────────────

# API server compilado
WORKDIR /app/api
COPY --from=builder /build/artifacts/api-server/dist ./dist
COPY --from=builder /build/artifacts/api-server/package.json ./package.json
# Instalar solo dependencias de producción del api-server
RUN npm install --omit=dev bcryptjs jsonwebtoken pg 2>/dev/null || true

# Frontend compilado (archivos estáticos)
COPY --from=builder /build/artifacts/opencode-evolved/dist/public /app/web/public

# ── Nginx: sirve el frontend en :4000, proxy al api en :3001 ─────────────────
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/conf.d/opencode.conf

# ── Directorios persistentes ──────────────────────────────────────────────────
RUN mkdir -p /root/.local/share/opencode /root/workspace

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Puerto principal (nginx → frontend + api proxy)
EXPOSE 4000
# Puerto opencode web nativo
EXPOSE 3000
# Puerto dev server de proyectos generados
EXPOSE 5173
# Puerto OpenClaw gateway
EXPOSE 18789

VOLUME ["/root/.local/share/opencode", "/root/workspace"]

ENTRYPOINT ["/entrypoint.sh"]
