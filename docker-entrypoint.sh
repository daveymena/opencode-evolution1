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

# Función para iniciar el servidor API
start_api_server() {
    if [ -f "artifacts/api-server/dist/index.js" ]; then
        echo "✅ Servidor API encontrado: artifacts/api-server/dist/index.js"
        echo "🚀 Iniciando servidor API..."
        node artifacts/api-server/dist/index.js &
        API_PID=$!
        echo "✅ Servidor API iniciado (PID: $API_PID)"
    elif [ -f "api-server/dist/index.js" ]; then
        echo "✅ Servidor API encontrado: api-server/dist/index.js"
        echo "🚀 Iniciando servidor API..."
        node api-server/dist/index.js &
        API_PID=$!
        echo "✅ Servidor API iniciado (PID: $API_PID)"
    else
        echo "🔨 Construyendo el servidor API..."
        pnpm --filter @workspace/api-server run build || true
        if [ -f "artifacts/api-server/dist/index.js" ]; then
            echo "🚀 Iniciando servidor API..."
            node artifacts/api-server/dist/index.js &
            API_PID=$!
            echo "✅ Servidor API iniciado (PID: $API_PID)"
        else
            echo "⚠️  No se pudo construir el servidor API"
        fi
    fi
}

# Iniciar ambos servidores
start_static_server
start_api_server

# Esperar a que todos los procesos terminen
wait
