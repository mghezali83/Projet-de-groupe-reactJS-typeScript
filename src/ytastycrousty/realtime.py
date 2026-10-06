"""Socket.IO support for public order status tracking."""

import asyncio

import socketio

from .db.database import SessionLocal
from .models.order import Order

FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=FRONTEND_ORIGINS,
)

_sid_order_rooms: dict[str, str] = {}
_room_subscription_lock = asyncio.Lock()


def _order_exists(order_number: str) -> bool:
    with SessionLocal() as db:
        return (
            db.query(Order.id)
            .filter(Order.order_number == order_number)
            .first()
            is not None
        )


def _room_name(order_number: str) -> str:
    return f"order:{order_number}"


@sio.on("join_order_tracking")
async def join_order_tracking(sid: str, payload: object) -> dict[str, bool]:
    """Subscribe a client to one existing order, and only that order."""
    if not isinstance(payload, dict):
        return {"joined": False}

    order_number = payload.get("order_number")
    if not isinstance(order_number, str) or not order_number:
        return {"joined": False}

    if not await asyncio.to_thread(_order_exists, order_number):
        return {"joined": False}

    async with _room_subscription_lock:
        previous_order_number = _sid_order_rooms.get(sid)
        if previous_order_number == order_number:
            return {"joined": True}

        if previous_order_number is not None:
            await sio.leave_room(sid, _room_name(previous_order_number))

        await sio.enter_room(sid, _room_name(order_number))
        _sid_order_rooms[sid] = order_number
    return {"joined": True}


@sio.on("disconnect")
async def disconnect_order_tracking(sid: str) -> None:
    async with _room_subscription_lock:
        _sid_order_rooms.pop(sid, None)


async def emit_order_status_updated(order_number: str, status: str) -> None:
    """Publish the committed status to clients tracking this order."""
    await sio.emit(
        "order_status_updated",
        {"order_number": order_number, "status": status},
        room=_room_name(order_number),
    )
