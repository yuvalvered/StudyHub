from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.username == 'partialtest').first()
if user:
    user.is_email_verified = True
    user.is_active = True
    db.commit()
    print(f'✅ Verified user: {user.username}')
else:
    print('❌ User not found')
db.close()
