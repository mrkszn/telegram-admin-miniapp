import { describe, it, expect, beforeEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { createApiClient } from '@/lib/api/client'
import { useSessionStore } from '@/lib/state/session-store'

describe('createApiClient', () => {
  beforeEach(() => {
    useSessionStore.getState().clear()
  })

  it('adds Authorization: Bearer <token> when the store holds a token', async () => {
    useSessionStore.getState().setSession('jwt-abc', null)
    const client = createApiClient({ baseURL: 'https://api.test' })
    const mock = new MockAdapter(client)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer jwt-abc')
      return [200, { ok: true }]
    })
    const res = await client.get('/me')
    expect(res.data).toEqual({ ok: true })
  })

  it('omits Authorization when no token is set', async () => {
    const client = createApiClient({ baseURL: 'https://api.test' })
    const mock = new MockAdapter(client)
    mock.onGet('/ping').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, { pong: true }]
    })
    await client.get('/ping')
  })

  it('clears the session and calls onUnauthorized on 401', async () => {
    useSessionStore.getState().setSession('jwt-abc', { telegramId: 1 })
    const onUnauthorized = vi.fn()
    const client = createApiClient({ baseURL: 'https://api.test', onUnauthorized })
    const mock = new MockAdapter(client)
    mock.onGet('/private').reply(401, { message: 'nope' })
    await expect(client.get('/private')).rejects.toMatchObject({
      status: 401,
      message: 'nope',
    })
    expect(useSessionStore.getState().token).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('maps non-401 errors into ApiError shape and does not clear the session', async () => {
    useSessionStore.getState().setSession('jwt-abc', null)
    const onUnauthorized = vi.fn()
    const client = createApiClient({ baseURL: 'https://api.test', onUnauthorized })
    const mock = new MockAdapter(client)
    mock.onGet('/x').reply(500, { message: 'boom' })
    await expect(client.get('/x')).rejects.toMatchObject({ status: 500, message: 'boom' })
    expect(useSessionStore.getState().token).toBe('jwt-abc')
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
