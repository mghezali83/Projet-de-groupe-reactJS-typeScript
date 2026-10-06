import { apiClient } from '../../../../shared/api/client'
import type { Order, OrderStatus } from '../../../orders/domain/order'

export async function getRestaurantOrders(
  restaurantId: number,
  status?: OrderStatus,
): Promise<Order[]> {
  const response = await apiClient.get<Order[]>(
    `/restaurants/${restaurantId}/orders`,
    { params: status ? { status } : undefined },
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
