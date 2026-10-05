import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface CartItem {
  productId: number
  name: string
  image: string | null
  unitPrice: number
  quantity: number
}

interface CartState {
  restaurantId: number | null
  items: CartItem[]
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
      action: PayloadAction<{ restaurantId: number; item: CartItem }>,
    ) {
      if (state.restaurantId !== action.payload.restaurantId) {
        if (state.items.length > 0) return
        state.restaurantId = action.payload.restaurantId
      }
      const existing = state.items.find(
        (item) => item.productId === action.payload.item.productId,
      )
      if (existing) existing.quantity += action.payload.item.quantity
      else if (action.payload.item.quantity > 0) state.items.push(action.payload.item)
    },
    incrementCartItem(state, action: PayloadAction<number>) {
      const item = state.items.find(
        (entry) => entry.productId === action.payload,
      )
      if (item) item.quantity += 1
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
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  )

export default cartSlice.reducer
