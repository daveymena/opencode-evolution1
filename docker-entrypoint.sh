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

# Verificar si el servidor está compilado
if [ -f "artifacts/api-server/dist/index.js" ]; then
    echo "✅ Servidor encontrado: artifacts/api-server/dist/index.js"
    echo "🚀 Iniciando servidor..."
    exec node artifacts/api-server/dist/index.js
elif [ -f "api-server/dist/index.js" ]; then
    echo "✅ Servidor encontrado: api-server/dist/index.js"
    echo "🚀 Iniciando servidor..."
    exec node api-server/dist/index.js
else
    echo "🔨 Construyendo el servidor..."
    pnpm --filter @workspace/api-server run build || true

    echo "🚀 Iniciando con pnpm..."
    exec pnpm --filter @workspace/api-server run start
fi
