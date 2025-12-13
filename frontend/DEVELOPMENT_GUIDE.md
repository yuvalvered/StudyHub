# מדריך פיתוח - StudyHub Frontend

## 📋 סקירה כללית

המסמך הזה מסביר איך לפתח את הפרונטאנד של StudyHub צעד אחר צעד.

---

## 🎨 עמוד ההתחברות - מה בנינו

### קומפוננטות שנוצרו:

1. **[Logo.tsx](components/Logo.tsx)** - לוגו של האפליקציה
   - תומך בשלושה גדלים: sm, md, lg
   - כולל אייקון ספר וטקסט "StudyHub"
   - נמצא בפינה הימנית העליונה בכל עמוד

2. **[page.tsx](app/page.tsx)** - עמוד ההתחברות
   - שדה שם משתמש
   - שדה סיסמה
   - כפתור התחברות
   - קישור "שכחתי סיסמה"
   - קישור "יצירת משתמש חדש"
   - עיצוב נקי בגווני כחול
   - תמיכה מלאה בעברית (RTL)

### איך זה עובד:

```typescript
// מצב הטופס נשמר ב-state
const [username, setUsername] = useState('')
const [password, setPassword] = useState('')

// פונקציה שמטפלת בשליחת הטופס
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  // כאן תתחבר ל-backend
}
```

---

## 🏗️ מבנה הפרויקט

```
frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # דף ההתחברות (/)-הוא הדף הראשי
│   ├── layout.tsx           # Layout כללי עם RTL
│   └── globals.css          # סגנונות גלובליים
│
├── components/              # קומפוננטות לשימוש חוזר
│   └── Logo.tsx            # קומפוננטת הלוגו
│
├── public/                 # קבצים סטטיים (תמונות, פונטים וכו')
│
├── styles/                # סגנונות נוספים (אם נצטרך)
│
├── tailwind.config.js    # הגדרות Tailwind + צבעים
├── tsconfig.json         # הגדרות TypeScript
├── next.config.js        # הגדרות Next.js
└── package.json         # תלויות ו-scripts
```

---

## 🎨 צבעים וערכת העיצוב

### צבעים עיקריים (מוגדרים ב-tailwind.config.js):

```javascript
colors: {
  primary: {
    500: '#3b82f6',  // כחול עיקרי
    600: '#2563eb',  // כחול כהה יותר (hover)
    // ... גוונים נוספים
  },
  secondary: {
    // גוני אפור לטקסטים ורקעים
  }
}
```

### שימוש בצבעים:

```tsx
// רקע כחול
<div className="bg-primary-500">

// טקסט כחול
<span className="text-primary-600">

// כפתור כחול (class מוכן)
<button className="btn-primary">
```

---

## 🧩 איך ליצור קומפוננטה חדשה

### שלב 1: צור קובץ חדש

```bash
frontend/components/YourComponent.tsx
```

### שלב 2: כתוב את הקומפוננטה

```typescript
/**
 * תיאור הקומפוננטה בעברית
 * מה היא עושה ואיך משתמשים בה
 */
interface YourComponentProps {
  // הגדר props כאן
  title: string
  onClick?: () => void
}

export default function YourComponent({ title, onClick }: YourComponentProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {onClick && <button onClick={onClick} className="btn-primary">לחץ כאן</button>}
    </div>
  )
}
```

### שלב 3: ייבא אותה לעמוד

```typescript
import YourComponent from '@/components/YourComponent'

export default function SomePage() {
  return <YourComponent title="כותרת" />
}
```

---

## 📄 איך ליצור עמוד חדש

### Next.js App Router - שיטת העבודה:

1. **עמוד פשוט:**
   ```
   app/about/page.tsx  →  /about
   ```

2. **עמוד מקונן:**
   ```
   app/courses/[id]/page.tsx  →  /courses/123
   ```

### דוגמה - עמוד "אודות":

```typescript
// app/about/page.tsx

export default function AboutPage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">אודות StudyHub</h1>
      <p className="mt-4">פלטפורמה לשיתוף חומרי לימוד...</p>
    </div>
  )
}
```

הדף יהיה זמין ב: `http://localhost:3000/about`

---

## 🎯 איך לחבר ל-Backend

### 1. מצא את הפונקציה המתאימה

לדוגמה, בעמוד ההתחברות:

```typescript
// app/page.tsx - שורה ~30
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()

  // כאן תוסיף את הקריאה ל-API
}
```

