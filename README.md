# NEFOS - Task Management System

## 📋 Table of Contents
- [Purpose](#purpose)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Common Issues & Solutions](#common-issues--solutions)
- [Development Workflow](#development-workflow)

---

## Purpose

**NEFOS** (TaskFlow) is a comprehensive task management and team collaboration platform designed to help organizations manage projects, teams, and tasks efficiently. The application provides a centralized system where administrators can manage teams, team leaders can create and assign tasks, and team members can track their work progress.

The system is built with a microservices architecture, separating concerns into distinct services for users, teams, and tasks, ensuring scalability and maintainability.

---

## Core Features

### 🔐 Authentication & Authorization
- **User Registration & Login**: JWT-based authentication system
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, can manage all teams and view all tasks
  - **Team Leader**: Can create teams, assign tasks, edit task details, and manage team members
  - **Member**: Can view assigned tasks, update task status, and add comments

### 👥 Team Management
- Create and manage teams
- Assign team leaders and members
- View team statistics (member count, task count)
- Team details page with member list and task overview
- Admin can delete teams

### 📝 Task Management
- **Task Creation**: Team leaders can create tasks with:
  - Title and description
  - Priority levels (Low, Medium, High) with color-coded badges
  - Due dates
  - File attachments (PDF, JPG)
  - Assignment to team members
- **Task Status Tracking**: Three statuses (TODO, IN_PROGRESS, DONE) with color-coded badges
- **Task Editing**: Team leaders can edit task title and description
- **File Management**: 
  - Attach files when creating tasks
  - Add additional files to existing tasks
  - View and download task attachments
  - Files stored locally in `services/taskservice/media/`
- **Task Filtering**: Filter by status, priority, and time range
- **My Tasks Page**: View all assigned tasks (or all tasks for admins)

### 💬 Comments & Collaboration
- Add comments to tasks
- Attach files to comments (PDF, JPG)
- Delete own comments and comment files
- View comment history with timestamps

### 📊 Dashboard
- Overview statistics:
  - Total teams count
  - Total tasks count
  - In-progress tasks
  - Completed tasks
- Task status breakdown with progress bars
- Recent teams (limited to 3, with "Go to My Teams" button)
- Recent tasks (limited to 3, with "Go to My Tasks" button)

### 🎨 User Interface
- Modern, responsive design with dark theme
- Color-coded priority badges (Low: Teal, Medium: Yellow/Orange, High: Red)
- Color-coded status badges (TODO: Gray, IN_PROGRESS: Yellow, DONE: Green)
- Interactive hover effects
- Toast notifications for user feedback

---

## Tech Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.11.0
- **State Management**: React Query (TanStack Query) 5.90.13
- **UI Components**: 
  - Radix UI primitives
  - Tailwind CSS 4.1.18
  - Custom component library
- **HTTP Client**: Axios 1.13.2
- **Form Handling**: React Hook Form 7.69.0
- **Icons**: Lucide React 0.562.0

### Backend Services

#### User Service (`userservice`)
- **Framework**: Django 6.0 with Django REST Framework 3.15.2
- **Database**: PostgreSQL 16 (via psycopg2-binary 2.9.9)
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.1)
- **CORS**: django-cors-headers 4.6.0
- **Port**: 8000

#### Team Service (`teamservice`)
- **Framework**: Django 6.0 with Django REST Framework 3.15.2
- **Database**: PostgreSQL 16 (via psycopg2-binary 2.9.9)
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.1)
- **CORS**: django-cors-headers 4.6.0
- **Port**: 8001

#### Task Service (`taskservice`)
- **Framework**: Django 6.0 with Django REST Framework 3.15.2
- **Database**: MongoDB 7 (via mongoengine 0.29.1, pymongo 4.6.1)
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.1)
- **CORS**: django-cors-headers 4.3.1
- **File Storage**: Local filesystem (`media/` directory)
- **Port**: 8002

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Databases**:
  - PostgreSQL 16 (for userservice and teamservice)
  - MongoDB 7 (for taskservice)
