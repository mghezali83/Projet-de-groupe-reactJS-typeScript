export type PickupMode = 'onsite' | 'takeaway'

export type OrderStatus =
  | 'pending'
  | 'validated'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled'

export interface OrderCreateInput {
  restaurant_id: number
  items: Array<{ product_id: number; quantity: number }>
  pickup_mode: PickupMode
  customer: { name: string; email: string }
}

export interface OrderItem {
  product_id: number
  quantity: number
  unit_price: number
}

export interface Order {
  order_number: string
  restaurant_id: number
  created_at: string
  items: OrderItem[]
  total_price: number
  status: OrderStatus
  pickup_mode: PickupMode
  customer: { name: string; email: string }
}
