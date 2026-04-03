#!/bin/sh
set -e

AUTH_DIR="/root/.local/share/opencode"
CONFIG_FILE="/root/opencode.json"
WORKSPACE="/root/workspace"
CACHE_DIR="/root/.cache/projects"

mkdir -p "$AUTH_DIR" "$WORKSPACE" "$CACHE_DIR"

# ✓ API Keys
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
[ -n "$OPENCODE_API_KEY" ]   && add_key "opencode"   "$OPENCODE_API_KEY"
AUTH_JSON="${AUTH_JSON}}"
[ $HAS_KEY -eq 1 ] && echo "$AUTH_JSON" > "$AUTH_DIR/auth.json" && echo "✓ API keys OK"

# ✓ Config
cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "opencode":   { "options": { "apiKey": "{env:OPENCODE_API_KEY}" } },
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

DEFAULT_MODEL=""
[ -n "$OPENCODE_API_KEY" ]   && DEFAULT_MODEL="opencode/big-pickle"
[ -n "$ANTHROPIC_API_KEY" ]  && DEFAULT_MODEL="anthropic/claude-sonnet-4-5"
[ -n "$GOOGLE_API_KEY" ]     && DEFAULT_MODEL="google/gemini-2.5-flash"
[ -n "$OPENAI_API_KEY" ]     && DEFAULT_MODEL="openai/gpt-4o"
[ -n "$DEFAULT_MODEL" ] && node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('$CONFIG_FILE','utf8'));c.model='$DEFAULT_MODEL';fs.writeFileSync('$CONFIG_FILE',JSON.stringify(c,null,2));" 2>/dev/null && echo "✓ Modelo: $DEFAULT_MODEL"

# ✓ Git
git config --global user.name  "${GIT_USER_NAME:-OpenCode}"
git config --global user.email "${GIT_USER_EMAIL:-bot@opencode.local}"
git config --global --add safe.directory "$WORKSPACE"
git config --global init.defaultBranch main

cd "$WORKSPACE"
if [ -n "$GIT_REPO_URL" ]; then
  if [ ! -d ".git" ]; then
    echo "→ Clonando repo..."
    git clone "$GIT_REPO_URL" . 2>&1 | tail -1 || { git init; git remote add origin "$GIT_REPO_URL"; }
  else
    git pull origin "${GIT_BRANCH:-main}" --rebase 2>&1 | head -1 || true
  fi
else
  [ ! -d ".git" ] && git init && git commit --allow-empty -m "init" 2>/dev/null
fi
echo "✓ Workspace: $WORKSPACE"

# ✓ Servidor de preview estático
(
  cd "$WORKSPACE"
  python3 -m http.server 8080 --bind 0.0.0.0 >/tmp/preview.log 2>&1 &
  echo "✓ Preview: :8080"
) &

# ✓ Watcher dev server (con cache externo)
(
  DEV_PID=""; FAIL=0; INSTALLING=0
  while sleep 15; do
    cd "$WORKSPACE" 2>/dev/null || continue
    [ ! -f "package.json" ] && continue
    { [ ! -d "src" ] && [ ! -f "index.html" ] && [ ! -f "index.js" ]; } && continue
    
    # Detectar nombre del proyecto
    PROJECT_NAME=$(node -e "try{console.log(require('./package.json').name||'default')}catch(e){console.log('default')}" 2>/dev/null || echo "default")
    PROJECT_CACHE="$CACHE_DIR/$PROJECT_NAME"
    
    # Instalar dependencias en cache si no existen
    if [ ! -d "$PROJECT_CACHE/node_modules" ] && [ $INSTALLING -eq 0 ]; then
      INSTALLING=1
      echo "→ Instalando $PROJECT_NAME en cache (esto puede tardar)..."
      mkdir -p "$PROJECT_CACHE"
      cp package.json "$PROJECT_CACHE/" 2>/dev/null
      [ -f "package-lock.json" ] && cp package-lock.json "$PROJECT_CACHE/" 2>/dev/null
      cd "$PROJECT_CACHE"
      NODE_OPTIONS="--max-old-space-size=512" npm install --prefer-offline --no-audit --no-fund --loglevel=error 2>&1 | tail -5
      cd "$WORKSPACE"
      # Crear symlink desde workspace a cache
      [ ! -L "node_modules" ] && ln -sf "$PROJECT_CACHE/node_modules" node_modules
      echo "✓ Dependencias instaladas en: $PROJECT_CACHE"
      INSTALLING=0
      sleep 5
    fi
    
    # Crear symlink si no existe
    if [ ! -L "node_modules" ] && [ -d "$PROJECT_CACHE/node_modules" ]; then
      ln -sf "$PROJECT_CACHE/node_modules" node_modules
    fi
    
    [ $FAIL -ge 3 ] && { sleep 60; FAIL=0; continue; }
    
    # Iniciar dev server solo si no está corriendo
    if [ -z "$DEV_PID" ] || ! kill -0 "$DEV_PID" 2>/dev/null; then
      HAS=$(node -e "try{const s=require('./package.json').scripts;console.log(s&&(s.dev||s.start)?'y':'n')}catch(e){console.log('n')}" 2>/dev/null || echo "n")
      if [ "$HAS" = "y" ] && [ -L "node_modules" ]; then
        echo "→ Iniciando dev server..."
        NODE_OPTIONS="--max-old-space-size=512" PORT=5173 npm run dev -- --host 0.0.0.0 --port 5173 >/tmp/dev.log 2>&1 & 
        DEV_PID=$!
        sleep 8
        if ! kill -0 "$DEV_PID" 2>/dev/null; then
          FAIL=$((FAIL+1))
          DEV_PID=""
          echo "❌ Dev server falló (intento $FAIL/3)"
        else
          echo "✓ Dev server: :5173"
          FAIL=0
        fi
      fi
    fi
  done
) &

# ✓ OpenClaw
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
  mkdir -p /root/.openclaw
  OC_MODEL="opencode/big-pickle"; OC_ENV=""
  [ -n "$OPENCODE_API_KEY" ]  && OC_ENV="\"OPENCODE_API_KEY\":\"$OPENCODE_API_KEY\""
  [ -n "$ANTHROPIC_API_KEY" ] && { OC_MODEL="anthropic/claude-sonnet-4-5"; OC_ENV="\"ANTHROPIC_API_KEY\":\"$ANTHROPIC_API_KEY\""; }
  [ -n "$OPENCLAW_MODEL" ]    && OC_MODEL="$OPENCLAW_MODEL"
  TELE=""; [ -n "$TELEGRAM_BOT_TOKEN" ] && TELE=",\"channels\":{\"telegram\":{\"botToken\":\"$TELEGRAM_BOT_TOKEN\"}}"
  cat > /root/.openclaw/openclaw.json << OC
{"agent":{"model":"$OC_MODEL"},"env":{$OC_ENV},"gateway":{"port":18789,"bind":"lan","auth":{"mode":"token","token":"$OPENCLAW_GATEWAY_TOKEN"}}$TELE}
OC
  oclaw gateway --allow-unconfigured --bind lan >/tmp/openclaw.log 2>&1 &
  echo "✓ OpenClaw: :18789"
fi

# → OpenCode
echo "→ OpenCode :3000"
exec opencode web --hostname 0.0.0.0 --port 3000