- **Database Management**: Mongo Express (port 8081)
- **Orchestration**: Makefile for simplified commands

### Development Tools
- **Python**: 3.12
- **Node.js**: Latest LTS
- **Package Managers**: pip, npm

---

## Project Structure

```
nefos/
├── docker-compose.yml          # Docker Compose configuration
├── Makefile                     # Build and deployment commands
├── .env.example                 # Environment variables template
├── .env                         # Environment variables (created from .env.example)
├── README.md                    # This file
│
├── scripts/                     # Setup and initialization scripts
│   ├── init_db.sh              # PostgreSQL database initialization
│   └── setup.sh                # Main setup script (superusers, media dirs, seeders)
│
└── services/                    # Microservices
    │
    ├── frontend/                # React frontend application
    │   ├── src/
    │   │   ├── components/      # Reusable UI components
    │   │   │   ├── dashboard/   # Dashboard-specific components
    │   │   │   ├── layout/      # Layout components (Sidebar, AppLayout)
    │   │   │   ├── shared/      # Shared components (StatusBadge, etc.)
    │   │   │   ├── tasks/       # Task-related components
    │   │   │   ├── teams/       # Team-related components
    │   │   │   └── ui/          # Base UI components (buttons, inputs, etc.)
    │   │   ├── contexts/        # React contexts (AuthContext)
    │   │   ├── hooks/           # Custom React hooks
    │   │   ├── lib/             # Utilities and API client
    │   │   │   ├── api.ts       # API client with all endpoints
    │   │   │   └── utils.ts     # Utility functions
    │   │   ├── pages/           # Page components
    │   │   │   ├── Dashboard.tsx
    │   │   │   ├── Login.tsx
    │   │   │   ├── Signup.tsx
    │   │   │   ├── Teams.tsx
    │   │   │   ├── TeamDetails.tsx
    │   │   │   ├── AddTeam.tsx
    │   │   │   ├── AddTask.tsx
    │   │   │   ├── TaskDetail.tsx
    │   │   │   ├── MyTasks.tsx
    │   │   │   ├── AdminPanel.tsx
    │   │   │   └── NotFound.tsx
    │   │   ├── App.tsx          # Main app component with routing
    │   │   ├── main.tsx         # Entry point
    │   │   └── index.css        # Global styles
    │   ├── package.json
    │   ├── vite.config.ts
    │   ├── tailwind.config.ts
    │   └── Dockerfile
    │
    ├── userservice/             # User management service
    │   ├── userapi/
    │   │   ├── models.py        # User model (email-based authentication)
    │   │   ├── views.py         # API endpoints
    │   │   ├── serializers.py   # DRF serializers
    │   │   ├── permissions.py   # Custom permissions
    │   │   ├── urls.py          # URL routing
    │   │   └── management/
    │   │       └── commands/
    │   │           └── seed_users.py  # Seeder for users
    │   ├── userservice/
    │   │   ├── settings.py       # Django settings
    │   │   └── urls.py           # Root URL config
    │   ├── manage.py
    │   ├── requirements.txt
    │   └── Dockerfile
    │
    ├── teamservice/             # Team management service
    │   ├── teamapi/
    │   │   ├── models.py        # Team and TeamUser models
    │   │   ├── views.py         # API endpoints
    │   │   ├── serializers.py   # DRF serializers
    │   │   ├── permissions.py   # Custom permissions
    │   │   ├── urls.py          # URL routing
    │   │   └── management/
    │   │       └── commands/
    │   │           └── seed_teams.py  # Seeder for teams
    │   ├── teamservice/
    │   │   ├── settings.py       # Django settings
    │   │   └── urls.py           # Root URL config
    │   ├── manage.py
    │   ├── requirements.txt
    │   └── Dockerfile
    │
    └── taskservice/             # Task management service
        ├── taskapi/
        │   ├── models.py        # Task, Comment, TaskFile, CommentFile models (MongoDB)
        │   ├── views.py         # API endpoints
        │   ├── serializers.py   # DRF serializers
        │   ├── permissions.py   # Custom permissions
        │   ├── urls.py          # URL routing
        │   └── management/
        │       └── commands/
        │           └── seed_tasks.py  # Seeder for tasks
        ├── taskservice/
        │   ├── settings.py       # Django settings (MongoDB config)
        │   └── urls.py           # Root URL config (media file serving)
        ├── media/                # Local file storage
        │   ├── task_files/       # Task attachments
        │   └── comment_files/    # Comment attachments
        ├── manage.py
        ├── requirements.txt
        └── Dockerfile
```

