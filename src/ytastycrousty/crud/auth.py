from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models.user import User
from ..schemas.auth import RegistrationRequest
from ..security import hash_password, verify_password


def authentifier_user(db: Session, username: str, password: str):
    #on cherche si un utiliser avec ce nom existe
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        return None

    #on vérifie le mdp
    if not verify_password(password, user.password):
        return None
    
    #si les 2 tests bons alors on renvoit la connexion de l'utilisateur
    return user


def inscrire_client(db: Session, registration: RegistrationRequest) -> User:
    existing_user = db.query(User).filter(User.username == registration.username).first()
    if existing_user is not None:
        raise HTTPException(status_code=400, detail="Cet identifiant est déjà utilisé")

    user = User(
        username=registration.username,
        password=hash_password(registration.password),
        role="client",
        first_name=registration.first_name.strip(),
        last_name=registration.last_name.strip(),
        restaurant_id=None,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cet identifiant est déjà utilisé") from None
    db.refresh(user)
    return user
        