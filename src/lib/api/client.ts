import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getSessionToken, useSessionStore } from '@/lib/state/session-store'
import type { ApiError } from './types'

export interface CreateApiClientOptions {
  baseURL?: string
  /** Called on 401 responses after the session is cleared. Defaults to `location.assign('/')`. */
  onUnauthorized?: () => void
  /** Override token getter (defaults to session store). */
  getToken?: () => string | null
}

export function createApiClient(options: CreateApiClientOptions = {}): AxiosInstance {
  const baseURL = options.baseURL ?? import.meta.env.VITE_API_BASE_URL
  const getToken = options.getToken ?? getSessionToken
  const onUnauthorized =
    options.onUnauthorized ??
    (() => {
      if (typeof window !== 'undefined') {
        window.location.assign('/')
      }
    })

  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
  })

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  })

  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        useSessionStore.getState().clear()
        onUnauthorized()
      }
      return Promise.reject(toApiError(error))
    },
  )

  return instance
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const data = error.response?.data
    const message =
      (typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message: unknown }).message)
        : undefined) ??
      error.message ??
      'Request failed'
    return {
      status,
      code: error.code,
      message,
      detail: data,
    }
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message }
  }
  return { status: 0, message: 'Unknown error' }
}

/**
 * Singleton instance for the common case. Tests / SSR-ish callers may build
 * their own via createApiClient().
 */
let singleton: AxiosInstance | null = null
export function api(): AxiosInstance {
  if (!singleton) singleton = createApiClient()
  return singleton
}

export function resetApiClient(): void {
  singleton = null
}

export type { AxiosInstance, AxiosRequestConfig, AxiosResponse }
