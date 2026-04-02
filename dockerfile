FROM node:22-bookworm-slim AS builder

# Sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm
RUN npm install -g pnpm@10

# Directorio de trabajo
WORKDIR /app

# Copiamos todo el proyecto primero
COPY . .

# Instalar dependencias
RUN pnpm install

# Construir solo el frontend
RUN pnpm --filter @workspace/opencode-evolved run build

# Production stage
FROM node:22-bookworm-slim

# Sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm y opencode
RUN npm install -g pnpm@10 opencode-ai --force

WORKDIR /app

# Copiar dependencias necesarias para docker-serve.mjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules

# Copiar lo necesario del builder
COPY --from=builder /app/artifacts/opencode-evolved/dist ./artifacts/opencode-evolved/dist
COPY --from=builder /app/docker-serve.mjs ./docker-serve.mjs
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
COPY --from=builder /app/nginx.conf ./nginx.conf
COPY --from=builder /app/.env.example ./.env.example

ENV HOME=/root
ENV BROWSER=echo
ENV DISPLAY=

# Preparar carpetas persistentes
RUN mkdir -p /root/.local/share/opencode /root/workspace /root/projects

# Configuración de Git global
RUN git config --global user.name "OpenCode Bot" && \
    git config --global user.email "opencode@localhost" && \
    git config --global init.defaultBranch main

# Configurar entrypoint y permisos
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
EXPOSE 5173

VOLUME ["/root/.local/share/opencode", "/root/workspace", "/root/projects"]

ENTRYPOINT ["/app/entrypoint.sh"]
