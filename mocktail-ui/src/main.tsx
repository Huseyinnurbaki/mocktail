import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initTheme } from './lib/theme'
import { initAdminKey } from './lib/auth'

// Pull the admin key out of the URL fragment (#admin_key=...) before any /core/v1/* request fires.
initAdminKey()
initTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