---

## Getting Started

### Prerequisites
- **Docker** and **Docker Compose** installed
- **Make** utility (usually pre-installed on Linux/macOS)
- **Git** (for cloning the repository)
- **Python 3.x** (for setup scripts that run on the host)
- **python3-venv** (for creating virtual environments)
  - Ubuntu/Debian: `sudo apt-get install python3-venv`
  - RHEL/CentOS: `sudo yum install python3-venv`
  - Fedora: `sudo dnf install python3-venv`

### Quick Start

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd nefos
   ```

2. **Start all services**:
   ```bash
   make up
   ```
   
   This command will:
   - Check/create `.env` file from `.env.example`
   - Build all Docker images
   - Start all services (PostgreSQL, MongoDB, frontend, backend services)
   - Wait for databases to be healthy
   - Run setup script (create superusers, media directories, seed data)

3. **Access the application**:
   - **Frontend**: http://localhost:5173
   - **User Service API**: http://localhost:8000
   - **Team Service API**: http://localhost:8001
   - **Task Service API**: http://localhost:8002
   - **Mongo Express**: http://localhost:8081 (admin/admin)

### Clean Install / Fresh Clone Setup

If you've just cloned the repository or performed a clean install, you may need to create virtual environments before the setup script can run successfully:

1. **Ensure python3-venv is installed**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install python3-venv
   
   # RHEL/CentOS
   sudo yum install python3-venv
   
   # Fedora
   sudo dnf install python3-venv
   ```

2. **Create virtual environments**:
   ```bash
   make create-venvs
   # Or alternatively: bash scripts/create_venvs.sh
   ```
   
   This is only needed once after cloning or if `venv/` folders are deleted.

3. **Start services**:
   ```bash
   make up
   ```
   
   The setup script will now run successfully as the virtual environments exist.

### Manual Setup (Alternative)

If you prefer to run services manually:

1. **Create `.env` file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start Docker services**:
   ```bash
   docker compose up -d
   ```

3. **Create virtual environments** (required after clean install):
   ```bash
   make create-venvs
   # Or: bash scripts/create_venvs.sh
   ```
   
   This will:
   - Create virtual environments for all backend services
   - Install Python dependencies from requirements.txt
   - Verify the setup was successful

4. **Run setup script**:
   ```bash
   bash scripts/setup.sh
   ```

### Available Make Commands

```bash
make up           # Build and start all services, then run setup
make down         # Stop all services
make restart      # Restart all services (down then up)
make logs         # View logs from all services
make setup        # Run setup script only
make create-venvs # Create virtual environments for all backend services
make build        # Build Docker images without starting
make clean        # Stop services and remove volumes (WARNING: deletes all data)
make help         # Show help message
```

### Available Scripts

```bash
bash scripts/create_venvs.sh  # Create virtual environments for all services
bash scripts/setup.sh          # Create superusers, media directories, and seed data
bash scripts/init_db.sh        # Initialize PostgreSQL databases (called by Docker)
```

### First Login

After running `make up`, you can log in with the admin credentials defined in your `.env` file:
- **Email**: Value of `SETUP_USER_EMAIL` from `.env`
- **Password**: Value of `SETUP_USER_PASSWORD` from `.env`

The setup script also seeds the database with:
- 2 team leaders
- 2 members
- 2 teams (with assigned leaders and members)
- 4 tasks (2 per team)

---

## Environment Variables

### Required Variables

Create a `.env` file in the project root (copy from `.env.example`):

