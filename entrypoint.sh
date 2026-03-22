#!/bin/sh
set -e

AUTH_DIR="$HOME/.local/share/opencode"
CONFIG_FILE="$HOME/opencode.json"
WORKSPACE="/root/workspace"

mkdir -p "$AUTH_DIR"
mkdir -p "$WORKSPACE"

# ── 1. auth.json ─────────────────────────────────────────────────────────────
HAS_KEY=0
AUTH_JSON="{"
SEP=""
add_key() {
  AUTH_JSON="${AUTH_JSON}${SEP}\"${1}\":{\"api_key\":\"${2}\"}"
  SEP=","
  HAS_KEY=1
}
[ -n "$OPENAI_API_KEY" ]     && add_key "openai"     "$OPENAI_API_KEY"
[ -n "$ANTHROPIC_API_KEY" ]  && add_key "anthropic"  "$ANTHROPIC_API_KEY"
[ -n "$GOOGLE_API_KEY" ]     && add_key "google"     "$GOOGLE_API_KEY"
[ -n "$XAI_API_KEY" ]        && add_key "xai"        "$XAI_API_KEY"
[ -n "$DEEPSEEK_API_KEY" ]   && add_key "deepseek"   "$DEEPSEEK_API_KEY"
[ -n "$MISTRAL_API_KEY" ]    && add_key "mistral"    "$MISTRAL_API_KEY"
[ -n "$GROQ_API_KEY" ]       && add_key "groq"       "$GROQ_API_KEY"
[ -n "$OPENROUTER_API_KEY" ] && add_key "openrouter" "$OPENROUTER_API_KEY"
AUTH_JSON="${AUTH_JSON}}"
if [ $HAS_KEY -eq 1 ]; then
  echo "$AUTH_JSON" > "$AUTH_DIR/auth.json"
  echo "[entrypoint] auth.json generado"
fi

# ── 2. opencode.json ──────────────────────────────────────────────────────────
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
echo "[entrypoint] opencode.json generado"

# ── 3. Git workspace ──────────────────────────────────────────────────────────
cd "$WORKSPACE"
git config --global user.name  "${GIT_USER_NAME:-OpenCode Bot}"
git config --global user.email "${GIT_USER_EMAIL:-opencode@localhost}"
git config --global --add safe.directory "$WORKSPACE"

if [ -n "$GIT_REPO_URL" ]; then
  if [ ! -d "$WORKSPACE/.git" ]; then
    echo "[entrypoint] Clonando repositorio..."
    git clone "$GIT_REPO_URL" . || { git init; git remote add origin "$GIT_REPO_URL"; }
  else
    echo "[entrypoint] Pull del repo..."
    git pull origin "${GIT_BRANCH:-main}" --rebase || true
  fi
else
  if [ ! -d "$WORKSPACE/.git" ]; then
    git init
    git commit --allow-empty -m "init: workspace opencode"
  fi
fi

# ── 4. Watcher: auto-instala deps y levanta dev server cuando opencode ────────
# genera package.json en el workspace
cat > /usr/local/bin/workspace-watcher.sh << 'WATCHER'
#!/bin/sh
WORKSPACE="/root/workspace"
DEV_PID=""

while true; do
  sleep 5

  # Si hay package.json y no hay node_modules, instalar
  if [ -f "$WORKSPACE/package.json" ] && [ ! -d "$WORKSPACE/node_modules" ]; then
    echo "[watcher] Instalando dependencias npm..."
    cd "$WORKSPACE" && npm install --silent 2>&1 | tail -5 || true
  fi

  # Si hay package.json con script "dev" o "start" y no hay proceso corriendo
  if [ -f "$WORKSPACE/package.json" ] && [ -z "$DEV_PID" ]; then
    HAS_DEV=$(node -e "try{const p=require('$WORKSPACE/package.json');console.log(p.scripts&&(p.scripts.dev||p.scripts.start)?'yes':'no')}catch(e){console.log('no')}" 2>/dev/null || echo "no")
    if [ "$HAS_DEV" = "yes" ]; then
      echo "[watcher] Levantando servidor de desarrollo en puerto 5173..."
      cd "$WORKSPACE" && PORT=5173 npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/devserver.log 2>&1 &
      DEV_PID=$!
      echo "[watcher] Dev server PID: $DEV_PID"
    fi
  fi

  # Si el proceso murió, resetear para reintentar
  if [ -n "$DEV_PID" ] && ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "[watcher] Dev server terminó, reintentando..."
    DEV_PID=""
  fi
done
WATCHER

chmod +x /usr/local/bin/workspace-watcher.sh

# Lanzar watcher en background
/usr/local/bin/workspace-watcher.sh &
echo "[entrypoint] Workspace watcher iniciado"

echo "[entrypoint] Lanzando opencode web en puerto 3000..."
exec opencode web --hostname 0.0.0.0 --port 3000