### 2. הוסף את הקריאה ל-API

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError('')

  try {
    // שלח בקשה ל-backend
    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })

    // בדוק אם הבקשה הצליחה
    if (!response.ok) {
      throw new Error('שם משתמש או סיסמה שגויים')
    }

    // קבל את התשובה
    const data = await response.json()

    // שמור את ה-token (אם יש)
    localStorage.setItem('token', data.token)

    // נווט לדף הבית
    window.location.href = '/dashboard'

  } catch (err) {
    setError(err.message || 'שגיאה בהתחברות')
  } finally {
    setIsLoading(false)
  }
}
```

### 3. הגדר משתני סביבה (אופציונלי)

צור קובץ: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

שימוש:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL

fetch(`${API_URL}/api/auth/login`, ...)
```

---

## 🎨 Classes מוכנות לשימוש

הגדרנו classes מוכנות ב-`globals.css`:

### כפתורים:
```tsx
<button className="btn-primary">כפתור ראשי</button>
<button className="btn-secondary">כפתור משני</button>
```

### שדות קלט:
```tsx
<input className="input-field" type="text" />
```

### כרטיס (Card):
```tsx
<div className="card">
  {/* תוכן הכרטיס */}
</div>
```

---

## 📱 Responsive Design

Tailwind CSS מאפשר עיצוב רספונסיבי בקלות:

```tsx
<div className="
  w-full           /* רוחב מלא במובייל */
  md:w-1/2         /* חצי רוחב בטאבלט */
  lg:w-1/3         /* שליש רוחב במסך גדול */
">
  תוכן
</div>
```

נקודות שבירה:
- `sm:` - 640px ומעלה
- `md:` - 768px ומעלה
- `lg:` - 1024px ומעלה
- `xl:` - 1280px ומעלה

---

## 🔄 State Management

### Local State (בתוך קומפוננטה):

```typescript
import { useState } from 'react'

export default function MyComponent() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      נלחץ {count} פעמים
    </button>
  )
}
```

### בעתיד - Context API או Zustand:

כאשר נצטרך לשתף state בין קומפוננטות רבות (למשל: פרטי משתמש מחובר).

---

## 🚀 הרצת הפרויקט

### פיתוח:
```bash
cd frontend
npm run dev
```
גלוש ל: http://localhost:3000

### בנייה לפרודקשן:
```bash
npm run build
npm start
```

---

## 📝 צעדים הבאים - מה לבנות?

### 1. עמוד רישום (`/register`)
- טופס עם: שם מלא, שם משתמש, מייל אוניברסיטאי, סיסמה
- ולידציה למייל BGU: `@post.bgu.ac.il`

### 2. עמוד Dashboard (`/dashboard`)
- הצגת הקורסים של הסטודנט
- חיפוש קורסים חדשים
- סטטיסטיקות אישיות

### 3. עמוד קורס (`/courses/[id]`)
- רשימת סיכומים
- רשימת מבחנים
- רשימת תרגילים
- אפשרות להעלות חומר חדש

### 4. קומפוננטות נוספות:
- `Navbar` - תפריט ניווט עליון
- `Sidebar` - תפריט צד
- `CourseCard` - כרטיס קורס
- `FileUpload` - העלאת קבצים
- `SearchBar` - שורת חיפוש
- `Rating` - דירוג כוכבים

---

## 💡 טיפים חשובים

### 1. תמיד הוסף הערות
```typescript
/**
 * פונקציה שעושה X
 * @param param1 - תיאור הפרמטר
 * @returns מה הפונקציה מחזירה
 */
```

### 2. שמות משתנים בעברית בהערות
```typescript
// שמור את פרטי המשתמש
const [userDetails, setUserDetails] = useState(null)
```

### 3. השתמש ב-TypeScript
```typescript
// טוב ✓
interface User {
  id: number
  name: string
}

// רע ✗
const user: any = {}
```

### 4. ארגן קוד לקומפוננטות קטנות
במקום קומפוננטה ענקית אחת, פצל למספר קומפוננטות קטנות.

---

## 🐛 פתרון בעיות נפוצות

### שגיאת קומפילציה:
```bash
# נקה את ה-cache ותתקין מחדש
rm -rf .next node_modules
npm install
npm run dev
```

### Tailwind לא עובד:
בדוק ש-`globals.css` מיובא ב-`app/layout.tsx`

### RTL לא עובד:
בדוק ב-`app/layout.tsx` שיש `dir="rtl"`

---

## 📚 משאבים נוספים

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [React](https://react.dev/)

---

**בהצלחה בפיתוח! 🚀**
