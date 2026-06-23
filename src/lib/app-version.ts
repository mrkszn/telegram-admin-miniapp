/**
 * App version surfaced in the drawer footer. Sourced at build time from
 * `package.json` via Vite's `define` step; falls back to "dev" inside test
 * environments where the global isn't injected.
 */
declare const __APP_VERSION__: string | undefined

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
