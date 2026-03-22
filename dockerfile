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
# Evitar que opencode intente abrir un browser en entorno headless
ENV BROWSER=echo
ENV DISPLAY=
# Sin password para evitar el bucle de Basic Auth en EasyPanel
# La seguridad se maneja a nivel de EasyPanel (dominio/acceso)
# Si necesitas password, configúralo como variable de entorno en EasyPanel:
# OPENCODE_SERVER_PASSWORD=tu_password

# Puerto estándar para EasyPanel
EXPOSE 3000

# Iniciar OpenCode en modo servidor web (headless, sin abrir browser)
CMD ["opencode", "web", "--hostname", "0.0.0.0", "--port", "3000"]