#### Database Configuration
```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_MULTIPLE_DATABASES=userdb,teamdb
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=postgres          # Use 'localhost' when running setup.sh from host
DB_PORT=5432

# Database Names
USER_DB_NAME=userdb
TEAM_DB_NAME=teamdb
```

#### MongoDB Configuration
```bash
MONGO_HOST=mongodb        # Use 'localhost' when running setup.sh from host
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_mongo_password
MONGO_DATABASE=taskdb
MONGO_AUTH_DATABASE=admin
```

#### Authentication
```bash
JWT_SECRET_KEY=your_very_long_and_secure_jwt_secret_key_here
```

#### Setup Script Variables
```bash
# UserService Superuser
SETUP_USER_EMAIL=admin@example.com
SETUP_USER_PASSWORD=admin123
SETUP_USER_FIRST_NAME=Admin
SETUP_USER_LAST_NAME=User

# TeamService Superuser
SETUP_TEAM_USERNAME=admin
SETUP_TEAM_PASSWORD=admin123
SETUP_TEAM_EMAIL=admin@example.com
```

#### Frontend
```bash
NODE_ENV=development
```

### Important Notes

- **JWT_SECRET_KEY**: Must be a long, random string. Generate one using:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- **DB_HOST** and **MONGO_HOST**: 
  - Use `postgres` and `mongodb` when services run in Docker
  - Use `localhost` when running setup scripts from the host machine
- **Password Security**: Change all default passwords in production!

---

## Common Issues & Solutions

### 1. **Database Connection Errors**

**Problem**: `could not translate host name "postgres" to address`

**Solution**: 
- Ensure Docker services are running: `docker compose ps`
- Check that `DB_HOST` in `.env` is set to `postgres` (for Docker) or `localhost` (for host execution)
- Wait for PostgreSQL to be healthy: `docker compose ps postgres`

### 2. **MongoDB Connection Errors**

**Problem**: `ModuleNotFoundError: No module named 'mongoengine'` or MongoDB connection failures

**Solution**:
- Ensure MongoDB container is running: `docker compose ps mongodb`
- Check that `MONGO_HOST` in `.env` is set correctly
- Verify MongoDB credentials match in `.env` and `docker-compose.yml`
- Rebuild taskservice: `docker compose build taskservice`

### 3. **Setup Script Fails with "ModuleNotFoundError" or "venv/bin/activate: No such file or directory"**

**Problem**: Python dependencies not installed or virtual environment not created

