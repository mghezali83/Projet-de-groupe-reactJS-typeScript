import { io } from 'socket.io-client'
import { API_BASE_URL } from '../../../shared/config/env'

export const orderSocket = io(
  import.meta.env.VITE_SOCKET_URL ?? API_BASE_URL,
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
  },
)
