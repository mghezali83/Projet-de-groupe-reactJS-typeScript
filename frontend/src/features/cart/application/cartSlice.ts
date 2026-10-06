import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

const MAX_ORDER_ITEM_QUANTITY = 2_147_483_647

export interface CartItem {
  productId: number
  name: string
  image: string | null
  unitPrice: number
  quantity: number
  isAvailable: boolean
}

export interface CartState {
  restaurantId: number | null
  items: CartItem[]
}

interface AddCartItemPayload {
  restaurantId: number
  restaurantOpen: boolean
  item: CartItem
}

interface IncrementCartItemPayload {
  productId: number
  restaurantId: number | null
  restaurantOpen: boolean
}

const initialState: CartState = {
  restaurantId: null,
  items: [],
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addCartItem(
      state,
      action: PayloadAction<AddCartItemPayload>,
    ) {
      const { item, restaurantId, restaurantOpen } = action.payload
      if (
        !item.isAvailable ||
        !restaurantOpen ||
        !Number.isSafeInteger(restaurantId) ||
        restaurantId <= 0 ||
        !Number.isSafeInteger(item.productId) ||
        item.productId <= 0 ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > MAX_ORDER_ITEM_QUANTITY ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice < 0
      ) {
        return
      }

      if (state.restaurantId !== restaurantId) {
        if (state.items.length > 0) return
        state.restaurantId = restaurantId
      }
      const existing = state.items.find(
        (entry) => entry.productId === item.productId,
      )
      if (existing) {
        const nextQuantity = existing.quantity + item.quantity
        if (Number.isSafeInteger(nextQuantity)) existing.quantity = nextQuantity
      } else {
        state.items.push(item)
      }
    },
    incrementCartItem(state, action: PayloadAction<IncrementCartItemPayload>) {
      const item = state.items.find(
        (entry) => entry.productId === action.payload.productId,
      )
      if (
        item?.isAvailable &&
        state.restaurantId === action.payload.restaurantId &&
        action.payload.restaurantOpen &&
        item.quantity < MAX_ORDER_ITEM_QUANTITY
      ) {
        item.quantity += 1
      }
    },
    decrementCartItem(state, action: PayloadAction<number>) {
      const item = state.items.find(
        (entry) => entry.productId === action.payload,
      )
      if (!item) return
      item.quantity -= 1
      if (item.quantity <= 0) {
        state.items = state.items.filter(
          (entry) => entry.productId !== action.payload,
        )
      }
      if (state.items.length === 0) state.restaurantId = null
    },
    removeCartItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload,
      )
      if (state.items.length === 0) state.restaurantId = null
    },
    clearCart(state) {
      state.restaurantId = null
      state.items = []
    },
  },
})

export const {
  addCartItem,
  incrementCartItem,
  decrementCartItem,
  removeCartItem,
  clearCart,
} = cartSlice.actions

export const selectCartItemCount = (state: { cart: CartState }): number =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0)

export const selectCartTotal = (state: { cart: CartState }): number =>
  state.cart.items.reduce(
    (totalCents, item) =>
      totalCents + Math.round(item.unitPrice * 100) * item.quantity,
    0,
  ) / 100

export default cartSlice.reducer
