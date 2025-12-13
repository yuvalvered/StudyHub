# מדריך להקמת מסד נתונים - StudyHub

## דרישות מקדימות

לפני שמתחילים, יש לוודא שמותקנים:
1. **Python 3.10+** - [הורדה](https://www.python.org/downloads/)
2. **PostgreSQL 14+** - [הורדה](https://www.postgresql.org/download/)
3. **Git** - [הורדה](https://git-scm.com/downloads/)

---

## שלב 1: התקנת PostgreSQL

### Windows:
1. הורידו והתקינו PostgreSQL מהאתר הרשמי
2. במהלך ההתקנה, זכרו את הסיסמה ש-PostgreSQL מבקש (נשתמש בה בהמשך)
3. ודאו ש-PostgreSQL מותקן ורץ:
   - פתחו `pgAdmin` (הותקן יחד עם PostgreSQL)
   - או בטרמינל: `psql --version`

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Mac (עם Homebrew)
brew install postgresql
brew services start postgresql
```

---

## שלב 2: יצירת מסד הנתונים והמשתמש

### דרך 1: דרך pgAdmin (מומלץ למתחילים)
1. פתחו `pgAdmin`
2. התחברו לשרת המקומי (localhost)
3. לחצו ימין על `Databases` → `Create` → `Database`
   - **Database name**: `studyhub`
   - לחצו `Save`
4. ליצירת משתמש:
   - לחצו ימין על `Login/Group Roles` → `Create` → `Login/Group Role`
   - **Name**: `studyhub`
   - לכו לטאב `Definition` ותגדירו **Password**: `studyhub123`
   - לכו לטאב `Privileges` וסמנו את כל האפשרויות
   - לחצו `Save`
5. תנו הרשאות למשתמש על מסד הנתונים:
   - לחצו ימין על `studyhub` database → `Properties`
   - לכו לטאב `Security`
   - לחצו על `+` והוסיפו את המשתמש `studyhub` עם הרשאת `ALL`

### דרך 2: דרך שורת הפקודה (מהיר יותר)
```bash
# התחברו ל-PostgreSQL כמשתמש postgres
psql -U postgres

# הרצת הפקודות הבאות בתוך psql:
CREATE DATABASE studyhub;
CREATE USER studyhub WITH PASSWORD 'studyhub123';
GRANT ALL PRIVILEGES ON DATABASE studyhub TO studyhub;

# צאו מ-psql
\q
```

### אימות שהכל עובד:
```bash
psql -U studyhub -d studyhub -h localhost
# אם מבקש סיסמה, הזינו: studyhub123
# אם התחברתם בהצלחה, תראו את ההודעה: studyhub=>
# צאו עם \q
```

---

## שלב 3: שכפול הפרויקט

```bash
# שכפלו את הפרויקט (אם עדיין לא עשיתם)
git clone <repository-url>
cd StudyHub
```

---

## שלב 4: הגדרת סביבת Python

### Windows:
```bash
# נווטו לתיקיית backend
cd backend

# צרו סביבה וירטואלית
python -m venv venv

# הפעילו את הסביבה
venv\Scripts\activate

# התקינו את התלויות
pip install -r requirements.txt
```

### Linux/Mac:
```bash
# נווטו לתיקיית backend
cd backend

# צרו סביבה וירטואלית
python3 -m venv venv

# הפעילו את הסביבה
source venv/bin/activate

# התקינו את התלויות
pip install -r requirements.txt
```

---

## שלב 5: הגדרת קובץ הסביבה (.env)

1. העתיקו את קובץ הדוגמה:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

2. ערכו את קובץ `.env` ועדכנו את השורות הבאות:

```env
# Application Settings
APP_NAME=StudyHub
APP_VERSION=1.0.0
DEBUG=True

# Security (חשוב! שנו את המפתח לייצור)
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database - עדכנו את השורה הזו!
DATABASE_URL=postgresql://studyhub:studyhub123@localhost:5432/studyhub

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload Settings
MAX_FILE_SIZE_MB=10
MAX_IMAGE_SIZE_MB=5
UPLOAD_DIR=uploads

# Email Settings (אופציונלי - רק אם רוצים לבדוק שליחת מיילים)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@studyhub.com
EMAIL_FROM_NAME=StudyHub

# AI Settings (אופציונלי - רק אם רוצים לבדוק AI)
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4

# Vector Database
CHROMA_PERSIST_DIRECTORY=./chroma_db
```

**הערות חשובות:**
- אם השתמשתם במשתמש/סיסמה שונים ב-PostgreSQL, עדכנו את `DATABASE_URL`
- הפורמט הוא: `postgresql://username:password@localhost:5432/database_name`
- עבור פיתוח לא צריך לשנות את `SECRET_KEY`, אבל לייצור כן!

---

## שלב 6: הרצת Migrations - יצירת הטבלאות במסד הנתונים

### מה זה Migrations?
Migrations הם קבצים שמגדירים את מבנה מסד הנתונים (טבלאות, עמודות, קשרים). אנחנו משתמשים ב-Alembic לניהול שינויים במסד הנתונים.

### הרצת ה-Migrations:

```bash
# ודאו שאתם בתיקיית backend עם הסביבה הוירטואלית פעילה
# (אמור להיות (venv) בתחילת השורה)

# Windows
.\venv\Scripts\alembic.exe upgrade head

# Linux/Mac
alembic upgrade head
```

**מה צריך לקרות:**
תראו פלט כזה:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 9959757709ec, initial_tables
INFO  [alembic.runtime.migration] Running upgrade 9959757709ec -> 366f6842dc9c, initial_migration_create_all_tables
INFO  [alembic.runtime.migration] Running upgrade 366f6842dc9c -> 03699aa00a08, add_email_verification_fields
INFO  [alembic.runtime.migration] Running upgrade 03699aa00a08 -> c71643c1030d, add_password_reset_fields
```

### בדיקה שהטבלאות נוצרו:

#### דרך pgAdmin:
1. פתחו pgAdmin
2. נווטו: `Servers` → `PostgreSQL` → `Databases` → `studyhub` → `Schemas` → `public` → `Tables`
3. צריכות להיות הטבלאות הבאות:
   - `users`
   - `courses`
   - `materials`
   - `ratings`
   - `discussions`
   - `comments`
   - `messages`
   - `notifications`
   - `alembic_version`

#### דרך שורת הפקודה:
```bash
psql -U studyhub -d studyhub -h localhost
# בתוך psql:
\dt
# צריכות להופיע כל הטבלאות
\q
```

---

## שלב 7: הרצת השרת

```bash
# ודאו שאתם בתיקיית backend עם הסביבה הוירטואלית פעילה

# Windows
python main.py

# Linux/Mac
python3 main.py
```

**מה צריך לקרות:**
```
INFO:     Will watch for changes in these directories: ['C:\\...\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX] using WatchFiles
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## שלב 8: בדיקה שהכל עובד

### 1. בדיקה בדפדפן:
פתחו בדפדפן: [http://localhost:8000](http://localhost:8000)

צריכים לראות:
```json
{
  "message": "Welcome to StudyHub API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

### 2. בדיקת התיעוד האוטומטי (Swagger):
פתחו: [http://localhost:8000/docs](http://localhost:8000/docs)

תראו ממשק אינטראקטיבי עם כל ה-endpoints של ה-API.

### 3. בדיקת הרשמה ולוגין:

#### דרך Swagger UI (מומלץ):
1. גשו ל-[http://localhost:8000/docs](http://localhost:8000/docs)
2. פתחו את `POST /api/v1/auth/register`
3. לחצו `Try it out`
4. הזינו:
```json
{
  "email": "test@post.bgu.ac.il",
  "password": "Test123!",
  "full_name": "Test User",
  "student_id": "123456789",
  "department": "Computer Science",
  "year": 3
}
```
5. לחצו `Execute`
6. אם הכל עבד, תקבלו סטטוס 200 עם פרטי המשתמש

#### דרך curl (Terminal):
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@post.bgu.ac.il",
    "password": "Test123!",
    "full_name": "Test User",
    "student_id": "123456789",
    "department": "Computer Science",
    "year": 3
  }'
```

#### בדיקה במסד הנתונים:
```bash
psql -U studyhub -d studyhub -h localhost

# בתוך psql:
SELECT id, email, full_name, created_at FROM users;
# צריכים לראות את המשתמש שנרשם

\q
```

---

## בעיות נפוצות ופתרונות

### 1. שגיאה: "could not connect to server"
**בעיה:** PostgreSQL לא רץ.
**פתרון:**
- Windows: פתחו `Services` וודאו ש-`postgresql-x64-14` רץ
- Linux: `sudo systemctl start postgresql`
- Mac: `brew services start postgresql`

### 2. שגיאה: "password authentication failed"
**בעיה:** סיסמה שגויה ב-DATABASE_URL.
**פתרון:**
- ודאו שה-DATABASE_URL בקובץ `.env` תואם למשתמש והסיסמה שיצרתם
- נסו לאפס את סיסמת המשתמש:
```sql
psql -U postgres
ALTER USER studyhub WITH PASSWORD 'studyhub123';
\q
```

### 3. שגיאה: "database does not exist"
**בעיה:** מסד הנתונים לא נוצר.
**פתרון:**
```bash
psql -U postgres
CREATE DATABASE studyhub;
\q
```

### 4. שגיאה: "No module named 'app'"
**בעיה:** לא בתיקייה הנכונה או סביבה וירטואלית לא מופעלת.
**פתרון:**
- ודאו שאתם בתיקיית `backend`
- ודאו שהסביבה הוירטואלית מופעלת (יש `(venv)` בתחילת השורה)

### 5. שגיאה: "DETAIL: Role 'studyhub' does not exist"
**בעיה:** משתמש לא נוצר.
**פתרון:**
```bash
psql -U postgres
CREATE USER studyhub WITH PASSWORD 'studyhub123';
GRANT ALL PRIVILEGES ON DATABASE studyhub TO studyhub;
\q
```

### 6. שגיאה: "email must be a post.bgu.ac.il email"
**בעיה:** הקוד מאפשר רק כתובות מייל מבנות-גוריון.
**פתרון:** השתמשו במייל עם סיומת `@post.bgu.ac.il`

### 7. Port 8000 תפוס
**בעיה:** תהליך אחר משתמש בפורט 8000.
**פתרון:**
- Windows: `netstat -ano | findstr :8000` ואז `taskkill /PID <process_id> /F`
- Linux/Mac: `lsof -ti:8000 | xargs kill -9`
- או שנו את הפורט ב-`main.py` שורה 75

---

## בדיקה מתקדמת - נסו את כל ה-endpoints

### 1. הרשמה:
```bash
POST http://localhost:8000/api/v1/auth/register
```

### 2. התחברות:
```bash
POST http://localhost:8000/api/v1/auth/login
```

### 3. קבלת פרטי משתמש:
```bash
GET http://localhost:8000/api/v1/users/me
# צריך לשלוח את ה-token בהדר Authorization
```

### 4. יצירת קורס:
```bash
POST http://localhost:8000/api/v1/courses
```

### 5. קבלת רשימת קורסים:
```bash
GET http://localhost:8000/api/v1/courses
```

---

## סיכום - Checklist

✅ PostgreSQL מותקן ורץ
✅ מסד נתונים `studyhub` נוצר
✅ משתמש `studyhub` נוצר עם סיסמה `studyhub123`
✅ Python 3.10+ מותקן
✅ סביבה וירטואלית נוצרה והופעלה
✅ כל התלויות מ-requirements.txt הותקנו
✅ קובץ `.env` נוצר ומוגדר נכון
✅ Migrations הורצו בהצלחה
✅ השרת עולה על http://localhost:8000
✅ ניתן להירשם ולהתחבר

---

## צרו איתי קשר

אם נתקלתם בבעיה שלא מופיעה במדריך, נסו:
1. לבדוק את הלוגים של השרת
2. לבדוק את הלוגים של PostgreSQL
3. לוודא שכל התלויות מותקנות: `pip list`
4. להריץ מחדש את PostgreSQL והשרת

בהצלחה! 🚀
