#!/bin/sh
set -e

AUTH_DIR="$HOME/.local/share/opencode"
AUTH_FILE="$AUTH_DIR/auth.json"
CONFIG_FILE="$HOME/opencode.json"

mkdir -p "$AUTH_DIR"

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

# ── 2. opencode.json: declarar providers con {env:VAR} para que aparezcan ────
# Esto hace que el selector muestre todos los modelos aunque la key no esté
# configurada aún — opencode la pedirá al intentar usarlos.
cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": {
      "options": {
        "apiKey": "{env:OPENAI_API_KEY}"
      }
    },
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}"
      }
    },
    "google": {
      "options": {
        "apiKey": "{env:GOOGLE_API_KEY}"
      }
    },
    "xai": {
      "options": {
        "apiKey": "{env:XAI_API_KEY}"
      }
    },
    "deepseek": {
      "options": {
        "apiKey": "{env:DEEPSEEK_API_KEY}"
      }
    },
    "mistral": {
      "options": {
        "apiKey": "{env:MISTRAL_API_KEY}"
      }
    },
    "groq": {
      "options": {
        "apiKey": "{env:GROQ_API_KEY}"
      }
    },
    "openrouter": {
      "options": {
        "apiKey": "{env:OPENROUTER_API_KEY}"
      }
    }
  }
}
EOF

echo "[entrypoint] opencode.json generado con todos los providers"

exec opencode web --hostname 0.0.0.0 --port 3000
