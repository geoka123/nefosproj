#!/bin/bash
# Setup script - Creates superusers and media directories

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "========================================="
echo "NEFOS Project Setup"
echo "========================================="
echo ""

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists, if not copy from .env.example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo "✓ .env file created. Please review and update the values if needed."
        echo ""
    else
        echo "Warning: .env.example not found. You may need to create a .env file manually."
        echo ""
    fi
else
    echo ".env file already exists, skipping creation."
    echo ""
fi

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    # Safely load .env file line by line, handling special characters
    set -a
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        # Export the variable (handles special characters in values)
        export "$line" 2>/dev/null || true
    done < .env
    set +a
    echo "✓ Environment variables loaded."
    echo ""
fi

# Function to create superuser for userservice
create_userservice_superuser() {
    echo "--- Creating superuser for userservice ---"
    cd "$PROJECT_ROOT/services/userservice"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment for userservice..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Check if manage.py exists
    if [ ! -f "manage.py" ]; then
        echo "Error: manage.py not found in userservice"
        deactivate
        return 1
    fi
    
    # Install/upgrade dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        echo "Installing Python dependencies..."
        pip install --upgrade pip --quiet
        pip install -r requirements.txt --quiet
    fi
    
    # Get superuser details from environment variables
    USER_EMAIL="${SETUP_USER_EMAIL:-}"
    USER_PASSWORD="${SETUP_USER_PASSWORD:-}"
    USER_FIRST_NAME="${SETUP_USER_FIRST_NAME:-}"
    USER_LAST_NAME="${SETUP_USER_LAST_NAME:-}"
    
    # Validate required fields
    if [ -z "$USER_EMAIL" ] || [ -z "$USER_PASSWORD" ]; then
        echo "Error: SETUP_USER_EMAIL and SETUP_USER_PASSWORD must be set in .env file"
        echo "Please add these variables to your .env file and try again."
        deactivate
        return 1
    fi
    
    # Override DB_HOST to localhost when running from host (not in Docker)
    export DB_HOST="${DB_HOST:-localhost}"
    if [ "$DB_HOST" = "postgres" ]; then
        export DB_HOST="localhost"
    fi
    
    echo "Creating superuser with email: $USER_EMAIL"
    echo "Connecting to database at: $DB_HOST:$DB_PORT"
    
    # Create superuser using Python script (since userservice uses email as USERNAME_FIELD)
    python << EOF
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'userservice.settings')
django.setup()

from userapi.models import User

email = "$USER_EMAIL"
password = "$USER_PASSWORD"
first_name = "$USER_FIRST_NAME" if "$USER_FIRST_NAME" else ""
last_name = "$USER_LAST_NAME" if "$USER_LAST_NAME" else ""

# Check if user already exists
if User.objects.filter(email=email).exists():
    print(f"User with email {email} already exists. Skipping creation.")
else:
    # Create superuser
    User.objects.create_superuser(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    print(f"Superuser {email} created successfully!")
EOF
    
    deactivate
    echo "✓ userservice superuser setup complete"
    echo ""
}

# Function to create superuser for teamservice
create_teamservice_superuser() {
    echo "--- Creating superuser for teamservice ---"
    cd "$PROJECT_ROOT/services/teamservice"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment for teamservice..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Check if manage.py exists
    if [ ! -f "manage.py" ]; then
        echo "Error: manage.py not found in teamservice"
        deactivate
        return 1
    fi
    
    # Install/upgrade dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        echo "Installing Python dependencies..."
        pip install --upgrade pip --quiet
        pip install -r requirements.txt --quiet
    fi
    
    # Get superuser details from environment variables
    TEAM_USERNAME="${SETUP_TEAM_USERNAME:-}"
    TEAM_PASSWORD="${SETUP_TEAM_PASSWORD:-}"
    TEAM_EMAIL="${SETUP_TEAM_EMAIL:-}"
    
    # Validate required fields
    if [ -z "$TEAM_USERNAME" ] || [ -z "$TEAM_PASSWORD" ] || [ -z "$TEAM_EMAIL" ]; then
        echo "Error: SETUP_TEAM_USERNAME, SETUP_TEAM_PASSWORD, and SETUP_TEAM_EMAIL must be set in .env file"
        echo "Please add these variables to your .env file and try again."
        deactivate
        return 1
    fi
    
    # Override DB_HOST to localhost when running from host (not in Docker)
    export DB_HOST="${DB_HOST:-localhost}"
    if [ "$DB_HOST" = "postgres" ]; then
        export DB_HOST="localhost"
    fi
    
    echo "Creating superuser with username: $TEAM_USERNAME"
    echo "Connecting to database at: $DB_HOST:$DB_PORT"
    
    # Create superuser using Python script (teamservice uses Django's default User model)
    python << EOF
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'teamservice.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

username = "$TEAM_USERNAME"
email = "$TEAM_EMAIL"
password = "$TEAM_PASSWORD"

# Check if user already exists
if User.objects.filter(username=username).exists():
    print(f"User with username {username} already exists. Skipping creation.")
else:
    # Create superuser
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f"Superuser {username} created successfully!")
EOF
    
    deactivate
    echo "✓ teamservice superuser setup complete"
    echo ""
}

