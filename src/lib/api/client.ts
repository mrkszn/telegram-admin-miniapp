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
    // 90 s — /admin/ask invokes a two-phase LLM agent (interpret +
    // synthesize) plus a Pinecone hop, which routinely sits in the
    // 20-40 s range. 15 s left the chat hard-erroring on every other
    // turn even though the backend was still happily processing.
    timeout: 90_000,
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

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    typeof (value as ApiError).status === 'number' &&
    typeof (value as ApiError).message === 'string'
  )
}

export function toApiError(error: unknown): ApiError {
  // The response interceptor already wraps every axios failure as
  // ApiError before rejecting, so by the time it bubbles up to a route
  // handler the "error" is no longer an AxiosError or Error instance —
  // it's a plain ApiError object. Detect that shape and forward it
  // unchanged; otherwise we'd lose the real message and degrade to
  // "Unknown error" on screen.
  if (isApiError(error)) return error
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
