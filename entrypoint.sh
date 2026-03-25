#!/bin/sh
set -e

AUTH_DIR="/root/.local/share/opencode"
CONFIG_FILE="/root/opencode.json"
WORKSPACE="/root/workspace"
PROJECTS="/root/projects"

mkdir -p "$AUTH_DIR" "$WORKSPACE" "$PROJECTS"

# 1. auth.json
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

# 2. opencode.json
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
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$CONFIG_FILE','utf8'));
    cfg.model = '$DEFAULT_MODEL';
    fs.writeFileSync('$CONFIG_FILE', JSON.stringify(cfg, null, 2));
  " 2>/dev/null && echo "[entrypoint] Modelo por defecto: $DEFAULT_MODEL"
fi
echo "[entrypoint] opencode.json OK"

# 3. Git workspace
git config --global user.name  "${GIT_USER_NAME:-OpenCode Bot}"
git config --global user.email "${GIT_USER_EMAIL:-opencode@localhost}"
git config --global --add safe.directory "$WORKSPACE"
git config --global --add safe.directory "$PROJECTS"
git config --global init.defaultBranch main

if [ -n "$GIT_TOKEN" ] && [ -n "$GIT_REPO_URL" ]; then
  GIT_HOST=$(echo "$GIT_REPO_URL" | sed 's|https://||' | sed 's|/.*||')
  git config --global credential.helper store
  echo "https://oauth2:${GIT_TOKEN}@${GIT_HOST}" > /root/.git-credentials
  chmod 600 /root/.git-credentials
fi

EFFECTIVE_REPO_URL="$GIT_REPO_URL"
if [ -n "$GIT_TOKEN" ] && [ -n "$GIT_REPO_URL" ]; then
  EFFECTIVE_REPO_URL=$(echo "$GIT_REPO_URL" | sed "s|https://|https://${GIT_TOKEN}@|")
fi

cd "$WORKSPACE"
if [ -n "$GIT_REPO_URL" ]; then
  if [ ! -d ".git" ]; then
    echo "[entrypoint] Clonando $GIT_REPO_URL ..."
    git clone "$EFFECTIVE_REPO_URL" . 2>&1 || { git init; git remote add origin "$EFFECTIVE_REPO_URL"; }
  else
    git remote set-url origin "$EFFECTIVE_REPO_URL" 2>/dev/null || true
    echo "[entrypoint] Pull del repo..."
    git pull origin "${GIT_BRANCH:-main}" --rebase 2>&1 || true
  fi
else
  [ ! -d ".git" ] && git init && git commit --allow-empty -m "init: workspace"
fi
echo "[entrypoint] Workspace listo: $WORKSPACE"

# 4. Watcher dev server
(
  DEV_PID=""
  FAIL_COUNT=0
  MAX_FAILS=3
  while true; do
    sleep 10
    cd "$WORKSPACE" 2>/dev/null || continue
    if [ ! -f "package.json" ] || { [ ! -d "src" ] && [ ! -f "index.html" ] && [ ! -f "index.js" ]; }; then
      continue
    fi
    if [ ! -d "node_modules" ]; then
      echo "[watcher] npm install..."
      npm install --silent 2>&1 | tail -3 || continue
    fi
    if [ $FAIL_COUNT -ge $MAX_FAILS ]; then
      sleep 60
      continue
    fi
    if [ -z "$DEV_PID" ] || ! kill -0 "$DEV_PID" 2>/dev/null; then
      HAS_SCRIPT=$(node -e "try{const p=require('./package.json');console.log(p.scripts&&(p.scripts.dev||p.scripts.start)?'yes':'no')}catch(e){console.log('no')}" 2>/dev/null || echo "no")
      if [ "$HAS_SCRIPT" = "yes" ]; then
        echo "[watcher] Iniciando dev server en :5173..."
        PORT=5173 npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/devserver.log 2>&1 &
        DEV_PID=$!
        sleep 5
        if ! kill -0 "$DEV_PID" 2>/dev/null; then
          FAIL_COUNT=$((FAIL_COUNT + 1))
          echo "[watcher] Dev server falló ($FAIL_COUNT/$MAX_FAILS)"
          DEV_PID=""
        else
          FAIL_COUNT=0
          echo "[watcher] Dev server corriendo (PID $DEV_PID)"
        fi
      fi
    fi
  done
) &

# 5. Lanzar opencode
echo "[entrypoint] Iniciando opencode web en :3000"
exec opencode web --hostname 0.0.0.0 --port 3000
