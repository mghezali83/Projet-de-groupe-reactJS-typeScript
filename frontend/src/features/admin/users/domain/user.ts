export type ManagedUserRole = 'admin' | 'staff' | 'direction' | 'client'
export type ManagedUserCreationRole = Exclude<ManagedUserRole, 'client'>

export interface ManagedUser {
  id: number
  first_name: string
  last_name: string
  username: string
  role: ManagedUserRole
  restaurant_id: number | null
}

export interface CreateManagedUserInput {
  first_name: string
  last_name: string
  username: string
  password: string
  role: ManagedUserCreationRole
  restaurant_id: number | null
}

export const managedRoleLabels: Record<ManagedUserRole, string> = {
  admin: 'Administrateur',
  staff: 'Équipe restaurant',
  direction: 'Direction',
  client: 'Client',
}
