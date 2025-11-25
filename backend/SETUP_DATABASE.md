# מדריך התקנה והגדרת Database

## שלב 1: יצירת Database ב-PostgreSQL

### אופציה 1: דרך psql (Command Line)
```bash
# התחבר ל-PostgreSQL
psql -U postgres

# צור database חדש
CREATE DATABASE studyhub;

# צור משתמש חדש (אופציונלי)
CREATE USER studyhub WITH PASSWORD 'studyhub123';

# תן הרשאות למשתמש
GRANT ALL PRIVILEGES ON DATABASE studyhub TO studyhub;

# צא מ-psql
\q
```

### אופציה 2: דרך pgAdmin
1. פתח pgAdmin
2. לחץ ימני על "Databases" → Create → Database
3. שם: `studyhub`
4. Owner: `postgres` (או המשתמש שלך)
5. שמור

---

## שלב 2: הגדרת קובץ .env

צור קובץ `.env` בתיקיית `backend/` עם התוכן הבא:

```bash
# העתק את זה לקובץ .env
cp .env.example .env
```

ערוך את הקובץ `.env` והתאם את פרטי ההתחברות:

```ini
# Application Settings
APP_NAME=StudyHub
APP_VERSION=1.0.0
DEBUG=True

# Security - שנה את זה למפתח אקראי חזק!
SECRET_KEY=your-super-secret-key-change-this-in-production-make-it-very-long-and-random

# Database - עדכן לפי הפרטים שלך
DATABASE_URL=postgresql://studyhub:studyhub123@localhost:5432/studyhub

# אם אתה משתמש במשתמש postgres ברירת המחדל:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/studyhub

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload Settings
MAX_FILE_SIZE_MB=10
MAX_IMAGE_SIZE_MB=5
UPLOAD_DIR=uploads

# AWS S3 (אופציונלי - רק לפרודקשן)
USE_S3=False

# Email Settings (אופציונלי - רק אם רוצים לשלוח מיילים)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@studyhub.com

# AI Settings (אופציונלי - רק אם רוצים AI)
OPENAI_API_KEY=
AI_MODEL=gpt-4
MAX_QUESTIONS_PER_DAY=50

# Vector Database
CHROMA_PERSIST_DIRECTORY=./chroma_db

# Logging
LOG_LEVEL=INFO
```

---

## שלב 3: וידוא חיבור ל-Database

בדוק שהחיבור עובד:

```bash
# התקן את התלויות אם עוד לא
pip install psycopg2-binary

# נסה להתחבר
python -c "from sqlalchemy import create_engine; engine = create_engine('postgresql://studyhub:studyhub123@localhost:5432/studyhub'); conn = engine.connect(); print('✅ Connection successful!'); conn.close()"
```

---

## שלב 4: וידוא שכל המודלים נטענים

```bash
cd backend
python -c "from app.models import *; print('✅ All models imported successfully!')"
```

---

## שלב 5: בדיקת Alembic

```bash
# בדוק את התצורה של Alembic
alembic current

# צריך להציג: (head) (אם אין migrations)
# או את הגרסה הנוכחית
```

---

## שלב 6: יצירת Migration ראשון

```bash
# צור migration אוטומטי מכל המודלים
alembic revision --autogenerate -m "Initial migration with all models"

# זה יוצר קובץ חדש ב-alembic/versions/
```

---

## שלב 7: הרצת Migrations

```bash
# הרץ את כל ה-migrations
alembic upgrade head
```

אם הכל עבד, תראה:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, Initial migration with all models
```

---

## שלב 8: וידוא שהטבלאות נוצרו

```bash
# התחבר ל-database
psql -U studyhub -d studyhub

# הצג את כל הטבלאות
\dt

# צריך לראות:
# - users
# - courses
# - user_courses
# - materials
# - ratings
# - discussions
# - comments
# - messages
# - notifications
# - alembic_version
```

או דרך Python:
```bash
python -c "
from app.db.session import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print('📋 Tables created:')
for table in sorted(tables):
    print(f'  ✅ {table}')
