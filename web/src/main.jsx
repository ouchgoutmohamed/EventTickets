import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 1. Importe tes Providers
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Ajoute le BrowserRouter pour que le routing fonctionne */}
    <BrowserRouter>
      {/* 3. Ajoute le ToastProvider pour les notifications */}
      <ToastProvider>
        {/* 4. CRUCIAL : Ajoute l'AuthProvider pour que useAuth() fonctionne */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)