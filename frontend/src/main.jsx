import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0d1117',
              border: '1px solid #1c2530',
              color: '#dde5ee',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0d1117' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0d1117' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)