"
```

---

## שלב 9: הרצת השרת

```bash
# הרץ את השרת
uvicorn main:app --reload

# צריך לראות:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

## שלב 10: בדיקת ה-API

פתח דפדפן וגש ל:
```
http://localhost:8000/docs
```

אמור לראות את כל ה-endpoints ב-Swagger UI!

---

## בעיות נפוצות ופתרונות

### שגיאה: "could not connect to server"
```bash
# ודא שה-PostgreSQL רץ
# Windows:
services.msc  # חפש PostgreSQL

# או דרך CMD:
pg_ctl status
```

### שגיאה: "password authentication failed"
- בדוק שהסיסמה נכונה ב-.env
- ודא שהמשתמש קיים ב-PostgreSQL

### שגיאה: "database does not exist"
```bash
# צור את ה-database:
psql -U postgres -c "CREATE DATABASE studyhub;"
```

### שגיאה: "relation already exists"
```bash
# אם הטבלאות כבר קיימות ורוצה להתחיל מחדש:

# אופציה 1: מחק את כל הטבלאות
psql -U studyhub -d studyhub -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# אופציה 2: מחק את ה-database ותתחיל מחדש
psql -U postgres -c "DROP DATABASE studyhub;"
psql -U postgres -c "CREATE DATABASE studyhub;"

# ואז הרץ שוב את ה-migrations
alembic upgrade head
```

### שגיאה: "No module named 'app'"
```bash
# ודא שאתה בתיקיית backend
cd backend

# ושה-PYTHONPATH מוגדר נכון
export PYTHONPATH="${PYTHONPATH}:$(pwd)"  # Linux/Mac
set PYTHONPATH=%PYTHONPATH%;%cd%  # Windows CMD
$env:PYTHONPATH += ";$(pwd)"  # Windows PowerShell
```

---

## בדיקה מהירה - סקריפט אוטומטי

צור קובץ `check_db.py`:

```python
"""Quick database check script."""
from app.db.session import engine
from sqlalchemy import inspect, text

def check_database():
    """Check database connection and tables."""
    try:
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL")
            print(f"   Version: {version[:50]}...")

        # Check tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        expected_tables = [
            'users', 'courses', 'user_courses', 'materials',
            'ratings', 'discussions', 'comments', 'messages',
            'notifications', 'alembic_version'
        ]

        print(f"\n📋 Database Tables ({len(tables)} found):")
        for table in sorted(tables):
            status = "✅" if table in expected_tables else "⚠️"
            print(f"   {status} {table}")

        missing = set(expected_tables) - set(tables)
        if missing:
            print(f"\n❌ Missing tables: {', '.join(missing)}")
            print("   Run: alembic upgrade head")
        else:
            print(f"\n✅ All expected tables exist!")

        return True

    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    check_database()
```

הרץ:
```bash
python check_db.py
```

---

## סיכום תהליך ההתקנה

```bash
# 1. צור database
psql -U postgres -c "CREATE DATABASE studyhub;"

# 2. העתק והתאם .env
cp .env.example .env
# ערוך את DATABASE_URL ב-.env

# 3. צור migration
alembic revision --autogenerate -m "Initial migration"

# 4. הרץ migrations
alembic upgrade head

# 5. בדוק
python check_db.py

# 6. הרץ שרת
uvicorn main:app --reload

# 7. גש ל-docs
# http://localhost:8000/docs
```

---

## מידע נוסף

### Connection String Format:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### דוגמאות:
```
# Local with default postgres user
postgresql://postgres:mypassword@localhost:5432/studyhub

# Local with custom user
postgresql://studyhub:studyhub123@localhost:5432/studyhub

# Remote server
postgresql://user:pass@192.168.1.100:5432/studyhub

# With special characters in password (URL encode)
postgresql://user:p%40ssw%23rd@localhost:5432/studyhub
```

---

בהצלחה! 🚀
