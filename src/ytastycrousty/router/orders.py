from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from ..crud import order as crud_order
from ..db.database import get_db
from ..models.user import User
from ..schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from ..security import recuperer_utilisateur

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
async def update_order_status(
    order_number: str,
    data: OrderStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(recuperer_utilisateur),
):
    order = await run_in_threadpool(
        crud_order.modifier_statut_commande,
        db,
        order_number,
        data,
        user,
    )
    await request.app.state.sio.emit(
        "order_status_updated",
        {"order_number": order.order_number, "status": order.status},
        room=f"order:{order.order_number}",
    )
    return order


@router.post("/{order_number}/cancel", response_model=OrderOut)
async def cancel_order(
    order_number: str,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(recuperer_utilisateur),
):
    order = await run_in_threadpool(
        crud_order.annuler_commande,
        db,
        order_number,
        user,
    )
    await request.app.state.sio.emit(
        "order_status_updated",
        {"order_number": order.order_number, "status": order.status},
        room=f"order:{order.order_number}",
    )
    return order