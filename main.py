from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash

from db import SessionLocal
from models import User, Task

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "change_this_secret"
ALGORITHM = "HS256"
EXPIRE_MINUTES = 60


def get_db():
    return SessionLocal()


def get_user_id_from_token(token: str):
    data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return int(data["sub"])


@app.get("/")
def home():
    return {"message": "API running"}


@app.post("/register")
def register(name: str, email: str, password: str):
    password = password.strip()
    if len(password) < 6:
        return {"error": "Password too short"}

    db: Session = get_db()

    hashed_password = generate_password_hash(password)
    new_user = User(name=name, email=email, password=hashed_password)

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        db.close()
        return {"error": "Email already registered"}
    except Exception:
        db.rollback()
        db.close()
        return {"error": "Something went wrong"}

    db.close()
    return {"message": "User registered", "user_id": new_user.id}


@app.post("/login")
def login(email: str, password: str):
    db: Session = get_db()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        db.close()
        return {"error": "Invalid credentials"}

    if not check_password_hash(user.password, password.strip()):
        db.close()
        return {"error": "Invalid credentials"}

    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    token = jwt.encode({"sub": str(user.id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

    db.close()
    return {"access_token": token}


@app.post("/tasks")
def create_task(
    title: str,
    token: str,
    description: str = "",
    priority: str = "MEDIUM",
    status: str = "PENDING",
):
    user_id = get_user_id_from_token(token)

    db: Session = get_db()

    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        priority=priority,
        status=status,
    )

    db.add(task)
    db.commit()
    db.refresh(task)
    db.close()

    return {"message": "Task created", "task_id": task.id}


@app.get("/tasks")
def get_tasks(
    token: str,
    status: str = None,
    priority: str = None,
    search: str = None,
):
    user_id = get_user_id_from_token(token)

    db: Session = get_db()
    q = db.query(Task).filter(Task.user_id == user_id)

    if status:
        q = q.filter(Task.status == status)

    if priority:
        q = q.filter(Task.priority == priority)

    if search:
        q = q.filter(Task.title.ilike(f"%{search}%"))

    tasks = q.all()
    db.close()
    return tasks


@app.patch("/tasks/{task_id}")
def update_task(
    task_id: int,
    token: str,
    title: str = None,
    description: str = None,
    priority: str = None,
    status: str = None,
):
    user_id = get_user_id_from_token(token)

    db: Session = get_db()
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()

    if not task:
        db.close()
        return {"error": "Task not found"}

    if title is not None:
        task.title = title
    if description is not None:
        task.description = description
    if priority is not None:
        task.priority = priority
    if status is not None:
        task.status = status

    db.commit()
    db.refresh(task)
    db.close()

    return {"message": "Task updated"}


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, token: str):
    user_id = get_user_id_from_token(token)

    db: Session = get_db()
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()

    if not task:
        db.close()
        return {"error": "Task not found"}

    db.delete(task)
    db.commit()
    db.close()

    return {"message": "Task deleted"}
