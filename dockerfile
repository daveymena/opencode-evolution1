FROM node:22-slim AS base

# Servidor "All-in-One": Dependencias para Trading Bots, WhatsApp Bots (Baileys/WWebJS) y múltiples lenguajes
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    make \
    g++ \
    chromium \
    ffmpeg \
    libnss3 \
    libnss3-dev \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libxshmfence1 \
    redis-tools \
    golang \
    jq \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Herramientas globales para ejecución y bots
RUN npm install -g pnpm@10 pm2 tsx ts-node nodemon yarn --force

# OpenCode AI
RUN npm install -g opencode-ai || true

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY tsconfig.base.json ./

COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/opencode-evolved/ ./artifacts/opencode-evolved/
COPY scripts/ ./scripts/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/opencode-evolved run build
RUN pnpm --filter @workspace/api-server run build

# Production stage
FROM node:22-slim AS production

# Dependencias espejo para producción (incluyendo ffmpeg para WhatsApp bots y librerías web)
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    python3 \
    python3-pip \
    build-essential \
    chromium \
    ffmpeg \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libxshmfence1 \
    redis-tools \
    golang \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10 pm2 tsx ts-node yarn opencode-ai --force || true

WORKDIR /app

COPY --from=base /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=base /app/artifacts/opencode-evolved/dist ./artifacts/opencode-evolved/dist
COPY --from=base /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=base /app/lib/db/drizzle ./lib/db/drizzle
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile
RUN npm install express http-proxy-middleware

COPY docker-serve.mjs ./

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "docker-serve.mjs"]
