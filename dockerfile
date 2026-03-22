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
RUN npm install -g opencode-ai @anthropic-ai/claude-code --force

# Directorio de trabajo y persistencia
WORKDIR /app
ENV HOME=/root
ENV OPENCODE_SERVER_PASSWORD=OpenCode_Evo_2026

# Puerto estándar para EasyPanel
EXPOSE 3000

# Iniciar la Interfaz Web Original de OpenCode
CMD ["opencode", "web", "--hostname", "0.0.0.0", "--port", "3000", "--password", "OpenCode_Evo_2026"]
