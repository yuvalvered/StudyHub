"""
Quick Setup Script for StudyHub Database
Automates the database setup process.
"""
import os
import sys
import subprocess
from pathlib import Path


def print_step(step_num: int, text: str):
    """Print a formatted step."""
    print(f"\n{'='*70}")
    print(f"📌 שלב {step_num}: {text}")
    print(f"{'='*70}")


def run_command(cmd: str, description: str) -> bool:
    """Run a shell command and return success status."""
    print(f"\n🔄 {description}...")
    print(f"   Command: {cmd}")

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )

        if result.returncode == 0:
            print(f"   ✅ הצליח!")
            if result.stdout.strip():
                print(f"\n   Output:")
                for line in result.stdout.strip().split('\n'):
                    print(f"      {line}")
            return True
        else:
            print(f"   ❌ נכשל!")
            if result.stderr.strip():
                print(f"   Error:")
                for line in result.stderr.strip().split('\n'):
                    print(f"      {line}")
            return False

    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False


def check_env_file() -> bool:
    """Check if .env file exists."""
    env_path = Path(".env")

    if env_path.exists():
        print("✅ קובץ .env קיים")
        return True
    else:
        print("❌ קובץ .env לא נמצא")
        print("\n💡 צור קובץ .env:")
        print("   1. העתק את .env.example ל-.env")
        print("   2. ערוך את DATABASE_URL")
        return False


def check_postgres_connection() -> bool:
    """Check if PostgreSQL is accessible."""
    print("\n🔍 בודק חיבור ל-PostgreSQL...")

    try:
        from sqlalchemy import create_engine, text
        from app.core.config import settings

        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        print("   ✅ החיבור ל-PostgreSQL תקין!")
        return True

    except Exception as e:
        print(f"   ❌ לא ניתן להתחבר ל-PostgreSQL")
        print(f"   Error: {e}")
        print("\n💡 וודא ש:")
        print("   • PostgreSQL רץ")
        print("   • ה-database קיים")
        print("   • פרטי ההתחברות ב-.env נכונים")
        return False


def main():
    """Main setup flow."""
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║          StudyHub - Quick Database Setup                       ║
    ║                                                                 ║
    ║  סקריפט אוטומטי להקמת ה-Database                              ║
    ╚════════════════════════════════════════════════════════════════╝
    """)

    # Step 1: Check .env file
    print_step(1, "בדיקת קובץ .env")
    if not check_env_file():
        print("\n⚠️  תחילה צור קובץ .env ואז הרץ שוב סקריפט זה")
        return 1

    # Step 2: Check PostgreSQL connection
    print_step(2, "בדיקת חיבור ל-PostgreSQL")
    if not check_postgres_connection():
        print("\n⚠️  תקן את החיבור ל-PostgreSQL ואז הרץ שוב")
        return 1

    # Step 3: Check if migrations exist
    print_step(3, "בדיקת Migrations")

    versions_dir = Path("alembic/versions")
    migration_files = list(versions_dir.glob("*.py")) if versions_dir.exists() else []
    migration_files = [f for f in migration_files if f.name != "__init__.py"]

    if not migration_files:
        print("📝 לא נמצאו migrations קיימים")
        print("\n🔄 יוצר migration ראשוני...")

        success = run_command(
            "alembic revision --autogenerate -m \"Initial migration with all models\"",
            "יצירת migration אוטומטי"
        )

        if not success:
            print("\n❌ יצירת migration נכשלה")
            return 1
    else:
        print(f"✅ נמצאו {len(migration_files)} migration files")

    # Step 4: Run migrations
    print_step(4, "הרצת Migrations")

    success = run_command(
        "alembic upgrade head",
        "מריץ את כל ה-migrations"
    )

    if not success:
        print("\n❌ הרצת migrations נכשלה")
        return 1

    # Step 5: Verify setup
    print_step(5, "אימות התקנה")

    success = run_command(
        "python check_db.py",
        "בודק את ה-database"
    )

    # Final summary
    print("\n" + "="*70)
    print("📊 סיכום")
    print("="*70)

    if success:
        print("\n🎉 ההתקנה הושלמה בהצלחה!")
        print("\n🚀 צעדים הבאים:")
        print("   1. הרץ את השרת:")
        print("      uvicorn main:app --reload")
        print("\n   2. גש לתיעוד:")
        print("      http://localhost:8000/docs")
        print("\n   3. בדוק את ה-Courses API:")
        print("      GET http://localhost:8000/api/v1/courses")
        return 0
    else:
        print("\n⚠️  ההתקנה לא הושלמה במלואה")
        print("\nעיין בשגיאות למעלה ונסה שוב")
        return 1


if __name__ == "__main__":
    # Change to script directory
    os.chdir(Path(__file__).parent)

    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  הופסק על ידי המשתמש")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ שגיאה לא צפויה: {e}")
        sys.exit(1)
