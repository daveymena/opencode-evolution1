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

# Copiamos todo el proyecto primero
# En monorepos es más seguro copiar todo para que pnpm encuentre todas las referencias en el workspace
COPY . .

# Instalar dependencias (quitamos frozen-lockfile para evitar errores de sincronización ligeros entre Windows/Linux)
RUN pnpm install

# Construir la aplicación (esto compilará React y el servidor API)
RUN pnpm run build

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
EXPOSE 3001

VOLUME ["/root/.local/share/opencode", "/root/workspace", "/root/projects"]

ENTRYPOINT ["/app/entrypoint.sh"]
