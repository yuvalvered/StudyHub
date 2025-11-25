# Courses API Implementation

## מה מומש

### 1. מודלים (Models)
- ✅ **Course Model** - מודל הקורס עם כל השדות הנדרשים
- ✅ **User-Course Association** - טבלת ביניים להרשמה לקורסים (many-to-many)
- ✅ **Relationships** - קשרים מלאים בין User, Course, Material, Discussion

### 2. Schemas (Pydantic)
- ✅ `CourseBase` - סכמה בסיסית
- ✅ `CourseCreate` - יצירת קורס חדש
- ✅ `CourseUpdate` - עדכון קורס
- ✅ `CourseResponse` - תגובה בסיסית
- ✅ `CourseWithStats` - תגובה עם סטטיסטיקות
- ✅ `EnrolledUserInfo` - מידע על משתמשים רשומים
- ✅ `CourseEnrollmentResponse` - תגובה להרשמה/ביטול הרשמה

### 3. Service Layer
- ✅ `create_course` - יצירת קורס חדש
- ✅ `get_courses` - קבלת רשימת קורסים עם סינון וחיפוש
- ✅ `get_course_by_id` - קבלת קורס לפי ID
- ✅ `get_course_by_number` - קבלת קורס לפי מספר קורס
- ✅ `update_course` - עדכון קורס
- ✅ `delete_course` - מחיקת קורס
- ✅ `enroll_user_in_course` - הרשמה לקורס
- ✅ `unenroll_user_from_course` - ביטול הרשמה לקורס
- ✅ `get_enrolled_users` - קבלת רשימת משתמשים רשומים
- ✅ `get_course_statistics` - סטטיסטיקות קורס (חומרים, דיונים, משתמשים)
- ✅ `get_user_courses` - קבלת כל הקורסים של משתמש
- ✅ `is_user_enrolled` - בדיקה האם משתמש רשום לקורס

### 4. API Routes
#### CRUD Operations
- ✅ `POST /courses` - יצירת קורס
- ✅ `GET /courses` - רשימת קורסים (עם חיפוש וסינון)
- ✅ `GET /courses/{course_id}` - קורס ספציפי
- ✅ `GET /courses/number/{course_number}` - קורס לפי מספר
- ✅ `PUT /courses/{course_id}` - עדכון קורס
- ✅ `DELETE /courses/{course_id}` - מחיקת קורס

#### Enrollment Operations
- ✅ `POST /courses/{course_id}/enroll` - הרשמה לקורס
- ✅ `DELETE /courses/{course_id}/enroll` - ביטול הרשמה
- ✅ `GET /courses/{course_id}/enrolled-users` - רשימת משתמשים רשומים
- ✅ `GET /courses/{course_id}/is-enrolled` - בדיקת סטטוס הרשמה

#### Statistics Operations
- ✅ `GET /courses/{course_id}/statistics` - סטטיסטיקות קורס

#### User Operations
- ✅ `GET /courses/user/my-courses` - הקורסים שלי

## תכונות מיוחדות

### 1. חיפוש מתקדם
```python
# חיפוש לפי שם או מספר קורס
GET /courses?search=intro

# סינון לפי מחלקה
GET /courses?department=Computer Science

# שילוב של חיפוש וסינון
GET /courses?department=CS&search=101&skip=0&limit=10
```

### 2. Pagination
כל ה-endpoints שמחזירים רשימות תומכים ב-pagination:
```python
skip=0  # מתחיל מרשומה 0
limit=100  # מחזיר עד 100 רשומות
```

### 3. סטטיסטיקות בזמן אמת
```python
GET /courses/1/statistics

# מחזיר:
{
  "materials_count": 25,
  "discussions_count": 12,
  "enrolled_users_count": 150
}
```

### 4. מערכת הרשמה מתקדמת
- בדיקת הרשמה כפולה
- מניעת הרשמה לקורס קיים
- שמירת תאריך הרשמה
- קל לביטול הרשמה

## כיצד להתחיל

### 1. הרצת השרת
```bash
cd backend
uvicorn main:app --reload
```

### 2. גישה לתיעוד אוטומטי
```
http://localhost:8000/docs
```

### 3. דוגמאות שימוש

