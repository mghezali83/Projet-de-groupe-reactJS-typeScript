import { apiClient } from '../../../../shared/api/client'
import type { Restaurant } from '../../../restaurants/domain/restaurant'
import type { Product, ProductInput } from '../domain/product'

export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>('/products')
  return response.data
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await apiClient.get<Restaurant[]>('/restaurants')
  return response.data
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const response = await apiClient.post<Product>('/products', input)
  return response.data
}

export async function updateProduct(
  productId: number,
  input: ProductInput,
): Promise<Product> {
  const response = await apiClient.patch<Product>(
    `/products/${productId}`,
    input,
  )
  return response.data
}

export async function updateProductAvailability(
  productId: number,
  isAvailable: boolean,
): Promise<Product> {
  const response = await apiClient.patch<Product>(
    `/products/${productId}/availability`,
    { is_available: isAvailable },
  )
  return response.data
}

export async function deleteProduct(productId: number): Promise<void> {
  await apiClient.delete(`/products/${productId}`)
}