# Function to seed userservice
seed_userservice() {
    echo "--- Seeding userservice ---"
    cd "$PROJECT_ROOT/services/userservice"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Error: Virtual environment not found."
        return 1
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Override DB_HOST to localhost when running from host (not in Docker)
    export DB_HOST="${DB_HOST:-localhost}"
    if [ "$DB_HOST" = "postgres" ]; then
        export DB_HOST="localhost"
    fi
    
    # Run seeder
    python manage.py seed_users || {
        echo "Warning: User seeding failed or users already exist."
    }
    
    deactivate
    echo ""
}

# Function to seed teamservice
seed_teamservice() {
    echo "--- Seeding teamservice ---"
    cd "$PROJECT_ROOT/services/teamservice"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Error: Virtual environment not found."
        return 1
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Override DB_HOST to localhost when running from host (not in Docker)
    export DB_HOST="${DB_HOST:-localhost}"
    if [ "$DB_HOST" = "postgres" ]; then
        export DB_HOST="localhost"
    fi
    
    # Run seeder
    python manage.py seed_teams || {
        echo "Warning: Team seeding failed or teams already exist."
    }
    
    deactivate
    echo ""
}

# Function to seed taskservice
seed_taskservice() {
    echo "--- Seeding taskservice ---"
    cd "$PROJECT_ROOT/services/taskservice"
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment for taskservice..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Check if manage.py exists
    if [ ! -f "manage.py" ]; then
        echo "Error: manage.py not found in taskservice"
        deactivate
        return 1
    fi
    
    # Install/upgrade dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        echo "Installing Python dependencies..."
        pip install --upgrade pip --quiet
        pip install -r requirements.txt --quiet
    fi
    
    # Override MONGO_HOST to localhost when running from host (not in Docker)
    export MONGO_HOST="${MONGO_HOST:-localhost}"
    if [ "$MONGO_HOST" = "mongodb" ]; then
        export MONGO_HOST="localhost"
    fi
    
    echo "Connecting to MongoDB at: $MONGO_HOST:$MONGO_PORT"
    
    # Run seeder
    python manage.py seed_tasks || {
        echo "Warning: Task seeding failed or tasks already exist."
    }
    
    deactivate
    echo ""
}

# Function to create media directories
create_media_directories() {
    echo "--- Creating media directories ---"
    
    TASKSERVICE_DIR="$PROJECT_ROOT/services/taskservice"
    
    if [ ! -d "$TASKSERVICE_DIR" ]; then
        echo "Warning: TaskService directory not found at $TASKSERVICE_DIR"
        return
    fi
    
    # Create media root directory
    MEDIA_ROOT="$TASKSERVICE_DIR/media"
    echo "Creating media root directory: $MEDIA_ROOT"
    mkdir -p "$MEDIA_ROOT"
    
    # Create task files directory
    TASK_FILES_DIR="$MEDIA_ROOT/task_files"
    echo "Creating task files directory: $TASK_FILES_DIR"
    mkdir -p "$TASK_FILES_DIR"
    
    # Create comment files directory
    COMMENT_FILES_DIR="$MEDIA_ROOT/comment_files"
    echo "Creating comment files directory: $COMMENT_FILES_DIR"
    mkdir -p "$COMMENT_FILES_DIR"
    
    echo "✓ Media directories created successfully!"
    echo "  - $TASK_FILES_DIR"
    echo "  - $COMMENT_FILES_DIR"
    echo ""
}

# Main execution
echo "Step 1: Creating media directories..."
create_media_directories

echo "Step 2: Creating userservice superuser..."
create_userservice_superuser

echo "Step 3: Creating teamservice superuser..."
create_teamservice_superuser

echo "Step 4: Seeding users..."
seed_userservice

echo "Step 5: Seeding teams..."
seed_teamservice

echo "Step 6: Seeding tasks..."
seed_taskservice

echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""

