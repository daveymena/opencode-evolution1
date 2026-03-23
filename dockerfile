##############################################################################
# STAGE 1 — Build del monorepo (frontend + api-server)
##############################################################################
FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@latest

WORKDIR /build

# Copiar workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json tsconfig.json ./

# Copiar libs y artifacts
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/opencode-evolved/ ./artifacts/opencode-evolved/

# Instalar dependencias
RUN pnpm install --no-frozen-lockfile

# Build API server
RUN echo ">>> Building API server..." \
    && pnpm --filter "@workspace/api-server" run build \
    && echo ">>> API server OK" \
    && ls -la artifacts/api-server/dist/

# Build frontend con config limpio (sin plugins de Replit)
ENV NODE_ENV=production
RUN echo ">>> Building frontend..." \
    && cd artifacts/opencode-evolved \
    && npx vite build --config vite.config.prod.ts \
    && echo ">>> Frontend OK" \
    && ls -la dist/public/

##############################################################################
# STAGE 2 — Imagen final
##############################################################################
FROM node:22-bookworm-slim AS final

RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    nginx \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g opencode-ai @anthropic-ai/claude-code openclaw --force
RUN npx clawhub install opencode-controller --non-interactive 2>/dev/null || true

ENV HOME=/root
ENV BROWSER=echo
ENV DISPLAY=

# API server
WORKDIR /app/api
COPY --from=builder /build/artifacts/api-server/dist ./dist
COPY --from=builder /build/artifacts/api-server/package.json ./package.json
RUN npm install --omit=dev bcryptjs jsonwebtoken pg

# Frontend estático
COPY --from=builder /build/artifacts/opencode-evolved/dist/public /app/web/public

# Verificar que los archivos existen
RUN echo ">>> Verificando frontend..." && ls -la /app/web/public/

# Nginx
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/conf.d/opencode.conf

RUN mkdir -p /root/.local/share/opencode /root/workspace

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000
EXPOSE 3000
EXPOSE 5173
EXPOSE 18789

VOLUME ["/root/.local/share/opencode", "/root/workspace"]

ENTRYPOINT ["/entrypoint.sh"]
