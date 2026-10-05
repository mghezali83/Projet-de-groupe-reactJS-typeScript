export type UserRole = 'staff' | 'admin' | 'direction'

export const roleLabels: Record<UserRole, string> = {
  staff: 'Équipe restaurant',
  admin: 'Administrateur',
  direction: 'Direction',
}

export interface AuthUser {
  id: number
  role: UserRole
  restaurant_id: number | null
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}
