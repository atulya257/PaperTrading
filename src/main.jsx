import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/page.css'
import App from './App.jsx'
import { removeOlderVersions } from './services/storage.js'
import { startTheme } from './services/theme.js'
import './styles/a11y.css'

// Data saved by version 1 of the app is no longer used
removeOlderVersions('tradelab:v2:')
startTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
