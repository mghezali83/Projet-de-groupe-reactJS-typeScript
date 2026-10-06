from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from ..crud import order as crud_order
from ..db.database import get_db
from ..models.user import User
from ..schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from ..security import recuperer_utilisateur
from ..realtime import emit_order_status_updated

router = APIRouter(
    responses={
        400: {"description": "Requête métier invalide"},
        401: {"description": "Authentification absente ou invalide"},
        403: {"description": "Utilisateur non autorisé"},
        404: {"description": "Commande, restaurant ou produit introuvable"},
    },
)


@router.post("", response_model=OrderOut, status_code=201)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    return crud_order.creer_commande(db, data)


@router.get("/{order_number}", response_model=OrderOut)
def get_order(order_number: str, db: Session = Depends(get_db)):
    return crud_order.recuperer_commande_par_numero(db, order_number)


@router.patch("/{order_number}/status", response_model=OrderOut)
def update_order_status(
    order_number: str,
    data: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(recuperer_utilisateur),
):
    order = crud_order.modifier_statut_commande(db, order_number, data, user)
    background_tasks.add_task(
        emit_order_status_updated,
        order.order_number,
        order.status,
    )
    return order


@router.post("/{order_number}/cancel", response_model=OrderOut)
def cancel_order(
    order_number: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(recuperer_utilisateur),
):
    order = crud_order.annuler_commande(db, order_number, user)
    background_tasks.add_task(
        emit_order_status_updated,
        order.order_number,
        order.status,
    )
    return order
