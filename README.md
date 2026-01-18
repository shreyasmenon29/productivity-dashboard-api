# Productivity Management Dashboard API (FastAPI + PostgreSQL)

Backend API for a productivity dashboard where users can **register, login, and manage tasks** (CRUD) securely.  
Includes a **basic frontend** for quick testing.

---

## Features ✅
### Authentication
- User registration
- User login
- JWT token generation

### Task Management
- Create task
- View all tasks (only for logged-in user)
- Update task
- Delete task

### Search & Filtering
- Filter by `status`
- Filter by `priority`
- Search by `title`

### Frontend
- Register + Login
- Token auto-saved after login
- Toast notifications (Registered ✅, Logged in ✅, Task created ✅)

---

## Tech Stack
- Backend: **FastAPI (Python)**
- Database: **PostgreSQL**
- ORM: **SQLAlchemy**
- Auth: **JWT**
- Frontend: **HTML + CSS + JavaScript**
