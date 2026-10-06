import { apiClient } from '../../../shared/api/client'
import type { Product } from '../../admin/products/domain/product'

export interface ProductFilters {
  restaurant_id: number
  category?: string
  q?: string
  is_available?: boolean
}

export async function getCatalogProducts(
  filters: ProductFilters,
): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/products', {
    params: filters,
  })
  return response.data
}

export async function getCatalogProduct(productId: number): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${productId}`)
  return response.data
}
