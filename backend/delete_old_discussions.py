"""
Script to delete discussions and comments not created today.
סקריפט למחיקת דיונים ותגובות שלא נוצרו היום
"""
from datetime import date
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.comment import Comment
from app.models.discussion import Discussion

def delete_old_discussions_and_comments():
    """Delete all discussions and comments not created today."""
    db: Session = SessionLocal()

    try:
        today = date.today()

        # Count before deletion
        old_comments = db.query(Comment).filter(
            db.func.date(Comment.created_at) != today
        ).count()

        old_discussions = db.query(Discussion).filter(
            db.func.date(Discussion.created_at) != today
        ).count()

        print(f"תגובות למחיקה: {old_comments}")
        print(f"דיונים למחיקה: {old_discussions}")

        # Ask for confirmation
        confirm = input("האם אתה בטוח שברצונך למחוק? (yes/no): ")

        if confirm.lower() in ['yes', 'y', 'כן']:
            # Delete comments first (due to foreign key constraints)
            deleted_comments = db.query(Comment).filter(
                db.func.date(Comment.created_at) != today
            ).delete(synchronize_session=False)

            # Delete discussions
            deleted_discussions = db.query(Discussion).filter(
                db.func.date(Discussion.created_at) != today
            ).delete(synchronize_session=False)

            db.commit()

            print(f"\n✅ נמחקו {deleted_comments} תגובות")
            print(f"✅ נמחקו {deleted_discussions} דיונים")
        else:
            print("המחיקה בוטלה")

    except Exception as e:
        db.rollback()
        print(f"❌ שגיאה: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    delete_old_discussions_and_comments()
