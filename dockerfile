FROM node:22-bookworm-slim AS base

# Sistema
RUN apt-get update && apt-get install -y \
    python3 python3-pip golang-go \
    git curl wget chromium libfuse2 \
    && rm -rf /var/lib/apt/lists/*

# OpenCode
RUN npm install -g opencode-ai --force

ENV HOME=/root
ENV BROWSER=echo
ENV DISPLAY=

RUN mkdir -p /root/.local/share/opencode /root/workspace /root/projects

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
EXPOSE 5173

VOLUME ["/root/.local/share/opencode", "/root/workspace", "/root/projects"]

ENTRYPOINT ["/entrypoint.sh"]
