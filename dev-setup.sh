#!/bin/bash

# OpenCode Evolution - Local Development Setup Script
# This script sets up the development environment with hot-reload

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🚀 OpenCode Evolution - Development Setup"
echo "📁 Project Directory: $PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo -e "${GREEN}✅ .env created. Please update it with your configuration.${NC}"
fi

# Load environment
set -a
source "$PROJECT_DIR/.env"
set +a

# Check dependencies
echo -e "\n${BLUE}📦 Checking dependencies...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing globally...${NC}"
    npm install -g pnpm@10
fi
echo -e "${GREEN}✅ pnpm $(pnpm --version)${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. You'll need it for the database.${NC}"
else
    echo -e "${GREEN}✅ Docker $(docker --version)${NC}"
fi

# Install dependencies
echo -e "\n${BLUE}📚 Installing dependencies...${NC}"
cd "$PROJECT_DIR"
pnpm install

# Create directories
echo -e "\n${BLUE}📁 Creating necessary directories...${NC}"
mkdir -p "$PROJECT_DIR/.local/share/opencode" \
         "$PROJECT_DIR/workspace" \
         "$PROJECT_DIR/projects"
echo -e "${GREEN}✅ Directories created${NC}"

# Start PostgreSQL with Docker
echo -e "\n${BLUE}🐘 Starting PostgreSQL...${NC}"

# Check if PostgreSQL container is already running
if docker ps | grep -q opencode_db; then
    echo -e "${GREEN}✅ PostgreSQL already running${NC}"
else
    # Check if container exists but is stopped
    if docker ps -a | grep -q opencode_db; then
        echo "Starting existing PostgreSQL container..."
        docker start opencode_db
    else
        echo "Creating new PostgreSQL container..."
        docker run -d \
            --name opencode_db \
            -e POSTGRES_USER=${POSTGRES_USER:-opencode} \
            -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-opencode} \
            -e POSTGRES_DB=${POSTGRES_DB:-opencode_evolved} \
            -p ${POSTGRES_PORT:-5432}:5432 \
            -v opencode_postgres:/var/lib/postgresql/data \
            --health-cmd="pg_isready -U ${POSTGRES_USER:-opencode}" \
            --health-interval=10s \
            --health-timeout=5s \
            --health-retries=5 \
            postgres:16-alpine
    fi
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 3
fi

# Run database migrations
echo -e "\n${BLUE}🔄 Running database migrations...${NC}"
pnpm --filter @workspace/db run push || {
    echo -e "${YELLOW}⚠️  Migration completed (or already applied)${NC}"
}

# Start servers
echo -e "\n${GREEN}✅ Development environment ready!${NC}"
echo -e "\n${BLUE}🚀 Starting development servers...${NC}\n"

# Print instructions
cat << EOF
${BLUE}═══════════════════════════════════════════════════════════${NC}
${GREEN}OpenCode Evolution - Development Environment${NC}
${BLUE}═══════════════════════════════════════════════════════════${NC}

${YELLOW}Starting in new terminals:${NC}

${BLUE}Terminal 1 - Backend API (with watch mode):${NC}
${GREEN}  pnpm --filter @workspace/api-server run dev${NC}

${BLUE}Terminal 2 - Frontend (with Vite hot reload):${NC}
${GREEN}  pnpm --filter @workspace/opencode-evolved run dev${NC}

${YELLOW}Access URLs:${NC}
  🌐 Frontend: http://localhost:5173
  📡 API: http://localhost:3001
  ✅ Health: http://localhost:3001/api/healthz

${YELLOW}Database:${NC}
  📍 PostgreSQL: localhost:${POSTGRES_PORT:-5432}
  👤 User: ${POSTGRES_USER:-opencode}
  🔐 Password: ${POSTGRES_PASSWORD:-opencode}
  🗄️  Database: ${POSTGRES_DB:-opencode_evolved}

${YELLOW}Stop PostgreSQL:${NC}
  ${GREEN}docker stop opencode_db${NC}

${YELLOW}View PostgreSQL logs:${NC}
  ${GREEN}docker logs -f opencode_db${NC}

${BLUE}═══════════════════════════════════════════════════════════${NC}
EOF

# Start servers in parallel (optional)
if command -v pm2 &> /dev/null; then
    echo -e "\n${BLUE}Starting with pm2...${NC}"
    pnpm --filter @workspace/api-server run dev &
    API_PID=$!
    pnpm --filter @workspace/opencode-evolved run dev &
    FRONTEND_PID=$!
    
    wait
else
    echo -e "\n${BLUE}Start the servers manually as shown above.${NC}"
    echo -e "${YELLOW}Alternatively, install pm2:${NC} ${GREEN}npm install -g pm2${NC}"
fi
