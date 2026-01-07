#!/bin/sh

# Startup script for frontend service
# Ensures source files are present before starting Vite

echo "🔍 Checking frontend source files..."

# Wait for critical files to be present
MAX_WAIT=30
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if [ -f "/app/src/lib/api.ts" ] && [ -f "/app/src/lib/utils.ts" ]; then
        echo "✓ Source files found"
        break
    fi
    
    if [ $ELAPSED -eq 0 ]; then
        echo "⏳ Waiting for source files to be mounted..."
    fi
    
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

if [ ! -f "/app/src/lib/api.ts" ] || [ ! -f "/app/src/lib/utils.ts" ]; then
    echo "❌ ERROR: Critical source files not found after ${MAX_WAIT}s"
    echo "Contents of /app/src/lib/:"
    ls -la /app/src/lib/ 2>&1 || echo "Directory does not exist"
    echo ""
    echo "Contents of /app/src/:"
    ls -la /app/src/ 2>&1 || echo "Directory does not exist"
    exit 1
fi

# Verify other critical directories
if [ ! -d "/app/src/pages" ]; then
    echo "❌ ERROR: /app/src/pages directory not found"
    exit 1
fi

if [ ! -d "/app/src/components" ]; then
    echo "❌ ERROR: /app/src/components directory not found"
    exit 1
fi

echo "✓ All critical directories verified"

# Verify vite.config.ts exists
if [ ! -f "/app/vite.config.ts" ]; then
    echo "❌ ERROR: vite.config.ts not found"
    exit 1
fi

echo "✓ Vite configuration found"
echo "🚀 Starting Vite dev server..."
echo ""

# Start Vite
exec npm run dev -- --host 0.0.0.0 --port 5173

