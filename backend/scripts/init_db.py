"""
Database initialization script.
Run this to create initial data (admin user, sample courses, etc.)
"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.db.init_db import init_db
from app.models.course import Course


def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully!")


def create_sample_courses(db: Session):
    """Create some sample courses."""
    print("\nCreating sample courses...")

    sample_courses = [
        {
            "course_number": "CS101",
            "course_name": "Introduction to Computer Science",
            "department": "Computer Science",
            "description": "Basic concepts of programming and algorithms"
        },
        {
            "course_number": "MATH201",
            "course_name": "Calculus I",
            "department": "Mathematics",
            "description": "Differential and integral calculus"
        },
        {
            "course_number": "PHYS101",
            "course_name": "Physics I",
            "department": "Physics",
            "description": "Mechanics and thermodynamics"
        },
        {
            "course_number": "ENG102",
            "course_name": "English Composition",
            "department": "English",
            "description": "Academic writing and communication skills"
        }
    ]

    for course_data in sample_courses:
        # Check if course already exists
        existing = db.query(Course).filter(
            Course.course_number == course_data["course_number"]
        ).first()

        if not existing:
            course = Course(**course_data)
            db.add(course)
            print(f"  ✓ Created course: {course_data['course_number']}")
        else:
            print(f"  - Course {course_data['course_number']} already exists")

    db.commit()
    print("✓ Sample courses created!")


def main():
    """Main initialization function."""
    print("=" * 50)
    print("StudyHub Database Initialization")
    print("=" * 50)

    # Create tables
    create_tables()

    # Create database session
    db = SessionLocal()

    try:
        # Initialize database with default admin user
        init_db(db)

        # Create sample courses
        create_sample_courses(db)

        print("\n" + "=" * 50)
        print("Database initialization completed successfully! 🎉")
        print("=" * 50)
        print("\nDefault admin credentials:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nIMPORTANT: Change the admin password after first login!")
        print("=" * 50)

    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
