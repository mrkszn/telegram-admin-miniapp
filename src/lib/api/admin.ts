/**
 * Typed wrappers around the telegram-waiter admin HTTP endpoints.
 *
 * The wrappers are intentionally thin: take primitives, return parsed JSON,
 * surface errors as ApiError via the axios interceptor. Anything richer
 * (caching, retries, request dedup) lives at the call site.
 *
 * Contract: telegram-waiter/docs/HTTP_API.md
 */
import type { AxiosInstance } from 'axios'
import { api } from './client'
import type {
  AdminSettings,
  AdminSettingsUpdate,
  AskRequest,
  AskResponse,
  ClientProfileResponse,
  ClientsMatch,
  ClientsResponse,
  MetricsResponse,
  OverviewResponse,
  PrizeTier,
  PrizeTierOut,
  PrizeTierUpdate,
  PrizesResponse,
  QuestionsResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
  SessionDetail,
  SessionSentiment,
  SessionsResponse,
  TopicSentiment,
  TopicsResponse,
} from './types'

/** Shared date-range query: ISO-8601 strings, UTC, with Z suffix. */
export interface DateRange {
  date_from: string
  date_to: string
}

function client(override?: AxiosInstance): AxiosInstance {
  return override ?? api()
}

export async function fetchQuestions(
  override?: AxiosInstance,
  activeOnly = true,
): Promise<QuestionsResponse> {
  const { data } = await client(override).get<QuestionsResponse>('/admin/questions', {
    params: { active_only: activeOnly },
  })
  return data
}

export async function fetchOverview(
  range: DateRange,
  override?: AxiosInstance,
): Promise<OverviewResponse> {
  const { data } = await client(override).get<OverviewResponse>('/admin/overview', {
    params: range,
  })
  return data
}

export interface MetricsQuery extends DateRange {
  metric_key: string
  group_by?: 'day' | 'week'
}

export async function fetchMetrics(
  query: MetricsQuery,
  override?: AxiosInstance,
): Promise<MetricsResponse> {
  const { data } = await client(override).get<MetricsResponse>('/admin/metrics', {
    params: query,
  })
  return data
}

export interface TopicsQuery extends DateRange {
  sentiment?: TopicSentiment
}

export async function fetchTopics(
  query: TopicsQuery,
  override?: AxiosInstance,
): Promise<TopicsResponse> {
  const { data } = await client(override).get<TopicsResponse>('/admin/topics', {
    params: query,
  })
  return data
}

export async function semanticSearch(
  body: SemanticSearchRequest,
  override?: AxiosInstance,
): Promise<SemanticSearchResponse> {
  const { data } = await client(override).post<SemanticSearchResponse>(
    '/admin/semantic',
    body,
  )
  return data
}

export async function fetchClientProfile(
  telegramId: number,
  override?: AxiosInstance,
): Promise<ClientProfileResponse> {
  const { data } = await client(override).get<ClientProfileResponse>(
    `/admin/clients/${telegramId}`,
  )
  return data
}

export async function askAdmin(
  body: AskRequest,
  override?: AxiosInstance,
): Promise<AskResponse> {
  const { data } = await client(override).post<AskResponse>('/admin/ask', body)
  return data
}

export async function fetchSettings(override?: AxiosInstance): Promise<AdminSettings> {
  const { data } = await client(override).get<AdminSettings>('/admin/settings')
  return data
}

/** Partial update — only the changed keys need to be sent. */
export async function updateSettings(
  patch: AdminSettingsUpdate,
  override?: AxiosInstance,
): Promise<AdminSettings> {
  const { data } = await client(override).put<AdminSettings>('/admin/settings', patch)
  return data
}

/* ── drill-down (sessions / topic+category clients) ─────────── */

export interface SessionsQuery extends Partial<DateRange> {
  sentiment?: SessionSentiment
  /** 1..200, backend default 50. */
  limit?: number
  offset?: number
}

export async function fetchSessions(
  query: SessionsQuery = {},
  override?: AxiosInstance,
): Promise<SessionsResponse> {
  const { data } = await client(override).get<SessionsResponse>('/admin/sessions', {
    params: query,
  })
  return data
}

export async function fetchSessionDetail(
  sessionId: string,
  override?: AxiosInstance,
): Promise<SessionDetail> {
  const { data } = await client(override).get<SessionDetail>(
    `/admin/sessions/${encodeURIComponent(sessionId)}`,
  )
  return data
}

export async function fetchTopicClients(
  topic: string,
  range?: DateRange,
  override?: AxiosInstance,
): Promise<ClientsResponse> {
  const { data } = await client(override).get<ClientsResponse>(
    `/admin/topics/${encodeURIComponent(topic)}/clients`,
    { params: range },
  )
  return data
}

export interface CategoryClientsQuery extends Partial<DateRange> {
  value: string
}

export async function fetchCategoryClients(
  metricKey: string,
  query: CategoryClientsQuery,
  override?: AxiosInstance,
): Promise<ClientsResponse> {
  const { data } = await client(override).get<ClientsResponse>(
    `/admin/metrics/${encodeURIComponent(metricKey)}/clients`,
    { params: query },
  )
  return data
}

/** Name / telegram_id lookup — distinct from the semantic search. */
export async function fetchClientsByQuery(
  query: string,
  override?: AxiosInstance,
): Promise<ClientsResponse> {
  const { data } = await client(override).get<ClientsResponse>('/admin/clients', {
    params: { query },
  })
  return data
}

/**
 * Multi-topic filter. `match=and` intersects (narrows), `or` unions (widens).
 * Topics serialise as repeated `topics=` params (no `[]` suffix) to match the
 * backend's expected query shape.
 */
export async function fetchClientsByTopics(
  topics: string[],
  match: ClientsMatch = 'and',
  override?: AxiosInstance,
): Promise<ClientsResponse> {
  const { data } = await client(override).get<ClientsResponse>('/admin/clients', {
    params: { topics, match },
    paramsSerializer: { indexes: null },
  })
  return data
}

/* ── prizes config (Phase C) ────────────────────────────────── */

export async function getPrizes(override?: AxiosInstance): Promise<PrizesResponse> {
  const { data } = await client(override).get<PrizesResponse>('/admin/prizes')
  return data
}

/** Partial update — only the changed keys need to be sent. */
export async function updatePrize(
  tier: PrizeTier,
  body: PrizeTierUpdate,
  override?: AxiosInstance,
): Promise<PrizeTierOut> {
  const { data } = await client(override).put<PrizeTierOut>(
    `/admin/prizes/${encodeURIComponent(tier)}`,
    body,
  )
  return data
}
