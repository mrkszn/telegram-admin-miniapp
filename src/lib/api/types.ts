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

// --- settings -----------------------------------------------
export type SettingsTheme = 'light' | 'dark' | 'system'
export type SettingsLanguage = 'uk' | 'en'

export interface AdminSettings {
  theme: SettingsTheme
  language: SettingsLanguage
  notifications_enabled: boolean
}
/** PUT /admin/settings accepts a partial update. */
export type AdminSettingsUpdate = Partial<AdminSettings>

// --- drill-down (sessions / topic+category clients) ---------
export type SessionSentiment = 'positive' | 'neutral' | 'negative'

/** Row in GET /admin/sessions and the header of a session detail. */
export interface SessionRef {
  id: string
  client_id: number | null
  client_name: string | null
  started_at: string
  ended_at: string | null
  sentiment: SessionSentiment | null
  topics: string[]
  source: string | null
}
export interface SessionsResponse {
  sessions: SessionRef[]
}

export interface SessionMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string | null
}
export interface SessionAnswer {
  question_text: string
  answer_text: string | null
  /**
   * Backend types this as `Any` — it's usually a scalar but can arrive as an
   * object (e.g. `{ value: … }`). Always coerce before rendering.
   */
  marked_value: unknown
}
/** GET /admin/sessions/{id} — full timeline. */
export interface SessionDetail extends SessionRef {
  summary: string | null
  messages: SessionMessage[]
  answers: SessionAnswer[]
  card_summary: string | null
}

/** Row returned by topic→clients, category→clients and /admin/clients. */
export interface ClientRef {
  telegram_id: number
  name: string | null
  sessions_count: number
  last_session_at: string | null
  avg_sentiment: number | null
}
export interface ClientsResponse {
  clients: ClientRef[]
}

/** AND narrows (intersection), OR widens (union). Backend default: and. */
export type ClientsMatch = 'and' | 'or'

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
