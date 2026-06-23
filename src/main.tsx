import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/geist/index.css'
import '@fontsource-variable/geist-mono/index.css'
// Instrument Serif removed — headings now use Geist (see tokens.css).
// Re-add imports if you flip --font-head back to 'Instrument Serif'.

import './styles/tokens.css'
import './styles/globals.css'

import { App } from './App'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
