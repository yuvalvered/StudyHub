# 🚀 Quick Start Guide - StudyHub Backend

## Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### Step 2: Setup Database

**Option A: Use Docker (Easiest)**
```bash
docker-compose up db -d
```

**Option B: Install PostgreSQL locally**
```bash
# Install PostgreSQL from: https://www.postgresql.org/download/
# Then create database:
createdb studyhub
```

### Step 3: Configure Environment

```bash
# Edit the .env file that was created
# Minimum required settings:
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://studyhub:studyhub123@localhost:5432/studyhub
```

### Step 4: Run Migrations

```bash
alembic upgrade head
```

### Step 5: Start Server

```bash
uvicorn main:app --reload
```

**Done!** 🎉

Visit: http://localhost:8000/docs

---

## What's Working Now?

✅ API structure is set up
✅ Database models are defined
✅ Routes are created (skeleton)
✅ Authentication flow is structured

## What Needs Implementation?

⏳ Authentication logic (register, login)
⏳ File upload logic
⏳ AI/RAG services
⏳ All business logic in services

---

## Common Issues

### "Module not found"
```bash
# Make sure you're in the virtual environment
venv\Scripts\activate
pip install -r requirements.txt
```

### "Database connection failed"
```bash
# Check your DATABASE_URL in .env
# Make sure PostgreSQL is running
```

### "Alembic command not found"
```bash
# Install alembic
pip install alembic
```

---

## Next: Start Implementing Features

1. **Start with Authentication**
   - Implement `app/services/auth_service.py`
   - Test login/register in Swagger

2. **Then File Upload**
   - Implement `app/services/file_service.py`
   - Test file upload

3. **Then AI Features**
   - Implement RAG in `app/services/ai/`
   - Connect to OpenAI

---

Need help? Check:
- [README.md](README.md) - Full documentation
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Detailed structure explanation
- http://localhost:8000/docs - API documentation
