import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/application/authSlice'
import cartReducer from '../features/cart/application/cartSlice'
import restaurantsReducer from '../features/restaurants/application/restaurantsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    restaurants: restaurantsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
