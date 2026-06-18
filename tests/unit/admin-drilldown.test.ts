/**
 * Drill-down API wrappers (endpoints 10–14): URL/path encoding, query
 * params and the repeated `topics=` serialisation the backend expects.
 */
import { describe, it, expect } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { createApiClient } from '@/lib/api/client'
import {
  fetchSessions,
  fetchSessionDetail,
  fetchTopicClients,
  fetchCategoryClients,
  fetchClientsByQuery,
  fetchClientsByTopics,
} from '@/lib/api/admin'

function setup() {
  const client = createApiClient({ baseURL: 'https://api.test' })
  const mock = new MockAdapter(client)
  return { client, mock }
}

describe('drill-down api wrappers', () => {
  it('fetchSessions forwards sentiment + pagination as query params', async () => {
    const { client, mock } = setup()
    mock.onGet('/admin/sessions').reply((config) => {
      expect(config.params).toMatchObject({
        sentiment: 'negative',
        limit: 50,
        offset: 0,
      })
      return [200, { sessions: [] }]
    })
    const res = await fetchSessions(
      { sentiment: 'negative', limit: 50, offset: 0 },
      client,
    )
    expect(res).toEqual({ sessions: [] })
  })

  it('fetchSessionDetail percent-encodes the session id in the path', async () => {
    const { client, mock } = setup()
    mock.onGet(/\/admin\/sessions\/.+/).reply((config) => {
      expect(config.url).toBe(`/admin/sessions/${encodeURIComponent('a/b id')}`)
      return [200, { id: 'a/b id', messages: [], answers: [], sessions: [] }]
    })
    await fetchSessionDetail('a/b id', client)
  })

  it('fetchTopicClients encodes a Cyrillic topic in the path + passes the range', async () => {
    const { client, mock } = setup()
    mock.onGet(/\/admin\/topics\/.+\/clients/).reply((config) => {
      expect(config.url).toBe(
        `/admin/topics/${encodeURIComponent('сервіс')}/clients`,
      )
      expect(config.params).toMatchObject({
        date_from: '2026-01-01',
        date_to: '2026-01-31',
      })
      return [200, { clients: [] }]
    })
    await fetchTopicClients(
      'сервіс',
      { date_from: '2026-01-01', date_to: '2026-01-31' },
      client,
    )
  })

  it('fetchCategoryClients encodes the metric_key path + sends value', async () => {
    const { client, mock } = setup()
    mock.onGet(/\/admin\/metrics\/.+\/clients/).reply((config) => {
      expect(config.url).toBe('/admin/metrics/visit_recency/clients')
      expect(config.params).toMatchObject({ value: 'Більше року' })
      return [200, { clients: [] }]
    })
    await fetchCategoryClients('visit_recency', { value: 'Більше року' }, client)
  })

  it('fetchClientsByQuery sends a single query param', async () => {
    const { client, mock } = setup()
    mock.onGet('/admin/clients').reply((config) => {
      expect(config.params).toEqual({ query: 'Alice' })
      return [200, { clients: [] }]
    })
    await fetchClientsByQuery('Alice', client)
  })

  it('fetchClientsByTopics repeats topics= (no [] suffix) and sends match', async () => {
    const { client, mock } = setup()
    let capturedUrl = ''
    mock.onGet('/admin/clients').reply((config) => {
      expect(config.params).toEqual({ topics: ['сервіс', 'еда'], match: 'and' })
      // serialised form the backend actually receives
      capturedUrl = client.getUri(config)
      return [200, { clients: [] }]
    })
    await fetchClientsByTopics(['сервіс', 'еда'], 'and', client)
    expect(capturedUrl).toContain('match=and')
    // repeated key, not topics[]= and not a single comma-joined value
    expect(capturedUrl).not.toContain('topics[]')
    const occurrences = capturedUrl.split('topics=').length - 1
    expect(occurrences).toBe(2)
  })

  it('fetchClientsByTopics defaults match to "and"', async () => {
    const { client, mock } = setup()
    mock.onGet('/admin/clients').reply((config) => {
      expect(config.params.match).toBe('and')
      return [200, { clients: [] }]
    })
    await fetchClientsByTopics(['сервіс'], undefined, client)
  })
})
