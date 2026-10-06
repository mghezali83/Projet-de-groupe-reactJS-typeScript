import { apiClient } from '../../../shared/api/client'
import type { Order, OrderCreateInput, OrderStatus } from '../domain/order'

export async function createOrder(input: OrderCreateInput): Promise<Order> {
  const response = await apiClient.post<Order>('/orders', input)
  return response.data
}

export async function getOrder(orderNumber: string): Promise<Order> {
  const response = await apiClient.get<Order>(`/orders/${encodeURIComponent(orderNumber)}`)
  return response.data
}

export async function getRestaurantOrders(
  restaurantId: number,
): Promise<Order[]> {
  const response = await apiClient.get<Order[]>(
    `/restaurants/${restaurantId}/orders`,
  )
  return response.data
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
): Promise<Order> {
  const response = await apiClient.patch<Order>(
    `/orders/${encodeURIComponent(orderNumber)}/status`,
    { status },
  )
  return response.data
}

export async function cancelOrder(orderNumber: string): Promise<Order> {
  const response = await apiClient.post<Order>(
    `/orders/${encodeURIComponent(orderNumber)}/cancel`,
  )
  return response.data
}
