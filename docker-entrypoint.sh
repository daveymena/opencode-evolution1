#!/bin/bash
# ============================================================
# OpenCode - Docker Entrypoint Script
# Script de entrada para Docker/EasyPanel
# ============================================================

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  OpenCode Evolution - Docker Entrypoint                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

cd /app || cd /workspace || true

echo "📁 Directorio de trabajo: $(pwd)"
echo "🔌 Puerto: ${PORT:-3000}"
echo ""

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "⚠️  No se encontraron dependencias instaladas"
    echo "📦 Instalando dependencias con pnpm..."

    # Instalar pnpm si no está disponible
    if ! command -v pnpm &> /dev/null; then
        npm install -g pnpm
    fi

    # Instalar dependencias
    pnpm install --no-frozen-lockfile || npm install
fi

# Función para iniciar el servidor estático
start_static_server() {
    echo "📦 Iniciando servidor estático (frontend)..."
    node docker-serve.mjs &
    STATIC_PID=$!
    echo "✅ Servidor estático iniciado (PID: $STATIC_PID)"
}

# Configurar puerto de la API
export API_PORT=${API_PORT:-5000}

# Función para iniciar el servidor API
start_api_server() {
    # Preferimos index.mjs (formato nuevo de build) pero soportamos index.js
    API_BIN=""
    if [ -f "artifacts/api-server/dist/index.mjs" ]; then
        API_BIN="artifacts/api-server/dist/index.mjs"
    elif [ -f "artifacts/api-server/dist/index.js" ]; then
        API_BIN="artifacts/api-server/dist/index.js"
    elif [ -f "api-server/dist/index.mjs" ]; then
        API_BIN="api-server/dist/index.mjs"
    fi

    if [ -n "$API_BIN" ]; then
        echo "✅ Servidor API encontrado en: $API_BIN"
        echo "🚀 Iniciando servidor API en puerto $API_PORT..."
        PORT=$API_PORT node "$API_BIN" &
        API_PID=$!
        echo "✅ Servidor API iniciado (PID: $API_PID)"
    else
        echo "🔨 Construyendo el servidor API..."
        pnpm --filter @workspace/api-server run build || true
        # Re-verificar después de build
        if [ -f "artifacts/api-server/dist/index.mjs" ]; then
            PORT=$API_PORT node artifacts/api-server/dist/index.mjs &
            API_PID=$!
            echo "✅ Servidor API iniciado (PID: $API_PID)"
        else
            echo "⚠️  No se pudo encontrar o construir el servidor API"
        fi
    fi
}

# Iniciar ambos servidores
start_static_server
start_api_server

# Esperar a que todos los procesos terminen
wait
