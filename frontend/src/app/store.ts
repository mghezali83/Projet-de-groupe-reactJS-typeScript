import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/application/authSlice'
import cartReducer, {
  type CartState,
} from '../features/cart/application/cartSlice'
import restaurantsReducer from '../features/restaurants/application/restaurantsSlice'

const CART_STORAGE_KEY = 'ytasty-crousty.cart'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCartItem(value: unknown): value is CartState['items'][number] {
  if (!isRecord(value)) return false
  return (
    Number.isSafeInteger(value.productId) &&
    Number(value.productId) > 0 &&
    typeof value.name === 'string' &&
    (typeof value.image === 'string' || value.image === null) &&
    typeof value.unitPrice === 'number' &&
    Number.isFinite(value.unitPrice) &&
    value.unitPrice >= 0 &&
    Number.isSafeInteger(value.quantity) &&
    Number(value.quantity) > 0 &&
    Number(value.quantity) <= 2_147_483_647 &&
    typeof value.isAvailable === 'boolean'
  )
}

function restoreCart(): CartState | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!savedCart) return undefined
    const parsed: unknown = JSON.parse(savedCart)
    if (!isRecord(parsed) || !Array.isArray(parsed.items)) return undefined

    const items = parsed.items.filter(isCartItem)
    const restaurantId = parsed.restaurantId
    if (items.length === 0) return { restaurantId: null, items: [] }
    if (!Number.isSafeInteger(restaurantId) || Number(restaurantId) <= 0) {
      return undefined
    }
    return { restaurantId: Number(restaurantId), items }
  } catch {
    return undefined
  }
}

const restoredCart = restoreCart()

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    restaurants: restaurantsReducer,
  },
  preloadedState: restoredCart ? { cart: restoredCart } : undefined,
})

store.subscribe(() => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(store.getState().cart),
    )
  } catch {
    // Storage may be unavailable or full; the in-memory cart remains usable.
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
