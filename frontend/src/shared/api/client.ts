import axios from 'axios'
import { AUTH_STORAGE_KEY, API_BASE_URL } from '../config/env'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<unknown>(error)) {
    const detail = error.response?.data
    if (
      typeof detail === 'object' &&
      detail !== null &&
      'detail' in detail
    ) {
      const message = detail.detail
      if (typeof message === 'string') return message
      if (Array.isArray(message)) {
        return message
          .map((item: unknown) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              'msg' in item &&
              typeof item.msg === 'string'
            ) {
              return item.msg
            }
            return 'Données invalides'
          })
          .join(', ')
      }
    }
    if (!error.response) {
      return 'Impossible de joindre le serveur. Vérifiez que l’API est démarrée.'
    }
  }

  if (error instanceof Error && error.message) return error.message
  return 'Une erreur inattendue est survenue.'
}
