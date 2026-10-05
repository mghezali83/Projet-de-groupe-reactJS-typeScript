export interface Product {
  id: number
  name: string
  image: string | null
  description: string
  category: string
  price: number
  is_available: boolean
  restaurant_id: number
  ingredients: string[]
}

export interface ProductInput {
  name: string
  image: string | null
  description: string
  category: string
  price: number
  is_available: boolean
  restaurant_id: number
  ingredients: string[]
}
