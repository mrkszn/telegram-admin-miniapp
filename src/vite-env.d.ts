/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_AUTH_ENDPOINT: string
  readonly VITE_AUTH_WEB_ENDPOINT: string
  readonly VITE_TELEGRAM_BOT_NAME: string
  readonly VITE_APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
