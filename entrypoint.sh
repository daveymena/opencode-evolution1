#!/bin/sh
set -e

AUTH_DIR="/root/.local/share/opencode"
CONFIG_FILE="/root/opencode.json"
WORKSPACE="/root/workspace"

mkdir -p "$AUTH_DIR" "$WORKSPACE"

# ── 1. auth.json ──────────────────────────────────────────────────────────────
HAS_KEY=0; AUTH_JSON="{"; SEP=""
add_key() { AUTH_JSON="${AUTH_JSON}${SEP}\"${1}\":{\"api_key\":\"${2}\"}"; SEP=","; HAS_KEY=1; }
[ -n "$OPENAI_API_KEY" ]     && add_key "openai"     "$OPENAI_API_KEY"
[ -n "$ANTHROPIC_API_KEY" ]  && add_key "anthropic"  "$ANTHROPIC_API_KEY"
[ -n "$GOOGLE_API_KEY" ]     && add_key "google"     "$GOOGLE_API_KEY"
[ -n "$XAI_API_KEY" ]        && add_key "xai"        "$XAI_API_KEY"
[ -n "$DEEPSEEK_API_KEY" ]   && add_key "deepseek"   "$DEEPSEEK_API_KEY"
[ -n "$MISTRAL_API_KEY" ]    && add_key "mistral"    "$MISTRAL_API_KEY"
[ -n "$GROQ_API_KEY" ]       && add_key "groq"       "$GROQ_API_KEY"
[ -n "$OPENROUTER_API_KEY" ] && add_key "openrouter" "$OPENROUTER_API_KEY"
AUTH_JSON="${AUTH_JSON}}"
[ $HAS_KEY -eq 1 ] && echo "$AUTH_JSON" > "$AUTH_DIR/auth.json" && echo "[entrypoint] auth.json OK"

# ── 2. opencode.json con todos los providers ──────────────────────────────────
cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai":     { "options": { "apiKey": "{env:OPENAI_API_KEY}" } },
    "anthropic":  { "options": { "apiKey": "{env:ANTHROPIC_API_KEY}" } },
    "google":     { "options": { "apiKey": "{env:GOOGLE_API_KEY}" } },
    "xai":        { "options": { "apiKey": "{env:XAI_API_KEY}" } },
    "deepseek":   { "options": { "apiKey": "{env:DEEPSEEK_API_KEY}" } },
    "mistral":    { "options": { "apiKey": "{env:MISTRAL_API_KEY}" } },
    "groq":       { "options": { "apiKey": "{env:GROQ_API_KEY}" } },
    "openrouter": { "options": { "apiKey": "{env:OPENROUTER_API_KEY}" } }
  }
}
EOF
echo "[entrypoint] opencode.json OK"

# ── 3. Git workspace ──────────────────────────────────────────────────────────
git config --global user.name  "${GIT_USER_NAME:-OpenCode Bot}"
git config --global user.email "${GIT_USER_EMAIL:-opencode@localhost}"
git config --global --add safe.directory "$WORKSPACE"
git config --global init.defaultBranch main

cd "$WORKSPACE"
if [ -n "$GIT_REPO_URL" ]; then
  if [ ! -d ".git" ]; then
    echo "[entrypoint] Clonando $GIT_REPO_URL ..."
    git clone "$GIT_REPO_URL" . 2>&1 || { git init; git remote add origin "$GIT_REPO_URL"; }
  else
    echo "[entrypoint] Pull del repo..."
    git pull origin "${GIT_BRANCH:-main}" --rebase 2>&1 || true
  fi
else
  [ ! -d ".git" ] && git init && git commit --allow-empty -m "init: workspace"
fi
echo "[entrypoint] Workspace listo: $WORKSPACE"

# ── 4. Watcher: auto npm install + dev server ─────────────────────────────────
(
  DEV_PID=""
  while true; do
    sleep 8
    cd "$WORKSPACE" 2>/dev/null || continue

    # Auto-instalar dependencias
    if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
      echo "[watcher] npm install..."
      npm install --silent 2>&1 | tail -3 || true
    fi

    # Levantar dev server si no está corriendo
    if [ -f "package.json" ] && [ -z "$DEV_PID" ]; then
      HAS_SCRIPT=$(node -e "try{const p=require('./package.json');console.log(p.scripts&&(p.scripts.dev||p.scripts.start)?'yes':'no')}catch(e){console.log('no')}" 2>/dev/null || echo "no")
      if [ "$HAS_SCRIPT" = "yes" ]; then
        echo "[watcher] Iniciando dev server en :5173..."
        PORT=5173 npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/devserver.log 2>&1 &
        DEV_PID=$!
      fi
    fi

    # Reiniciar si murió
    if [ -n "$DEV_PID" ] && ! kill -0 "$DEV_PID" 2>/dev/null; then
      echo "[watcher] Dev server caído, reiniciando..."
      DEV_PID=""
    fi
  done
) &

