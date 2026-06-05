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
  AskRequest,
  AskResponse,
  ClientProfileResponse,
  MetricsResponse,
  OverviewResponse,
  QuestionsResponse,
  SemanticSearchRequest,
  SemanticSearchResponse,
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
