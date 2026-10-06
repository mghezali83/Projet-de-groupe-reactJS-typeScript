import { apiClient } from '../../../../shared/api/client'
import type { CreateManagedUserInput, ManagedUser } from '../domain/user'

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>('/users')
  return response.data
}

export async function createManagedUser(
  input: CreateManagedUserInput,
): Promise<ManagedUser> {
  const response = await apiClient.post<ManagedUser>('/users', input)
  return response.data
}
