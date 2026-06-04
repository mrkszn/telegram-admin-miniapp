import { create } from 'zustand'

export interface SessionUser {
  telegramId: number
  firstName?: string
  lastName?: string
  username?: string
  languageCode?: string
}

export interface SessionState {
  token: string | null
  user: SessionUser | null
  isReady: boolean
  isBootstrapping: boolean
  error: string | null
  setSession(token: string, user: SessionUser | null): void
  clear(): void
  setBootstrapping(value: boolean): void
  setError(message: string | null): void
}

export const useSessionStore = create<SessionState>((set) => ({
  token: null,
  user: null,
  isReady: false,
  isBootstrapping: false,
  error: null,
  setSession: (token, user) => set({ token, user, isReady: true, error: null }),
  clear: () => set({ token: null, user: null, isReady: false, error: null }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
  setError: (message) => set({ error: message, isReady: false }),
}))

/** Non-hook accessor for axios interceptors and other side-effecty callers. */
export function getSessionToken(): string | null {
  return useSessionStore.getState().token
}
