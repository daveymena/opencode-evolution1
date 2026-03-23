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
  },
  "autoshare": false
}
EOF

# Si hay una key de modelo con visión, establecerlo como default
# Prioridad: Anthropic > Google > OpenAI > OpenRouter
if [ -n "$ANTHROPIC_API_KEY" ]; then
  DEFAULT_MODEL="anthropic/claude-sonnet-4-5"
elif [ -n "$GOOGLE_API_KEY" ]; then
  DEFAULT_MODEL="google/gemini-2.5-flash"
elif [ -n "$OPENAI_API_KEY" ]; then
  DEFAULT_MODEL="openai/gpt-4o"
elif [ -n "$OPENROUTER_API_KEY" ]; then
  DEFAULT_MODEL="openrouter/anthropic/claude-sonnet-4-5"
fi

if [ -n "$DEFAULT_MODEL" ]; then
  # Inyectar model default en el config
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$CONFIG_FILE','utf8'));
    cfg.model = '$DEFAULT_MODEL';
    fs.writeFileSync('$CONFIG_FILE', JSON.stringify(cfg, null, 2));
  " 2>/dev/null && echo "[entrypoint] Modelo con visión por defecto: $DEFAULT_MODEL"
fi
echo "[entrypoint] opencode.json OK"

# ── 3. Git workspace ──────────────────────────────────────────────────────────
git config --global user.name  "${GIT_USER_NAME:-OpenCode Bot}"
git config --global user.email "${GIT_USER_EMAIL:-opencode@localhost}"
git config --global --add safe.directory "$WORKSPACE"
git config --global init.defaultBranch main

# Configurar autenticación HTTPS con token si se provee
# Variable: GIT_TOKEN (Personal Access Token de GitHub/GitLab)
if [ -n "$GIT_TOKEN" ] && [ -n "$GIT_REPO_URL" ]; then
  # Extraer el host de la URL para configurar el credential helper
  GIT_HOST=$(echo "$GIT_REPO_URL" | sed 's|https://||' | sed 's|/.*||')
  git config --global credential.helper store
  # Escribir credenciales en el store
  echo "https://oauth2:${GIT_TOKEN}@${GIT_HOST}" > /root/.git-credentials
  echo "https://${GIT_TOKEN}:x-oauth-basic@${GIT_HOST}" >> /root/.git-credentials
  chmod 600 /root/.git-credentials
  echo "[entrypoint] Git token configurado para $GIT_HOST"
fi

# Configurar SSH si se provee clave privada
# Variable: GIT_SSH_KEY (contenido de la clave privada, en base64)
if [ -n "$GIT_SSH_KEY" ]; then
  mkdir -p /root/.ssh
  echo "$GIT_SSH_KEY" | base64 -d > /root/.ssh/id_rsa 2>/dev/null || echo "$GIT_SSH_KEY" > /root/.ssh/id_rsa
  chmod 600 /root/.ssh/id_rsa
  # Aceptar automáticamente fingerprints de hosts conocidos
  ssh-keyscan github.com gitlab.com bitbucket.org >> /root/.ssh/known_hosts 2>/dev/null
  chmod 644 /root/.ssh/known_hosts
  echo "[entrypoint] SSH key configurada"
fi

# Construir URL con token embebido si es HTTPS y hay token
EFFECTIVE_REPO_URL="$GIT_REPO_URL"
if [ -n "$GIT_TOKEN" ] && [ -n "$GIT_REPO_URL" ]; then
  # Insertar token en URL: https://TOKEN@github.com/user/repo.git
  EFFECTIVE_REPO_URL=$(echo "$GIT_REPO_URL" | sed "s|https://|https://${GIT_TOKEN}@|")
fi

