#!/bin/bash
# Script to configure API URLs in .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "========================================="
echo "API URL Configuration"
echo "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env from .env.example first:"
    echo "  cp .env.example .env"
    exit 1
fi

echo "Current API URLs:"
grep "^VITE_" .env 2>/dev/null || echo "  (Not configured)"
echo ""

echo "Choose deployment target:"
echo "  1) Local development (localhost)"
echo "  2) GCP VM / Cloud (custom IP/domain)"
echo "  3) Manual entry"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        # Local development
        VITE_API_URL="http://localhost:8000"
        VITE_TEAM_API_URL="http://localhost:8001"
        VITE_TASK_API_URL="http://localhost:8002"
        echo ""
        echo "Setting URLs to localhost..."
        ;;
    2)
        # GCP VM / Cloud
        echo ""
        read -p "Enter your VM's external IP or domain (e.g., 34.123.45.67 or api.example.com): " HOST
        
        if [ -z "$HOST" ]; then
            echo "Error: Host cannot be empty"
            exit 1
        fi
        
        # Check if it's an IP or domain (no http/https prefix)
        if [[ $HOST == http* ]]; then
            echo "Error: Don't include http:// or https://, just the IP or domain"
            exit 1
        fi
        
        # Ask for protocol
        echo ""
        read -p "Use HTTPS? (y/n) [default: n]: " USE_HTTPS
        
        if [[ $USE_HTTPS =~ ^[Yy]$ ]]; then
            PROTOCOL="https"
        else
            PROTOCOL="http"
        fi
        
        VITE_API_URL="${PROTOCOL}://${HOST}:8000"
        VITE_TEAM_API_URL="${PROTOCOL}://${HOST}:8001"
        VITE_TASK_API_URL="${PROTOCOL}://${HOST}:8002"
        
        echo ""
        echo "Setting URLs to ${HOST}..."
        ;;
    3)
        # Manual entry
        echo ""
        read -p "Enter UserService API URL (e.g., http://localhost:8000): " VITE_API_URL
        read -p "Enter TeamService API URL (e.g., http://localhost:8001): " VITE_TEAM_API_URL
        read -p "Enter TaskService API URL (e.g., http://localhost:8002): " VITE_TASK_API_URL
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "New API URLs:"
echo "  VITE_API_URL=$VITE_API_URL"
echo "  VITE_TEAM_API_URL=$VITE_TEAM_API_URL"
echo "  VITE_TASK_API_URL=$VITE_TASK_API_URL"
echo ""

# Update or add the values in .env
for VAR in VITE_API_URL VITE_TEAM_API_URL VITE_TASK_API_URL; do
    VAL=$(eval echo \$$VAR)
    if grep -q "^${VAR}=" .env; then
        # Update existing
        sed -i "s|^${VAR}=.*|${VAR}=${VAL}|" .env
    else
        # Add new
        echo "${VAR}=${VAL}" >> .env
    fi
done

echo "✓ .env file updated successfully!"
echo ""

read -p "Restart frontend service to apply changes? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Restarting frontend service..."
    docker compose restart frontend
    echo ""
    echo "✓ Frontend restarted!"
    echo ""
    echo "Frontend accessible at:"
    echo "  http://localhost:5173"
    if [ "$choice" == "2" ]; then
        echo "  http://${HOST}:5173 (from external)"
    fi
else
    echo "Skipped restart. Run 'docker compose restart frontend' to apply changes."
fi

echo ""
