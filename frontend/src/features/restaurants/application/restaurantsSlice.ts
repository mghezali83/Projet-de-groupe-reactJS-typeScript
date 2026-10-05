import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getApiErrorMessage } from '../../../shared/api/client'
import type { ApiHealth, Restaurant } from '../domain/restaurant'
import {
  getApiHealth,
  getRestaurant,
  getRestaurants,
} from '../infrastructure/restaurantApi'

const ACTIVE_RESTAURANT_KEY = 'ytasty-crousty.active-restaurant'

interface RestaurantsState {
  items: Restaurant[]
  activeRestaurant: Restaurant | null
  health: ApiHealth | null
  status: 'idle' | 'loading' | 'ready' | 'failed'
  error: string | null
}

const initialState: RestaurantsState = {
  items: [],
  activeRestaurant: null,
  health: null,
  status: 'idle',
  error: null,
}

export const loadRestaurants = createAsyncThunk<
  { items: Restaurant[]; activeRestaurant: Restaurant | null; health: ApiHealth },
  void,
  { rejectValue: string }
>('restaurants/load', async (_, { rejectWithValue }) => {
  try {
    const [health, items] = await Promise.all([
      getApiHealth(),
      getRestaurants(),
    ])
    const storedId = Number(localStorage.getItem(ACTIVE_RESTAURANT_KEY))
    const activeId = items.some((item) => item.id === storedId)
      ? storedId
      : items[0]?.id
    const activeRestaurant = activeId ? await getRestaurant(activeId) : null

    if (activeRestaurant) {
      localStorage.setItem(ACTIVE_RESTAURANT_KEY, String(activeRestaurant.id))
    } else {
      localStorage.removeItem(ACTIVE_RESTAURANT_KEY)
    }

    return { items, activeRestaurant, health }
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error))
  }
})

export const selectActiveRestaurant = createAsyncThunk<
  Restaurant,
  number,
  { rejectValue: string }
>('restaurants/selectActive', async (restaurantId, { rejectWithValue }) => {
  try {
    const restaurant = await getRestaurant(restaurantId)
    localStorage.setItem(ACTIVE_RESTAURANT_KEY, String(restaurant.id))
    return restaurant
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error))
  }
})

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearRestaurantError(state) {
      state.error = null
    },
    setRestaurantList(state, action: PayloadAction<Restaurant[]>) {
      state.items = action.payload
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadRestaurants.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loadRestaurants.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.activeRestaurant = action.payload.activeRestaurant
        state.health = action.payload.health
        state.status = 'ready'
      })
      .addCase(loadRestaurants.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Impossible de charger les restaurants.'
      })
      .addCase(selectActiveRestaurant.fulfilled, (state, action) => {
        state.activeRestaurant = action.payload
      })
      .addCase(selectActiveRestaurant.rejected, (state, action) => {
        state.error =
          action.payload ?? 'Impossible de sélectionner ce restaurant.'
      })
  },
})

export const { clearRestaurantError, setRestaurantList } =
  restaurantsSlice.actions
export default restaurantsSlice.reducer
