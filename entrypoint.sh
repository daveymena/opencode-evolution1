#!/bin/sh
set -e

AUTH_DIR="$HOME/.local/share/opencode"
AUTH_FILE="$AUTH_DIR/auth.json"

mkdir -p "$AUTH_DIR"

# Construir auth.json desde variables de entorno
# EasyPanel: configura OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, etc.

build_auth() {
  echo "{"

  FIRST=1

  if [ -n "$OPENAI_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "openai": { "api_key": "%s" }' "$OPENAI_API_KEY"
    FIRST=0
  fi

  if [ -n "$ANTHROPIC_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "anthropic": { "api_key": "%s" }' "$ANTHROPIC_API_KEY"
    FIRST=0
  fi

  if [ -n "$GOOGLE_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "google": { "api_key": "%s" }' "$GOOGLE_API_KEY"
    FIRST=0
  fi

  if [ -n "$XAI_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "xai": { "api_key": "%s" }' "$XAI_API_KEY"
    FIRST=0
  fi

  if [ -n "$DEEPSEEK_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "deepseek": { "api_key": "%s" }' "$DEEPSEEK_API_KEY"
    FIRST=0
  fi

  if [ -n "$MISTRAL_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "mistral": { "api_key": "%s" }' "$MISTRAL_API_KEY"
    FIRST=0
  fi

  if [ -n "$GROQ_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "groq": { "api_key": "%s" }' "$GROQ_API_KEY"
    FIRST=0
  fi

  if [ -n "$OPENROUTER_API_KEY" ]; then
    [ $FIRST -eq 0 ] && echo ","
    printf '  "openrouter": { "api_key": "%s" }' "$OPENROUTER_API_KEY"
    FIRST=0
  fi

  echo ""
  echo "}"
}

build_auth > "$AUTH_FILE"
echo "[entrypoint] auth.json generado en $AUTH_FILE"

exec opencode web --hostname 0.0.0.0 --port 3000
