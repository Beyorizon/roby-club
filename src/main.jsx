import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker with auto-update
registerSW({ 
  immediate: true,
  onNeedRefresh() {
    if (import.meta.env.DEV) console.log('New content available, will update...')
  },
  onOfflineReady() {
    if (import.meta.env.DEV) console.log('App ready to work offline')
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
