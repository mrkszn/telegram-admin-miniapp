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
