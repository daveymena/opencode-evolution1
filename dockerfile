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

# Instalación NATIVA de OpenCode (latest estable) y Claude Code
RUN npm install -g opencode-ai @anthropic-ai/claude-code --force

ENV HOME=/root
# Evitar que opencode intente abrir un browser en entorno headless
ENV BROWSER=echo
ENV DISPLAY=

# Copiar entrypoint y config
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
