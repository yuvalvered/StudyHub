# StudyHub - Quick Commands Reference

## 🚀 Setup Commands

```bash
# Initial setup (one-time)
cd backend
cp .env.example .env
# Edit .env with your database details
python quick_setup.py
```

---

## 🔄 Database Commands

### Alembic (Migrations)
```bash
# Check current migration version
alembic current

# Show migration history
alembic history --verbose

# Create new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Run all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Reset to base (WARNING: removes all data)
alembic downgrade base

# Show SQL without executing
alembic upgrade head --sql
```

### Database Verification
```bash
# Full database check
python check_db.py

# Quick connection test
python -c "from app.db.session import engine; engine.connect(); print('✅ Connected')"
```

---

## 🖥️ Server Commands

```bash
# Start development server
uvicorn main:app --reload

# Start with custom host/port
uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# Start with debug logs
uvicorn main:app --reload --log-level debug

# Production mode (no reload)
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🧪 Testing Commands

```bash
# Run database check
python check_db.py

# Run manual API tests
python test_courses_manual.py

# Test specific endpoint with curl
curl http://localhost:8000/api/v1/courses
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

---

## 📦 Package Management

```bash
# Install dependencies
pip install -r requirements.txt

# Update requirements file
pip freeze > requirements.txt

# Install single package
pip install package-name
```

---

## 🗄️ PostgreSQL Commands

```bash
# Connect to database
psql -U studyhub -d studyhub

# As postgres user
psql -U postgres

# Create database
psql -U postgres -c "CREATE DATABASE studyhub;"

# Drop database (WARNING: deletes all data)
psql -U postgres -c "DROP DATABASE studyhub;"

# List databases
psql -U postgres -c "\l"

# Inside psql:
\dt                    # List tables
\d table_name          # Describe table
\du                    # List users
\l                     # List databases
\q                     # Quit
```

---

## 🔍 Debugging Commands

```bash
# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Import all models (check for errors)
python -c "from app.models import *; print('✅ Models imported')"

# Check settings
python -c "from app.core.config import settings; print(f'DB: {settings.DATABASE_URL}')"

# Test database connection
python -c "from sqlalchemy import create_engine, text; from app.core.config import settings; engine = create_engine(settings.DATABASE_URL); conn = engine.connect(); result = conn.execute(text('SELECT version()')); print(result.fetchone()[0]); conn.close()"
```

---

## 📝 Git Commands (Common)

```bash
# Status
git status

# Add changes
git add .
git add specific-file.py

# Commit
git commit -m "Description of changes"

# Push
git push origin main

# Pull latest
git pull origin main

# Create branch
git checkout -b feature-name

# Switch branch
git checkout main
```

---

## 🔐 Environment Variables

```bash
# Windows CMD
set DATABASE_URL=postgresql://user:pass@localhost/db

# Windows PowerShell
$env:DATABASE_URL="postgresql://user:pass@localhost/db"

# Linux/Mac
export DATABASE_URL=postgresql://user:pass@localhost/db

# Check variable
echo %DATABASE_URL%        # Windows CMD
echo $env:DATABASE_URL     # Windows PowerShell
echo $DATABASE_URL         # Linux/Mac
```

---

## 🎯 Common Workflows

### After Changing Models:
```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
python check_db.py
```

### Fresh Database Setup:
```bash
# Drop everything
alembic downgrade base
# OR drop database
psql -U postgres -c "DROP DATABASE studyhub; CREATE DATABASE studyhub;"

# Run migrations
alembic upgrade head
python check_db.py
```

### After Pulling Code:
```bash
git pull origin main
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

### Creating API Test:
```bash
uvicorn main:app --reload
# In another terminal:
curl http://localhost:8000/api/v1/courses
```

---

## 📱 URLs

```bash
# API Documentation
http://localhost:8000/docs          # Swagger UI
http://localhost:8000/redoc         # ReDoc

# API Endpoints
http://localhost:8000/api/v1/courses
http://localhost:8000/api/v1/users
http://localhost:8000/api/v1/materials

# Health Check
http://localhost:8000/health
```

---

## 🚨 Emergency Commands

### Server won't start:
```bash
# Check for processes using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8000
kill -9 <PID>
```

### Database locked:
```bash
# Kill all connections
psql -U postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'studyhub'
  AND pid <> pg_backend_pid();
"
```

### Reset everything (DANGER):
```bash
# Drop and recreate database
psql -U postgres <<EOF
DROP DATABASE IF EXISTS studyhub;
CREATE DATABASE studyhub;
GRANT ALL PRIVILEGES ON DATABASE studyhub TO studyhub;
EOF

# Run migrations
alembic upgrade head
```

---

## 💡 Tips

### Alias for common commands (Linux/Mac):
```bash
# Add to ~/.bashrc or ~/.zshrc
alias dbcheck="python check_db.py"
alias dbup="alembic upgrade head"
alias serve="uvicorn main:app --reload"
```

### VS Code Tasks:
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Server",
      "type": "shell",
      "command": "uvicorn main:app --reload",
      "problemMatcher": []
    },
    {
      "label": "Check Database",
      "type": "shell",
      "command": "python check_db.py",
      "problemMatcher": []
    }
  ]
}
```

---

**Keep this file handy for quick reference! 📌**
