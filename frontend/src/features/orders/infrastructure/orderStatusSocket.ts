import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from '../../../shared/config/env'

interface ServerToClientEvents {
  order_status_updated: (payload: unknown) => void
}

interface ClientToServerEvents {
  join_order_tracking: (payload: { order_number: string }) => void
}

export function createOrderStatusSocket(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  return io(API_BASE_URL, { autoConnect: false })
}
