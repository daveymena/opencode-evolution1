FROM node:22-bookworm-slim AS base

# Sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm y opencode
RUN npm install -g pnpm opencode-ai --force

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/opencode-evolved/package.json ./artifacts/opencode-evolved/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN pnpm run build

ENV HOME=/root
ENV BROWSER=echo
ENV DISPLAY=

# Preparar carpetas persistentes
RUN mkdir -p /root/.local/share/opencode /root/workspace /root/projects

# Configurar entrypoint
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000
EXPOSE 5173
EXPOSE 3001

VOLUME ["/root/.local/share/opencode", "/root/workspace", "/root/projects"]

ENTRYPOINT ["/app/entrypoint.sh"]
