from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
from .realtime import FRONTEND_ORIGINS, sio

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

fastapi_app = FastAPI(title="Ytasty Crousty API", lifespan=lifespan)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#route qui permet de vérifier si l'API fonctionne et répond
@fastapi_app.get("/health")
def health():
    return {"status": "ok"}

#préfix ajoutent un chemin commun devant toutes les routes du router
#tags permettent de regrouper les routes dans /docs
fastapi_app.include_router(users.router, prefix="/users", tags=["user"])
fastapi_app.include_router(auth.router, prefix="/auth", tags=["auth"])
fastapi_app.include_router(products.router, prefix="/products", tags=["products"])
fastapi_app.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
fastapi_app.include_router(orders.router, prefix="/orders", tags=["orders"])

# Keep the existing Uvicorn target while routing Socket.IO and HTTP through one ASGI app.
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
