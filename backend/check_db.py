"""
Database Connection and Setup Checker
Verify database connection and table creation.
"""
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import inspect, text
from app.db.session import engine
from app.core.config import settings


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}")


def check_connection():
    """Check if we can connect to the database."""
    print_header("🔌 Database Connection Check")

    try:
        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]

            print("✅ Successfully connected to PostgreSQL!")
            print(f"\n📊 Database Info:")
            print(f"   Version: {version.split(',')[0]}")

            # Get current database name
            result = conn.execute(text("SELECT current_database();"))
            db_name = result.fetchone()[0]
            print(f"   Database: {db_name}")

            # Get current user
            result = conn.execute(text("SELECT current_user;"))
            user = result.fetchone()[0]
            print(f"   User: {user}")

            return True

    except Exception as e:
        print(f"❌ Connection failed!")
        print(f"   Error: {str(e)}")
        print(f"\n💡 Check your .env file:")
        print(f"   DATABASE_URL={settings.DATABASE_URL}")
        return False


def check_tables():
    """Check which tables exist in the database."""
    print_header("📋 Database Tables Check")

    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        # Expected tables from our models
        expected_tables = {
            'users': 'User accounts and profiles',
            'courses': 'Course information',
            'user_courses': 'User-Course enrollment (many-to-many)',
            'materials': 'Study materials and files',
            'ratings': 'Material ratings',
            'discussions': 'Course discussions',
            'comments': 'Discussion comments',
            'messages': 'User messages',
            'notifications': 'User notifications',
            'alembic_version': 'Migration version tracking'
        }

        print(f"\n📊 Found {len(tables)} tables in database:")

        if not tables:
            print("   ⚠️  No tables found!")
            print("\n💡 You need to run migrations:")
            print("   alembic upgrade head")
            return False

        # Check each expected table
        all_exist = True
        for table, description in expected_tables.items():
            if table in tables:
                print(f"   ✅ {table:<20} - {description}")
            else:
                print(f"   ❌ {table:<20} - Missing!")
                all_exist = False

        # Show unexpected tables
        unexpected = set(tables) - set(expected_tables.keys())
        if unexpected:
            print(f"\n⚠️  Unexpected tables found:")
            for table in unexpected:
                print(f"   • {table}")

        # Show missing tables
        missing = set(expected_tables.keys()) - set(tables)
        if missing:
            print(f"\n❌ Missing tables:")
            for table in missing:
                print(f"   • {table}")
            print(f"\n💡 Run migrations to create missing tables:")
            print(f"   alembic upgrade head")

        return all_exist

    except Exception as e:
        print(f"❌ Failed to check tables!")
        print(f"   Error: {str(e)}")
        return False


def check_table_structure():
    """Check the structure of key tables."""
    print_header("🔍 Table Structure Check")

    try:
        inspector = inspect(engine)

        # Check user_courses table (our new many-to-many table)
        if 'user_courses' in inspector.get_table_names():
            print("\n✅ user_courses table (Enrollment):")
            columns = inspector.get_columns('user_courses')
            for col in columns:
                print(f"   • {col['name']:<20} {col['type']}")

            # Check foreign keys
            fks = inspector.get_foreign_keys('user_courses')
            if fks:
                print(f"\n   Foreign Keys:")
                for fk in fks:
                    print(f"   • {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")

        # Check courses table
        if 'courses' in inspector.get_table_names():
            print("\n✅ courses table:")
            columns = inspector.get_columns('courses')
            for col in columns:
                print(f"   • {col['name']:<20} {col['type']}")

        return True

    except Exception as e:
        print(f"❌ Failed to check table structure!")
        print(f"   Error: {str(e)}")
        return False


def check_migration_status():
    """Check Alembic migration status."""
    print_header("🔄 Migration Status")

    try:
        with engine.connect() as conn:
            # Check if alembic_version table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'alembic_version'
                );
            """))
            alembic_exists = result.fetchone()[0]

            if not alembic_exists:
                print("⚠️  No migrations have been run yet!")
                print("\n💡 To initialize the database:")
                print("   1. alembic revision --autogenerate -m 'Initial migration'")
                print("   2. alembic upgrade head")
                return False

            # Get current revision
            result = conn.execute(text("SELECT version_num FROM alembic_version;"))
            version = result.fetchone()

            if version:
                print(f"✅ Current migration version: {version[0]}")
                print(f"\n💡 To check for pending migrations:")
                print(f"   alembic current")
            else:
                print("⚠️  Alembic table exists but no version recorded")

            return True

    except Exception as e:
        print(f"❌ Failed to check migration status!")
        print(f"   Error: {str(e)}")
        return False


def get_table_counts():
    """Get row counts for all tables."""
    print_header("📊 Table Row Counts")

    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if not tables:
            print("   No tables found.")
            return

        with engine.connect() as conn:
            for table in sorted(tables):
                if table == 'alembic_version':
                    continue
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table};"))
                    count = result.fetchone()[0]
                    icon = "📝" if count > 0 else "📭"
                    print(f"   {icon} {table:<20} {count:>6} rows")
                except Exception as e:
                    print(f"   ❌ {table:<20} Error: {str(e)}")

    except Exception as e:
        print(f"❌ Failed to get table counts!")
        print(f"   Error: {str(e)}")


def main():
    """Run all checks."""
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║          StudyHub - Database Setup Checker                     ║
    ║                                                                 ║
    ║  This script verifies your database connection and setup      ║
    ╚════════════════════════════════════════════════════════════════╝
    """)

    # Run all checks
    checks = []

    checks.append(("Connection", check_connection()))

    if checks[-1][1]:  # Only continue if connection succeeded
        checks.append(("Tables", check_tables()))
        checks.append(("Structure", check_table_structure()))
        checks.append(("Migrations", check_migration_status()))
        get_table_counts()

    # Summary
    print_header("📝 Summary")

    for check_name, result in checks:
        status = "✅" if result else "❌"
        print(f"   {status} {check_name}")

    all_passed = all(result for _, result in checks)

    if all_passed:
        print(f"\n🎉 All checks passed! Your database is ready to use.")
        print(f"\n🚀 Next steps:")
        print(f"   • Start the server: uvicorn main:app --reload")
        print(f"   • Access docs: http://localhost:8000/docs")
    else:
        print(f"\n⚠️  Some checks failed. See above for details.")
        print(f"\n💡 Common solutions:")
        print(f"   • Connection issues: Check .env DATABASE_URL")
        print(f"   • Missing tables: Run 'alembic upgrade head'")
        print(f"   • PostgreSQL not running: Start PostgreSQL service")

    print()
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
