#!/bin/sh
set -e

AUTH_DIR="$HOME/.local/share/opencode"
AUTH_FILE="$AUTH_DIR/auth.json"

mkdir -p "$AUTH_DIR"

# Solo inyectar auth.json si hay al menos una API key configurada.
# Si no hay ninguna, NO crear el archivo para que opencode use su flujo
# nativo de pedir la key al seleccionar un modelo de pago.

HAS_KEY=0
AUTH_JSON="{"
SEP=""

add_key() {
  PROVIDER="$1"
  KEY="$2"
  AUTH_JSON="${AUTH_JSON}${SEP}\"${PROVIDER}\":{\"api_key\":\"${KEY}\"}"
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
  echo "[entrypoint] Sin API keys en env vars — opencode usará su flujo nativo de autenticación"
fi

exec opencode web --hostname 0.0.0.0 --port 3000
