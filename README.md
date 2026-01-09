# NEFOS - Task Management System

## 📋 Table of Contents
- [Purpose](#purpose)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Management](#database-management)
- [User Interface Guide](#user-interface-guide)
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

## Database Management

NEFOS uses two database systems:
- **PostgreSQL**: For user and team management (`userdb` and `teamdb`)
- **MongoDB**: For task management (`taskdb`)

### PostgreSQL Web Interfaces (Django Admin)

PostgreSQL databases are managed through Django admin interfaces for each service.

#### UserService Django Admin

**Access:**
- **URL**: http://localhost:8000/admin/
- **Email**: `admin@example.com` (or value from `.env` `SETUP_USER_EMAIL`)
- **Password**: `admin123` (or value from `.env` `SETUP_USER_PASSWORD`)

**What you can do:**
- Manage users and their roles
- View authentication tokens
- Edit user profiles

#### TeamService Django Admin

**Access:**
- **URL**: http://localhost:8001/admin/
- **Username**: `admin` (or value from `.env` `SETUP_TEAM_USERNAME`)
- **Password**: `admin123` (or value from `.env` `SETUP_TEAM_PASSWORD`)

**What you can do:**
- Manage teams
- View team members
- Edit team relationships

### MongoDB Web Interface

**Mongo Express** provides a web-based interface for MongoDB.

**Access:**
- **URL**: http://localhost:8081
- **Username**: `admin`
- **Password**: `admin`

**What you can do:**
- Browse collections (tasks, comments, files)
- View and edit documents
- Run queries
- Monitor database statistics

---

## User Interface Guide

### Overview

NEFOS provides a modern, dark-themed interface for managing tasks, teams, and users. The UI is role-based, showing different features depending on your user role (Admin, Team Leader, or Member).

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, manage all users, teams, and tasks; view all data |
| **Team Leader** | Create/manage teams, create/assign tasks, edit task details, add team members |
| **Member** | View assigned tasks, update task status, add comments, upload files |

### Main Features

#### 1. Dashboard (Home Page)

**Access:** Click "Dashboard" in sidebar or navigate to `/`

**Features:**
- **Statistics Cards**: Quick overview of total teams, tasks, in-progress, and completed tasks
- **Status Breakdown**: Visual progress bars showing task distribution
- **Recent Teams**: Last 3 teams created (with "Go to My Teams" link)
- **Recent Tasks**: Last 3 tasks assigned to you (with "Go to My Tasks" link)

**Available to:** All users

#### 2. Teams Management

**Access:** Click "My Teams" in sidebar or navigate to `/teams`

**List View:**
- Browse all teams you're part of (or all teams if Admin)
- Each team card shows:
  - Team name and description
  - Member count
  - Task count
  - Created date
  - "View Details" button

**Team Details Page:**
- Click any team to view details
- Shows:
  - Team members list with roles
  - All tasks assigned to the team
  - Task statistics
- **Team Leaders/Admins can:**
  - Edit team information
  - Add/remove members
  - Delete team (Admin only)

**Creating a Team:**
1. Click "Add Team" button
2. Fill in team name and description
3. Select team members from list
4. Click "Create Team"

**Available to:** All users (view), Team Leaders/Admins (create/edit)

#### 3. Task Management

**Access:** Click "My Tasks" in sidebar or navigate to `/tasks`

**List View:**
- View all your assigned tasks (or all tasks if Admin)
- Filter by:
  - Status (TODO, IN_PROGRESS, DONE)
  - Priority (Low, Medium, High)
  - Time range (custom date picker)
- Each task card shows:
  - Title and description excerpt
  - Priority badge (color-coded)
  - Status badge (color-coded)
  - Due date
  - Assigned user
  - Team name
  - "View Details" button

**Task Details Page:**
- Complete task information
- Description
- Priority and status
- Due date
- Assigned user and team
- Attached files (downloadable)
- Comments section
- **Members can:**
  - Update task status
  - Add comments
  - Upload files to comments
  - View/download attachments
- **Team Leaders/Admins can:**
  - Edit task title and description
  - Add task files
  - Delete task (Admin only)

**Creating a Task:**
1. Click "Add Task" button
2. Fill in:
   - Title
   - Description (optional)
   - Priority (Low/Medium/High)
   - Due date
   - Select team
   - Select assignee (from team members)
3. Optionally attach files (PDF, JPG)
4. Click "Create Task"

**Available to:** All users (view assigned), Team Leaders/Admins (create/edit)

#### 4. User Management (Admin Only)

**Access:** Click "Admin Panel" in sidebar or navigate to `/admin`

**Features:**
- View all users in the system
- User cards show:
  - Name and email
  - Role (Admin, Team Leader, Member)
  - Active status
  - Join date
- Filter and search users
- View user statistics

**Available to:** Admin only

### Common Workflows

#### Workflow 1: Team Leader Creating a Project

1. **Create a Team**
   - Go to "My Teams"
   - Click "Add Team"
   - Enter team name and description
   - Select team members
   - Click "Create Team"

2. **Create Tasks for the Team**
   - Go to "My Tasks"
   - Click "Add Task"
   - Fill in task details
   - Select your team
   - Assign to a team member
   - Attach relevant files
   - Click "Create Task"

3. **Monitor Progress**
   - Dashboard shows progress overview
   - Visit team details to see all team tasks
   - Check task statuses

#### Workflow 2: Member Completing a Task

1. **View Assigned Tasks**
   - Go to "My Tasks"
   - See all tasks assigned to you
   - Filter by status if needed

2. **Work on a Task**
   - Click task card to view details
   - Read description and requirements
   - Download attached files if any

3. **Update Progress**
   - Change status from TODO → IN_PROGRESS
   - Add comments about progress
   - Upload work files to comments

4. **Complete Task**
   - When finished, change status to DONE
   - Add final comment
   - Upload deliverable files

#### Workflow 3: Admin Managing the System

1. **Monitor Overall Activity**
   - Dashboard shows system-wide statistics
   - View all teams and tasks

2. **Manage Users**
   - Go to "Admin Panel"
   - View all registered users
   - Check user roles and status

3. **Oversee Projects**
   - Access any team's details
   - View and edit any task
   - Ensure proper task distribution

### UI Components Guide

#### Priority Badges

- 🟢 **Low**: Teal/Cyan color - Non-urgent tasks
- 🟡 **Medium**: Yellow/Orange color - Standard priority
- 🔴 **High**: Red color - Urgent, requires immediate attention

#### Status Badges

- ⚪ **TODO**: Gray - Not started yet
- 🟡 **IN_PROGRESS**: Yellow - Currently being worked on
- 🟢 **DONE**: Green - Completed tasks

#### File Management

**Supported File Types:**
- **PDF documents**: For task requirements, deliverables
- **JPG images**: For screenshots, designs, photos

**File Operations:**
- **Upload**: Drag & drop or click to browse
- **Download**: Click filename in attachments list
- **View**: Files are stored and accessible via direct links

#### Comments Section

- **Add Comment**: Type in text area and click "Add Comment"
- **Attach Files**: Click attachment icon to add files to comment
- **Delete Comment**: Only your own comments (trash icon)
- **Timestamps**: All comments show creation date/time
- **User Attribution**: Each comment shows author's name

### Navigation

**Sidebar Menu:**
- Dashboard (Home)
- My Teams
- My Tasks
- Admin Panel (Admin only)
- Logout

**Top Bar:**
- User profile (shows current user name)
- Role indicator
- Quick navigation breadcrumbs

### Keyboard Shortcuts

- `Esc`: Close modals/dialogs
- `Tab`: Navigate through form fields
- `Enter`: Submit forms (when in text input)

### Mobile Responsiveness

The UI is fully responsive and works on:
- Desktop (1920x1080 and above)
- Laptop (1366x768 and above)
- Tablet (768x1024)
- Mobile (375x667 and above)

### Tips for Best Experience

1. **Use Filters**: On My Tasks page, use status/priority filters to focus on relevant tasks
2. **Regular Updates**: Update task status regularly to keep team informed
3. **Descriptive Comments**: Add detailed comments when changing status
4. **Attach Files**: Include relevant files for better context
5. **Check Dashboard**: Start each session by checking dashboard for overview
6. **Team Collaboration**: Use comments for team communication on tasks

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

