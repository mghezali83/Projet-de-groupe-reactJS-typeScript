import { apiClient } from '../../../shared/api/client'
import type { Order, OrderCreateInput } from '../domain/order'

export async function createOrder(input: OrderCreateInput): Promise<Order> {
  const response = await apiClient.post<Order>('/orders', input)
  return response.data
}

export async function getOrder(orderNumber: string): Promise<Order> {
  const response = await apiClient.get<Order>(`/orders/${encodeURIComponent(orderNumber)}`)
  return response.data
}