#### יצירת קורס
```bash
curl -X POST "http://localhost:8000/api/v1/courses" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_number": "CS101",
    "course_name": "מבוא למדעי המחשב",
    "department": "מדעי המחשב",
    "description": "קורס מבוא בסיסי"
  }'
```

#### חיפוש קורסים
```bash
curl -X GET "http://localhost:8000/api/v1/courses?search=מבוא&limit=10"
```

#### הרשמה לקורס
```bash
curl -X POST "http://localhost:8000/api/v1/courses/1/enroll" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### קבלת הקורסים שלי
```bash
curl -X GET "http://localhost:8000/api/v1/courses/user/my-courses" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Migration

לאחר יצירת המודלים החדשים, יש להריץ migration:

```bash
# אם משתמשים ב-Alembic
alembic revision --autogenerate -m "Add user_courses association table"
alembic upgrade head
```

## מבנה קבצים

```
backend/
├── app/
│   ├── models/
│   │   ├── course.py          # מודל הקורס
│   │   ├── user_course.py     # טבלת ביניים
│   │   └── user.py            # מודל המשתמש (עודכן)
│   ├── schemas/
│   │   └── course.py          # Pydantic schemas
│   ├── services/
│   │   └── course_service.py  # Business logic
│   └── routes/
│       └── courses.py         # API endpoints
├── docs/
│   └── COURSES_API.md         # תיעוד מפורט
└── README_COURSES.md          # קובץ זה
```

## עקרונות עיצוב

### 1. Separation of Concerns
- **Models**: הגדרת טבלאות Database
- **Schemas**: Validation ו-Serialization
- **Services**: Business Logic
- **Routes**: HTTP Layer

### 2. Error Handling
כל ה-endpoints מטפלים בשגיאות נפוצות:
- 400 Bad Request - קלט לא תקין
- 401 Unauthorized - חסר אימות
- 404 Not Found - קורס לא נמצא
- 500 Internal Server Error - שגיאת שרת

### 3. Security
- Authentication נדרש ליצירה/עדכון/מחיקה
- JWT tokens ב-Authorization header
- Cascade delete למניעת orphan records

### 4. Performance
- Indexed fields (course_number, id)
- Efficient queries עם joins
- Pagination למניעת overload

## התאמה לדרישות

הממשנו את הדרישות הבאות:

### דרישה 2.2 - חיפוש וגישה לחומרים
✅ 2.2.1 - מנוע חיפוש מתקדם לפי שם ומספר קורס
✅ 2.2.4 - בסיס להמלצות (רשימת קורסים של המשתמש)

### דרישה 1.2.1 - פרופיל אישי
✅ רשימת קורסים שהמשתמש רשום אליהם

### דרישה 3.1 - מציאת שותפי לימוד
✅ רשימת משתמשים רשומים לכל קורס

## בעיות ידועות ופתרונות

### בעיה: Import של user_courses
**פתרון**: ודא ש-`user_courses` מיובא ב-`__init__.py` של models

### בעיה: Circular imports
**פתרון**: השתמשנו ב-string references (`"User"`, `"Course"`) ב-relationships

### בעיה: Migration errors
**פתרון**: ודא שכל המודלים מיובאים לפני הרצת Alembic

## מה הלאה?

רעיונות לשיפורים עתידיים:
- [ ] Role-based access control (admin בלבד ליצירת קורסים)
- [ ] Course categories/tags
- [ ] Course prerequisites
- [ ] Course ratings by students
- [ ] Semester/year organization
- [ ] Course capacity limits
- [ ] Waitlist functionality

## שאלות נפוצות

**ש: איך אני יוצר קורס?**
ת: שלח POST request ל-`/api/v1/courses` עם token authentication.

**ש: איך אני רואה את הקורסים שלי?**
ת: GET request ל-`/api/v1/courses/user/my-courses` עם authentication.

**ש: מה קורה כשמוחקים קורס?**
ת: כל החומרים והדיונים הקשורים נמחקים אוטומטית (cascade delete).

**ש: אפשר להירשם לאותו קורס פעמיים?**
ת: לא, המערכת מונעת הרשמה כפולה ותחזיר שגיאה 400.

## תמיכה

לבעיות או שאלות, פנה ל-[GitHub Issues](https://github.com/your-repo/issues)
