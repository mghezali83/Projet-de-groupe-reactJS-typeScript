from fastapi import APIRouter, Depends, HTTPException 
from sqlalchemy.orm import Session 
from ..db.database import get_db 
from ..schemas.auth import RegistrationRequest, RequeteConnexion, TokenReponse
from ..schemas.user import UserOut
from ..crud.auth import authentifier_user, inscrire_client
from ..security import creer_token

router = APIRouter()
    
# response_model définit la forme de la réponse envoyée au client
@router.post("/login",response_model=TokenReponse)
def login(requete : RequeteConnexion ,db :Session = Depends(get_db)  ):
    user = authentifier_user(db, requete.username, requete.password)
    if user is None:
        raise HTTPException(status_code=401 ,detail= "Identifiants incorrects")

    token = creer_token(user.id, user.role,user.restaurant_id)

    return {"access_token" : token, "token_type" : "bearer"}


@router.post("/register", response_model=UserOut, status_code=201)
def register(registration: RegistrationRequest, db: Session = Depends(get_db)):
    return inscrire_client(db, registration)