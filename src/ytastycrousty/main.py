from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from fastapi import HTTPException
from starlette.concurrency import run_in_threadpool
from .admin import create_admin
from .initialisation import initialiser_restaurants
from .db.config import settings
from .db.database import Base, SessionLocal, engine
from .models.restaurant import Restaurant
from .models.order import Order, OrderItem
from .router import users
from .router import auth
from .router import products
from .router import restaurants
from .router import orders

#lifespan permet d'exécuter du code au démarrage et à l'arrêt de l'API
@asynccontextmanager
async def lifespan(app: FastAPI):
    #exécuté au démarrage de l'API
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        initialiser_restaurants(db)
        create_admin(db, settings.admin_password)
    yield
    #exécuté à l'arrêt de l'API
    engine.dispose()

api = FastAPI(title="Ytasty Crousty API", lifespan=lifespan)
api.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#route qui permet de vérifier si l'API fonctionne et répond
@api.get("/health")
def health():
    return {"status": "ok"}

#préfix ajoutent un chemin commun devant toutes les routes du router
#tags permettent de regrouper les routes dans /docs
api.include_router(users.router, prefix="/users", tags=["user"])
api.include_router(auth.router, prefix="/auth", tags=["auth"])
api.include_router(products.router, prefix="/products", tags=["products"])
api.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
api.include_router(orders.router, prefix="/orders", tags=["orders"])

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
)
api.state.sio = sio


@sio.on("join_order")
async def join_order(sid: str, data: dict[str, str]) -> dict[str, str]:
    value = data.get("order_number") if isinstance(data, dict) else None
    if not isinstance(value, str) or not value or len(value) > 36:
        return {"error": "Numéro de commande invalide"}
    from .crud.order import recuperer_commande_par_numero

    def load_order_status() -> str:
        with SessionLocal() as db:
            return recuperer_commande_par_numero(db, value).status

    try:
        current_status = await run_in_threadpool(load_order_status)
    except HTTPException:
        return {"error": "Commande introuvable"}

    await sio.enter_room(sid, f"order:{value}")
    return {"status": current_status}


@sio.on("leave_order")
async def leave_order(sid: str, data: dict[str, str]) -> None:
    order_number = data.get("order_number") if isinstance(data, dict) else None
    if isinstance(order_number, str) and order_number:
        await sio.leave_room(sid, f"order:{order_number}")


app = socketio.ASGIApp(sio, other_asgi_app=api)
