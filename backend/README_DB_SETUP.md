# Database Setup - Quick Guide

## Quick Start (3 minutes)

```bash
# 1. Create database (in psql)
CREATE DATABASE studyhub;

# 2. Setup environment
cd backend
cp .env.example .env
# Edit DATABASE_URL in .env

# 3. Run automatic setup
python quick_setup.py

# 4. Start server
uvicorn main:app --reload

# 5. Check API
# http://localhost:8000/docs
```

---

## What Gets Created

### Database Tables (10 total):
1. **users** - User accounts and profiles
2. **courses** - Course information
3. **user_courses** - User enrollment (many-to-many) ⭐ NEW
4. **materials** - Study materials
5. **ratings** - Material ratings
6. **discussions** - Course discussions
7. **comments** - Discussion comments
8. **messages** - User messages
9. **notifications** - User notifications
10. **alembic_version** - Migration tracking

---

## Manual Setup

### Step 1: PostgreSQL Database
```sql
-- Using psql
psql -U postgres

CREATE DATABASE studyhub;
CREATE USER studyhub WITH PASSWORD 'studyhub123';
GRANT ALL PRIVILEGES ON DATABASE studyhub TO studyhub;
\q
```

### Step 2: Environment Configuration
```bash
# Copy example
cp .env.example .env

# Edit .env and set:
DATABASE_URL=postgresql://studyhub:studyhub123@localhost:5432/studyhub
SECRET_KEY=your-very-long-random-secret-key-here
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Create Migration
```bash
alembic revision --autogenerate -m "Initial migration with all models"
```

### Step 5: Run Migration
```bash
alembic upgrade head
```

### Step 6: Verify
```bash
python check_db.py
```

---

## Verification Scripts

### check_db.py
Comprehensive database checker:
```bash
python check_db.py
```

Shows:
- ✅ Connection status
- ✅ Table list
- ✅ Table structure
- ✅ Migration status
- ✅ Row counts

### quick_setup.py
Automated setup script:
```bash
python quick_setup.py
```

Does:
- ✅ Check .env file
- ✅ Test connection
- ✅ Create migrations
- ✅ Run migrations
- ✅ Verify setup

---

## Database Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### Examples:
```bash
# Default postgres user
postgresql://postgres:mypassword@localhost:5432/studyhub

# Custom user
postgresql://studyhub:studyhub123@localhost:5432/studyhub

# Remote server
postgresql://user:pass@192.168.1.100:5432/studyhub
```

---

## Common Issues

### "could not connect to server"
```bash
# Check if PostgreSQL is running
# Windows: services.msc → PostgreSQL
# Linux: sudo systemctl status postgresql
```

### "password authentication failed"
```bash
# Check DATABASE_URL in .env
# Verify password is correct
```

### "database does not exist"
```bash
psql -U postgres -c "CREATE DATABASE studyhub;"
```

### "relation already exists"
```bash
# Drop and recreate (WARNING: deletes all data)
psql -U postgres
DROP DATABASE studyhub;
CREATE DATABASE studyhub;
\q

alembic upgrade head
```

---

## Useful Commands

```bash
# Check current migration
alembic current

# Show migration history
alembic history

# Upgrade to latest
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# Reset database
alembic downgrade base
alembic upgrade head

# Check connection
python -c "from app.db.session import engine; engine.connect(); print('OK')"

# List tables
psql -U studyhub -d studyhub -c "\dt"
```

---

## Files Reference

- **SETUP_DATABASE.md** - Detailed setup guide (English)
- **מדריך_התקנה_מהיר.md** - Quick guide (Hebrew)
- **check_db.py** - Database verification script
- **quick_setup.py** - Automated setup script
- **.env.example** - Environment template

---

## Next Steps

After setup:
1. ✅ Create admin user
2. ✅ Create test courses
3. ✅ Test API endpoints
4. ✅ Connect frontend

---

## Testing the API

### Quick test:
```bash
# Get all courses
curl http://localhost:8000/api/v1/courses

# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

### Using the test script:
```bash
python test_courses_manual.py
```

---

## Need Help?

1. Run diagnostics:
   ```bash
   python check_db.py
   ```

2. Check logs:
   ```bash
   uvicorn main:app --reload --log-level debug
   ```

3. Read detailed guide:
   - SETUP_DATABASE.md
   - docs/COURSES_API.md

---

**Ready to go! 🚀**
