#!/bin/sh
set -e

echo "======================================"
echo "🚀 OpenCode API Server Initialization"
echo "======================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL in your .env or docker-compose.yml"
  exit 1
fi

echo "📦 DATABASE_URL configured"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

until pg_isready -h $(echo $DATABASE_URL | grep -oP '(?<=@)[^:]+') -U opencode 2>/dev/null || [ $ATTEMPT -eq $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ ERROR: PostgreSQL failed to start after $MAX_ATTEMPTS attempts"
  exit 1
fi

echo "✅ PostgreSQL is ready"

# Run database migrations
echo "🔄 Running database migrations..."
cd /app

# Try to run migrations with drizzle-kit
if [ -f "lib/db/drizzle.config.ts" ]; then
  echo "  Running Drizzle push..."
  pnpm --filter @workspace/db run push || {
    echo "⚠️  Migration command failed, but continuing..."
  }
fi

echo "✅ Database initialization complete"

# Create necessary directories
mkdir -p /root/projects /root/workspace

# Start API server
echo "🚀 Starting API Server on port 3001..."
exec node --enable-source-maps /app/artifacts/api-server/dist/index.mjs
