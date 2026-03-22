FROM node:22-bookworm-slim AS base

# Dependencias del Sistema para que OpenCode pueda compilar y ejecutar de todo
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    golang-go \
    git \
    curl \
    wget \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Instalación NATIVA de OpenCode
RUN npm install -g opencode-ai --force

# Directorio de trabajo y persistencia
WORKDIR /app
ENV HOME=/root
ENV OPENCODE_SERVER_PASSWORD=OpenCode_Evo_2026

# Puerto estándar para EasyPanel
EXPOSE 3000

# Iniciar la Interfaz Web Original de OpenCode
# --hostname 0.0.0.0 para que sea accesible desde afuera del contenedor
CMD ["opencode", "web", "--hostname", "0.0.0.0", "--port", "3000"]