cd "$WORKSPACE"
if [ -n "$GIT_REPO_URL" ]; then
  if [ ! -d ".git" ]; then
    echo "[entrypoint] Clonando $GIT_REPO_URL ..."
    git clone "$EFFECTIVE_REPO_URL" . 2>&1 || { git init; git remote add origin "$EFFECTIVE_REPO_URL"; }
  else
    # Actualizar remote con token por si cambió
    git remote set-url origin "$EFFECTIVE_REPO_URL" 2>/dev/null || true
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
  FAIL_COUNT=0
  MAX_FAILS=3

  while true; do
    sleep 10
    cd "$WORKSPACE" 2>/dev/null || continue

    # Solo actuar si hay package.json Y un directorio src/ o index.html
    # (evitar activarse con package.json vacíos o del workspace raíz)
    if [ ! -f "package.json" ] || { [ ! -d "src" ] && [ ! -f "index.html" ] && [ ! -f "index.js" ]; }; then
      continue
    fi

    # Auto-instalar dependencias
    if [ ! -d "node_modules" ]; then
      echo "[watcher] npm install..."
      npm install --silent 2>&1 | tail -3 || continue
    fi

    # Si ya superó el límite de fallos, no reintentar
    if [ $FAIL_COUNT -ge $MAX_FAILS ]; then
      sleep 60
      continue
    fi

    # Levantar dev server si no está corriendo
    if [ -z "$DEV_PID" ] || ! kill -0 "$DEV_PID" 2>/dev/null; then
      HAS_SCRIPT=$(node -e "try{const p=require('./package.json');console.log(p.scripts&&(p.scripts.dev||p.scripts.start)?'yes':'no')}catch(e){console.log('no')}" 2>/dev/null || echo "no")
      if [ "$HAS_SCRIPT" = "yes" ]; then
        echo "[watcher] Iniciando dev server en :5173..."
        PORT=5173 npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/devserver.log 2>&1 &
        DEV_PID=$!
        sleep 5
        # Verificar que arrancó correctamente
        if ! kill -0 "$DEV_PID" 2>/dev/null; then
          FAIL_COUNT=$((FAIL_COUNT + 1))
          echo "[watcher] Dev server falló ($FAIL_COUNT/$MAX_FAILS). Log:"
          tail -5 /tmp/devserver.log
          DEV_PID=""
          [ $FAIL_COUNT -ge $MAX_FAILS ] && echo "[watcher] Demasiados fallos, pausando reintentos por 60s"
        else
          FAIL_COUNT=0
          echo "[watcher] Dev server corriendo (PID $DEV_PID)"
        fi
      fi
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

# ── 6. API Server (Express + Drizzle) ────────────────────────────────────────
if [ -f "/app/api/dist/index.mjs" ]; then
  if [ -z "$DATABASE_URL" ]; then
    echo "[entrypoint] ERROR: DATABASE_URL no configurada — API server no iniciará"
  else
    echo "[entrypoint] Iniciando API server en :3001"
    PORT=3001 NODE_ENV=production node /app/api/dist/index.mjs > /tmp/api.log 2>&1 &
    API_PID=$!
    sleep 4
    if kill -0 "$API_PID" 2>/dev/null; then
      echo "[entrypoint] API server OK (PID $API_PID)"
    else
      echo "[entrypoint] ===== ERROR: API server falló ====="
      cat /tmp/api.log
      echo "[entrypoint] ====================================="
    fi
  fi
else
  echo "[entrypoint] ERROR: /app/api/dist/index.mjs no encontrado"
  ls /app/api/dist/ 2>/dev/null || echo "directorio dist vacio"
fi

# ── 7. Nginx (sirve frontend en :4000 y proxea /api a :3001) ─────────────────
if command -v nginx >/dev/null 2>&1 && [ -d "/app/web/public" ]; then
  echo "[entrypoint] Iniciando nginx en :4000"
  nginx -g "daemon off;" > /tmp/nginx.log 2>&1 &
  echo "[entrypoint] nginx iniciado (PID $!)"
else
  echo "[entrypoint] ADVERTENCIA: nginx o frontend no disponible"
fi

# ── 8. Lanzar opencode ────────────────────────────────────────────────────────
echo "[entrypoint] Iniciando opencode web en :3000"
exec opencode web --hostname 0.0.0.0 --port 3000