# ── 5. OpenClaw gateway ───────────────────────────────────────────────────────
# Variables necesarias en EasyPanel:
#   OPENCLAW_GATEWAY_TOKEN  → token de seguridad del gateway
#   TELEGRAM_BOT_TOKEN      → token del bot de Telegram (opcional)
#   OPENCLAW_MODEL          → modelo a usar (default: opencode/claude-opus-4-6)
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
  mkdir -p /root/.openclaw

  # Prioridad de modelos:
  # 1. Modelos Zen gratuitos de opencode (requiere OPENCODE_API_KEY)
  # 2. Anthropic si hay key
  # 3. OpenAI si hay key
  # 4. Google si hay key
  # 5. OpenRouter si hay key

  OC_ENV_BLOCK=""

  if [ -n "$OPENCODE_API_KEY" ]; then
    # Modelos Zen gratuitos — Big Pickle es el más capaz actualmente
    OC_MODEL="${OPENCLAW_MODEL:-opencode/big-pickle}"
    OC_ENV_BLOCK="\"OPENCODE_API_KEY\":\"${OPENCODE_API_KEY}\""
    echo "[entrypoint] OpenClaw usará modelos Zen gratuitos de opencode"
  elif [ -n "$ANTHROPIC_API_KEY" ]; then
    OC_MODEL="${OPENCLAW_MODEL:-anthropic/claude-sonnet-4-5}"
    OC_ENV_BLOCK="\"ANTHROPIC_API_KEY\":\"${ANTHROPIC_API_KEY}\""
  elif [ -n "$OPENAI_API_KEY" ]; then
    OC_MODEL="${OPENCLAW_MODEL:-openai/gpt-4o}"
    OC_ENV_BLOCK="\"OPENAI_API_KEY\":\"${OPENAI_API_KEY}\""
  elif [ -n "$GOOGLE_API_KEY" ]; then
    OC_MODEL="${OPENCLAW_MODEL:-google/gemini-2.5-flash}"
    OC_ENV_BLOCK="\"GOOGLE_API_KEY\":\"${GOOGLE_API_KEY}\""
  elif [ -n "$OPENROUTER_API_KEY" ]; then
    OC_MODEL="${OPENCLAW_MODEL:-openrouter/anthropic/claude-sonnet-4-5}"
    OC_ENV_BLOCK="\"OPENROUTER_API_KEY\":\"${OPENROUTER_API_KEY}\""
  else
    OC_MODEL="opencode/big-pickle"
    echo "[entrypoint] ADVERTENCIA: Sin API keys — OpenClaw puede no funcionar"
  fi

  TELEGRAM_SECTION=""
  [ -n "$TELEGRAM_BOT_TOKEN" ] && TELEGRAM_SECTION=",\"channels\":{\"telegram\":{\"botToken\":\"${TELEGRAM_BOT_TOKEN}\"}}"

  cat > /root/.openclaw/openclaw.json << OCEOF
{
  "agent": {
    "model": "${OC_MODEL}"
  },
  "env": { ${OC_ENV_BLOCK} },
  "gateway": {
    "port": 18789,
    "bind": "lan",
    "auth": { "mode": "token", "token": "${OPENCLAW_GATEWAY_TOKEN}" }
  }
  ${TELEGRAM_SECTION}
}
OCEOF

  echo "[entrypoint] OpenClaw modelo: $OC_MODEL"
  oclaw gateway --allow-unconfigured --bind lan > /tmp/openclaw.log 2>&1 &
  echo "[entrypoint] OpenClaw gateway iniciado en :18789"
else
  echo "[entrypoint] OPENCLAW_GATEWAY_TOKEN no configurado — OpenClaw desactivado"
fi

# ── 6. Lanzar opencode ────────────────────────────────────────────────────────
echo "[entrypoint] Iniciando opencode web en :3000"
exec opencode web --hostname 0.0.0.0 --port 3000
