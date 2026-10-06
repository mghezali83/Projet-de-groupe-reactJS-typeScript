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

export type RestaurantInput = Omit<Restaurant, 'id'>
export type RestaurantUpdateInput = Omit<RestaurantInput, 'is_open'>

export async function createRestaurant(
  restaurant: RestaurantInput,
): Promise<Restaurant> {
  const response = await apiClient.post<Restaurant>('/restaurants', restaurant)
  return response.data
}

export async function updateRestaurant(
  restaurantId: number,
  restaurant: Partial<RestaurantUpdateInput>,
): Promise<Restaurant> {
  const response = await apiClient.patch<Restaurant>(
    `/restaurants/${restaurantId}`,
    restaurant,
  )
  return response.data
}

export async function updateRestaurantAvailability(
  restaurantId: number,
  isOpen: boolean,
): Promise<Restaurant> {
  const response = await apiClient.patch<Restaurant>(
    `/restaurants/${restaurantId}/availability`,
    { is_open: isOpen },
  )
  return response.data
}
