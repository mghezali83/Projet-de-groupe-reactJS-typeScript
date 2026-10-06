import type { Restaurant } from '../../../restaurants/domain/restaurant'
import type { Product, ProductInput } from '../domain/product'
import {
  createProduct,
  deleteProduct,
  getProducts,
  getRestaurants,
  updateProduct,
  updateProductAvailability,
} from '../infrastructure/productApi'

export async function loadProductCatalog(): Promise<{
  products: Product[]
  restaurants: Restaurant[]
}> {
  const [products, restaurants] = await Promise.all([
    getProducts(),
    getRestaurants(),
  ])
  return { products, restaurants }
}

export function saveProduct(
  productId: number | null,
  input: ProductInput,
): Promise<Product> {
  return productId === null
    ? createProduct(input)
    : updateProduct(productId, input)
}

export function setProductAvailability(
  productId: number,
  isAvailable: boolean,
): Promise<Product> {
  return updateProductAvailability(productId, isAvailable)
}

export function removeProduct(productId: number): Promise<void> {
  return deleteProduct(productId)
}
