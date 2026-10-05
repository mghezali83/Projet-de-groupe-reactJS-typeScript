export type UserRole = 'staff' | 'admin' | 'direction' | 'client'

export const roleLabels: Record<UserRole, string> = {
  staff: 'Équipe restaurant',
  admin: 'Administrateur',
  direction: 'Direction',
  client: 'Client',
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

export interface RegistrationDetails extends LoginCredentials {
  first_name: string
  last_name: string
}

export interface RegisteredUser {
  id: number
  username: string
  first_name: string
  last_name: string
  role: UserRole
  restaurant_id: number | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}
