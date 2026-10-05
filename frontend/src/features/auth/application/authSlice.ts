import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiErrorMessage } from '../../../shared/api/client'
import type {
  AuthSession,
  LoginCredentials,
  RegistrationDetails,
} from '../domain/auth'
import {
  clearStoredSession,
  login,
  register,
  restoreSession,
} from '../infrastructure/authApi'

interface AuthState {
  token: string | null
  user: AuthSession['user'] | null
  status: 'idle' | 'loading' | 'failed'
  error: string | null
}

const restoredSession = restoreSession()

const initialState: AuthState = {
  token: restoredSession?.token ?? null,
  user: restoredSession?.user ?? null,
  status: 'idle',
  error: null,
}

export const signIn = createAsyncThunk<
  AuthSession,
  LoginCredentials,
  { rejectValue: string }
>('auth/signIn', async (credentials, { rejectWithValue }) => {
  try {
    return await login(credentials)
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error))
  }
})

export const signUp = createAsyncThunk<
  AuthSession,
  RegistrationDetails,
  { rejectValue: string }
>('auth/signUp', async (details, { rejectWithValue }) => {
  try {
    await register(details)
    return await login({
      username: details.username,
      password: details.password,
    })
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error))
  }
})

export const signOut = createAsyncThunk('auth/signOut', async () => {
  clearStoredSession()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(signIn.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.status = 'idle'
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          action.payload ?? 'La connexion a échoué. Réessayez.'
      })
      .addCase(signUp.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.status = 'idle'
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(signUp.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          action.payload ?? 'La création du compte a échoué. Réessayez.'
      })
      .addCase(signOut.fulfilled, (state) => {
        state.token = null
        state.user = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
