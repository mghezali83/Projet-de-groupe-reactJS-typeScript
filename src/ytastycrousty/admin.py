from sqlalchemy.orm import Session

from .models.user import User
from .security import hash_password, verify_password


def create_admin(db: Session, admin_password: str) -> User:
    admin = db.query(User).filter(User.username == "admin123").first()
    if admin is not None:
        if not verify_password(admin_password, admin.password):
            admin.password = hash_password(admin_password)
            db.commit()
            db.refresh(admin)
        return admin

    admin = User(
        username="admin123",
        password=hash_password(admin_password),
        role="admin",
        first_name="Admin",
        last_name="Ytasty Crousty",
        restaurant_id=None,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
