/**
 * Generic API surface (kept from the template).
 */
export interface ApiError {
  status: number
  code?: string
  message: string
  detail?: unknown
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/* ============================================================
 * Backend contract — telegram-waiter Phase 4A.
 * Mirrors Pydantic schemas from `api/*` (FastAPI).
 * See: telegram-waiter/docs/HTTP_API.md
 * ============================================================ */

// --- auth ---------------------------------------------------
export interface AuthRequest {
  init_data: string
}
export interface AuthResponse {
  token: string
  telegram_id: number
}

// --- overview -----------------------------------------------
export interface TopicCount {
  topic: string
  count: number
  avg_sentiment: number
}
export interface OverviewResponse {
  sessions_count: number
  avg_sentiment: number | null
  top_positive_topics: TopicCount[]
  top_negative_topics: TopicCount[]
}

// --- metrics ------------------------------------------------
export type MetricType = 'number' | 'enum' | 'boolean' | 'text' | 'unknown'

export interface MetricPoint {
  bucket: string
  count: number
  avg: number | null
  min: number | null
  max: number | null
}
export interface CategoryCount {
  value: string
  count: number
  pct: number
}
export interface MetricsResponse {
  metric_key: string
  expected_type: MetricType
  points: MetricPoint[] | null
  distribution: CategoryCount[] | null
  total: number | null
  unknown: number | null
  enum_values: string[] | null
}

// --- topics -------------------------------------------------
export interface TopicsResponse {
  topics: TopicCount[]
}
export type TopicSentiment = 'positive' | 'negative'

// --- semantic / clients -------------------------------------
export interface SemanticSearchRequest {
  query: string
  top_k: number
}
export interface SemanticHit {
  session_id: string
  client_id: number | null
  score: number
  summary_text: string
  sentiment: string | null
  started_at: string | null
}
export interface SemanticSearchResponse {
  hits: SemanticHit[]
}

export interface ClientProfileResponse {
  telegram_id: number
  name: string | null
  sessions_count: number
  last_session_at: string | null
  avg_sentiment: number | null
  recent_cards: Array<Record<string, unknown>>
  top_topics: TopicCount[]
}

// --- questions ----------------------------------------------
export interface Question {
  id: string
  text: string
  metric_key: string
  expected_type: MetricType
  enum_values: string[] | null
}
export interface QuestionsResponse {
  questions: Question[]
}

// --- ask (admin chat) ---------------------------------------
export interface AskHistoryItem {
  role: 'user' | 'assistant'
  content: string
}
export interface AskRequest {
  question: string
  history?: AskHistoryItem[]
}
export interface AskResponse {
  answer_text: string
  tools_used: string[]
  chart_text: string | null
}
