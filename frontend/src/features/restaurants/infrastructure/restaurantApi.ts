import { apiClient } from '../../../shared/api/client'
import type { ApiHealth, Restaurant } from '../domain/restaurant'

export async function getApiHealth(): Promise<ApiHealth> {
  const response = await apiClient.get<ApiHealth>('/health')
  return response.data
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await apiClient.get<Restaurant[]>('/restaurants')
  return response.data
}

export async function getRestaurant(restaurantId: number): Promise<Restaurant> {
  const response = await apiClient.get<Restaurant>(
    `/restaurants/${restaurantId}`,
  )
  return response.data
}