**Solution**:
- Ensure `python3-venv` is installed:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install python3-venv
  
  # RHEL/CentOS
  sudo yum install python3-venv
  
  # Fedora
  sudo dnf install python3-venv
  ```
- Run the dedicated venv creation script:
  ```bash
  bash scripts/create_venvs.sh
  ```
- Or manually create venvs:
  ```bash
  cd services/userservice  # or teamservice/taskservice
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  deactivate
  ```
- After creating venvs, run the setup script again:
  ```bash
  bash scripts/setup.sh
  ```

**Note**: Virtual environments (`venv/` folders) are excluded from git and must be created after cloning the repository or after a clean install.

### 4. **Environment Variable Syntax Errors**

**Problem**: `.env: line X: syntax error near unexpected token`

**Solution**:
- Ensure `.env` file uses proper format: `VARIABLE_NAME=value` (no spaces around `=`)
- Check for special characters in values (especially `JWT_SECRET_KEY`)
- The setup script handles special characters, but ensure no unescaped quotes

### 5. **Port Already in Use**

**Problem**: `Error: bind: address already in use`

**Solution**:
- Check which process is using the port:
  ```bash
  # Linux
  sudo lsof -i :5173  # or 8000, 8001, 8002, etc.
  # macOS
  lsof -i :5173
  ```
- Stop the conflicting service or change the port in `docker-compose.yml`

### 6. **Frontend Not Loading**

**Problem**: Frontend shows blank page or connection errors

**Solution**:
- Check frontend container logs: `docker compose logs frontend`
- Ensure backend services are running: `docker compose ps`
- Verify API endpoints are accessible:
  - http://localhost:8000/api/users/ (UserService)
  - http://localhost:8001/api/teams/ (TeamService)
  - http://localhost:8002/api/tasks/ (TaskService)

### 7. **File Upload Failures**

**Problem**: Files not uploading or not accessible

**Solution**:
- Check that `services/taskservice/media/` directory exists and has write permissions
- Verify media directories were created: `ls -la services/taskservice/media/`
- Check taskservice logs: `docker compose logs taskservice`
- Ensure `MEDIA_ROOT` and `MEDIA_URL` are correctly configured in `taskservice/settings.py`

### 8. **Seeder Not Running**

**Problem**: Seeders skip with "already exists" message

**Solution**:
- Seeders only run if databases are empty (besides superusers)
- To re-seed, clean the database:
  ```bash
  make clean  # WARNING: This deletes all data
  make up
  ```

### 9. **JWT Authentication Errors**

**Problem**: "Invalid token" or authentication failures

**Solution**:
- Ensure `JWT_SECRET_KEY` is the same across all services
- Check that tokens are being sent in request headers
- Verify token expiration settings in Django settings
- Clear browser localStorage and re-login

### 10. **Docker Build Failures**

**Problem**: `docker compose build` fails

**Solution**:
- Check Docker daemon is running: `docker ps`
- Clear Docker cache: `docker compose build --no-cache`
- Ensure Docker has enough disk space: `docker system df`
- Check Dockerfile syntax in each service directory

### 11. **PostgreSQL Health Check Fails**

**Problem**: `wait-services` target times out

**Solution**:
- Check PostgreSQL logs: `docker compose logs postgres`
- Verify database initialization completed: `docker compose exec postgres psql -U postgres -l`
- Increase timeout in `Makefile` if needed
- Ensure `init_db.sh` has execute permissions: `chmod +x scripts/init_db.sh`

### 12. **Permission Denied Errors**

**Problem**: Scripts fail with "Permission denied"

**Solution**:
- Make scripts executable:
  ```bash
  chmod +x scripts/*.sh
  ```
- Check file ownership if running with sudo

---

## Development Workflow

### Running in Development Mode

1. **Start services**:
   ```bash
   make up
   ```

2. **View logs**:
   ```bash
   make logs              # All services
   docker compose logs -f frontend    # Specific service
   ```

3. **Stop services**:
   ```bash
   make down
   ```

4. **Restart a specific service**:
   ```bash
   docker compose restart userservice
   ```

### Making Changes

- **Frontend**: Changes are hot-reloaded (Vite dev server)
- **Backend**: Restart the service to apply changes:
  ```bash
  docker compose restart userservice
  ```

### Database Migrations

Run migrations manually if needed:

```bash
# UserService
docker compose exec userservice python manage.py migrate

# TeamService
docker compose exec teamservice python manage.py migrate

# TaskService (MongoDB - no migrations needed)
```

### Accessing Databases

**PostgreSQL**:
```bash
docker compose exec postgres psql -U postgres -d userdb
docker compose exec postgres psql -U postgres -d teamdb
```

**MongoDB**:
- Web UI: http://localhost:8081 (admin/admin)
- CLI:
  ```bash
  docker compose exec mongodb mongosh -u admin -p <password>
  ```

## Additional Notes

### File Storage
- Task files are stored in `services/taskservice/media/task_files/`
- Comment files are stored in `services/taskservice/media/comment_files/`
- Files are served directly by Django in development (no authentication required)
- In production, consider using cloud storage (S3, etc.) and proper authentication

### Security Considerations
- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- File uploads are not validated for file type/size in all cases
- CORS is configured for development (restrict in production)
- Database passwords should be strong and unique

### Performance
- MongoDB indexes are defined on frequently queried fields
- Consider adding caching (Redis) for production
- File serving could be optimized with a CDN or reverse proxy

---

## Contributors

George Karaviotis | gkaraviotis@tuc.gr

---

**Last Updated**: January 2025

