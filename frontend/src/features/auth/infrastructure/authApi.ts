import { apiClient } from '../../../shared/api/client'
import { AUTH_STORAGE_KEY } from '../../../shared/config/env'
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  UserRole,
} from '../domain/auth'

const roles: UserRole[] = ['staff', 'admin', 'direction']

// Ces claims servent à l’interface; seul le backend valide la signature du JWT.
function getUserFromToken(token: string): AuthUser {
  const payloadPart = token.split('.')[1]
  if (!payloadPart) throw new Error('Le serveur a retourné un jeton invalide.')

  const normalizedPayload = payloadPart
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(payloadPart.length / 4) * 4, '=')

  let payload: unknown
  try {
    payload = JSON.parse(atob(normalizedPayload)) as unknown
  } catch {
    throw new Error('Le serveur a retourné un jeton invalide.')
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Le serveur a retourné un jeton invalide.')
  }

  const claims = payload as Record<string, unknown>
  const id = Number(claims.sub)
  const role = claims.role
  const restaurantId = claims.restaurant_id

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof role !== 'string' ||
    !roles.includes(role as UserRole) ||
    (restaurantId !== null &&
      restaurantId !== undefined &&
      !Number.isSafeInteger(restaurantId))
  ) {
    throw new Error('Le serveur a retourné un jeton utilisateur invalide.')
  }

  return {
    id,
    role: role as UserRole,
    restaurant_id:
      typeof restaurantId === 'number' ? restaurantId : null,
  }
}

export async function login(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  const response = await apiClient.post<LoginResponse>(
    '/auth/login',
    credentials,
  )
  const session = {
    token: response.data.access_token,
    user: getUserFromToken(response.data.access_token),
  }

  localStorage.setItem(AUTH_STORAGE_KEY, session.token)
  return session
}

export function restoreSession(): AuthSession | null {
  const token = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!token) return null

  try {
    const user = getUserFromToken(token)
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null
    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')
    const claims = JSON.parse(atob(normalizedPayload)) as {
      exp?: unknown
    }
    if (
      typeof claims.exp !== 'number' ||
      claims.exp * 1000 <= Date.now()
    ) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }
    return { token, user }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
