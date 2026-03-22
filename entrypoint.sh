#!/bin/sh
set -e

AUTH_DIR="$HOME/.local/share/opencode"
AUTH_FILE="$AUTH_DIR/auth.json"
CONFIG_FILE="$HOME/opencode.json"
WORKSPACE="/root/workspace"

mkdir -p "$AUTH_DIR"
mkdir -p "$WORKSPACE"

# ── 1. auth.json: solo si hay keys configuradas ──────────────────────────────
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
  echo "$AUTH_JSON" > "$AUTH_FILE"
  echo "[entrypoint] auth.json generado con providers configurados"
else
  echo "[entrypoint] Sin API keys — opencode usará flujo nativo de autenticación"
fi

# ── 2. opencode.json: declarar todos los providers ───────────────────────────
cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": {
      "options": { "apiKey": "{env:OPENAI_API_KEY}" }
    },
    "anthropic": {
      "options": { "apiKey": "{env:ANTHROPIC_API_KEY}" }
    },
    "google": {
      "options": { "apiKey": "{env:GOOGLE_API_KEY}" }
    },
    "xai": {
      "options": { "apiKey": "{env:XAI_API_KEY}" }
    },
    "deepseek": {
      "options": { "apiKey": "{env:DEEPSEEK_API_KEY}" }
    },
    "mistral": {
      "options": { "apiKey": "{env:MISTRAL_API_KEY}" }
    },
    "groq": {
      "options": { "apiKey": "{env:GROQ_API_KEY}" }
    },
    "openrouter": {
      "options": { "apiKey": "{env:OPENROUTER_API_KEY}" }
    }
  }
}
EOF
echo "[entrypoint] opencode.json generado con todos los providers"

# ── 3. Git workspace ─────────────────────────────────────────────────────────
# GIT_REPO_URL: URL del repo remoto (ej: https://token@github.com/user/repo.git)
# GIT_USER_NAME / GIT_USER_EMAIL: identidad para commits
cd "$WORKSPACE"

git config --global user.name  "${GIT_USER_NAME:-OpenCode Bot}"
git config --global user.email "${GIT_USER_EMAIL:-opencode@localhost}"
git config --global --add safe.directory "$WORKSPACE"

if [ -n "$GIT_REPO_URL" ]; then
  if [ ! -d "$WORKSPACE/.git" ]; then
    echo "[entrypoint] Clonando repositorio..."
    git clone "$GIT_REPO_URL" . || {
      echo "[entrypoint] Clone falló, inicializando repo vacío"
      git init
      git remote add origin "$GIT_REPO_URL"
    }
  else
    echo "[entrypoint] Repo ya existe, haciendo pull..."
    git pull origin "${GIT_BRANCH:-main}" --rebase || true
  fi
else
  # Sin repo remoto: solo inicializar git local para que opencode pueda hacer commits
  if [ ! -d "$WORKSPACE/.git" ]; then
    echo "[entrypoint] Inicializando repo Git local (sin remote)"
    git init
    git commit --allow-empty -m "init: workspace opencode"
  fi
fi

echo "[entrypoint] Workspace listo en $WORKSPACE"

exec opencode web --hostname 0.0.0.0 --port 3000
