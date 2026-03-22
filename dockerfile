FROM node:22-bookworm-slim AS base

# ── Sistema ───────────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    && rm -rf /var/lib/apt/lists/*

# ── OpenCode ──────────────────────────────────────────────────────────────────
RUN npm install -g opencode-ai @anthropic-ai/claude-code --force

# ── Entorno ───────────────────────────────────────────────────────────────────
ENV HOME=/root
ENV BROWSER=echo
ENV DISPLAY=

# ── Directorios persistentes (montar como volúmenes en EasyPanel) ─────────────
# /root/.local/share/opencode  → sesiones, historial, base de datos SQLite
# /root/workspace              → archivos de código que opencode genera
RUN mkdir -p /root/.local/share/opencode /root/workspace

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Puerto opencode web
EXPOSE 3000
# Puerto dev server de proyectos generados por opencode
EXPOSE 5173

VOLUME ["/root/.local/share/opencode", "/root/workspace"]

ENTRYPOINT ["/entrypoint.sh"]
