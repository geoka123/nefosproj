#!/bin/bash
# Quick fix script for database connection issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "========================================="
echo "Database Connection Fix Script"
echo "========================================="
echo ""

# Step 1: Check .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        echo "✅ .env file created"
    else
        echo "Error: .env.example not found either!"
        exit 1
    fi
else
    echo "✅ .env file exists"
fi

echo ""

# Step 2: Check and fix DB_HOST
echo "Checking DB_HOST value..."
CURRENT_DB_HOST=$(grep "^DB_HOST=" .env | cut -d'=' -f2)

if [ "$CURRENT_DB_HOST" = "localhost" ]; then
    echo "❌ DB_HOST is set to 'localhost' (wrong for Docker)"
    echo "Fixing DB_HOST to 'postgres'..."
    sed -i 's/^DB_HOST=localhost/DB_HOST=postgres/' .env
    echo "✅ DB_HOST fixed to 'postgres'"
elif [ "$CURRENT_DB_HOST" = "postgres" ]; then
    echo "✅ DB_HOST is correctly set to 'postgres'"
else
    echo "⚠️  DB_HOST is set to '$CURRENT_DB_HOST'"
    echo "Setting to 'postgres'..."
    sed -i 's/^DB_HOST=.*/DB_HOST=postgres/' .env
    echo "✅ DB_HOST set to 'postgres'"
fi

echo ""

# Step 3: Check and fix MONGO_HOST
echo "Checking MONGO_HOST value..."
CURRENT_MONGO_HOST=$(grep "^MONGO_HOST=" .env | cut -d'=' -f2)

if [ "$CURRENT_MONGO_HOST" = "localhost" ]; then
    echo "❌ MONGO_HOST is set to 'localhost' (wrong for Docker)"
    echo "Fixing MONGO_HOST to 'mongodb'..."
    sed -i 's/^MONGO_HOST=localhost/MONGO_HOST=mongodb/' .env
    echo "✅ MONGO_HOST fixed to 'mongodb'"
elif [ "$CURRENT_MONGO_HOST" = "mongodb" ]; then
    echo "✅ MONGO_HOST is correctly set to 'mongodb'"
else
    echo "⚠️  MONGO_HOST is set to '$CURRENT_MONGO_HOST'"
    echo "Setting to 'mongodb'..."
    sed -i 's/^MONGO_HOST=.*/MONGO_HOST=mongodb/' .env
    echo "✅ MONGO_HOST set to 'mongodb'"
fi

echo ""

# Step 4: Show current configuration
echo "========================================="
echo "Current Database Configuration:"
echo "========================================="
grep -E "^(DB_HOST|DB_PORT|DB_USER|MONGO_HOST|MONGO_PORT)" .env || true
echo ""

# Step 5: Offer to restart services
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "The .env file has been fixed. To apply changes:"
echo ""
echo "  1. Stop all services:"
echo "     make down"
echo ""
echo "  2. Start services again:"
echo "     make up"
echo ""
echo "Or run both in one command:"
echo "  make restart"
echo ""

read -p "Would you like to restart services now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Restarting services..."
    make down
    echo ""
    echo "Starting services..."
    make up
else
    echo "Skipped restart. Run 'make restart' when ready."
fi

echo ""
echo "✅ Fix complete!"
echo ""
