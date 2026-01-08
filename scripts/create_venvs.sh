#!/bin/bash
# Script to create virtual environments for all services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "========================================="
echo "Creating Virtual Environments"
echo "========================================="
echo ""

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed or not in PATH"
    echo "Please install Python 3 before continuing."
    exit 1
fi

# Check if python3-venv is available
if ! python3 -m venv --help &> /dev/null; then
    echo "Error: python3-venv module is not available"
    echo "Please install it using one of the following commands:"
    echo "  Ubuntu/Debian: sudo apt-get install python3-venv"
    echo "  RHEL/CentOS:   sudo yum install python3-venv"
    echo "  Fedora:        sudo dnf install python3-venv"
    exit 1
fi

echo "✓ Python 3 and venv module are available"
echo "✓ Python version: $(python3 --version)"
echo ""

# Function to create venv for a service
create_service_venv() {
    local service_name=$1
    local service_path="$PROJECT_ROOT/services/$service_name"
    
    echo "--- Creating venv for $service_name ---"
    
    if [ ! -d "$service_path" ]; then
        echo "Warning: Service directory not found: $service_path"
        return 1
    fi
    
    cd "$service_path"
    
    # Remove old venv if it exists
    if [ -d "venv" ]; then
        echo "Removing existing venv..."
        rm -rf venv
    fi
    
    # Create new venv
    echo "Creating virtual environment..."
    if ! python3 -m venv venv; then
        echo "Error: Failed to create virtual environment for $service_name"
        return 1
    fi
    
    # Verify venv was created
    if [ ! -f "venv/bin/activate" ]; then
        echo "Error: Virtual environment creation failed - activate script not found"
        return 1
    fi
    
    echo "✓ Virtual environment created"
    
    # Activate and install dependencies
    source venv/bin/activate
    
    if [ -f "requirements.txt" ]; then
        echo "Installing dependencies..."
        if ! pip install --upgrade pip --quiet; then
            echo "Warning: Failed to upgrade pip, continuing with existing version"
        fi
        if ! pip install -r requirements.txt --quiet; then
            echo "Error: Failed to install dependencies"
            deactivate
            return 1
        fi
        echo "✓ Dependencies installed successfully"
    else
        echo "Warning: No requirements.txt found"
    fi
    
    deactivate
    echo "✓ $service_name venv setup complete"
    echo ""
}

# Create venvs for all services
create_service_venv "userservice"
create_service_venv "teamservice"
create_service_venv "taskservice"

echo "========================================="
echo "✓ All Virtual Environments Created!"
echo "========================================="
echo ""
echo "Virtual environments have been created at:"
echo "  - services/userservice/venv"
echo "  - services/teamservice/venv"
echo "  - services/taskservice/venv"
echo ""
echo "To activate a venv, run:"
echo "  cd services/<service-name>"
echo "  source venv/bin/activate"
echo ""
