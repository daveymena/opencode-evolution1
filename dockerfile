FROM node:22-bookworm-slim AS base

# Dependencias del Sistema
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    golang-go \
    git \
    curl \
    wget \
    chromium \
    libfuse2 \
    && rm -rf /var/lib/apt/lists/*

# Instalación NATIVA de OpenCode y Claude Code
# v0.4.45: serie 0.4.x — muestra todos los modelos y pide API key al seleccionar
RUN npm install -g opencode-ai@0.4.45 @anthropic-ai/claude-code --force

# Directorio de trabajo y persistencia
WORKDIR /app
ENV HOME=/root
# Evitar que opencode intente abrir un browser en entorno headless
ENV BROWSER=echo
ENV DISPLAY=

# Copiar entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Puerto estándar para EasyPanel
EXPOSE 3000

# El entrypoint construye auth.json desde env vars y luego lanza opencode
ENTRYPOINT ["/entrypoint.sh"]
