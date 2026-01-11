import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { sendLog } from '../lib/logger'

function AuthRedirect() {
  const { user, loading } = useAuth()

  useEffect(() => {
    sendLog('App', 'Render principale AuthRedirect', { 
      loading, 
      hasUser: !!user,
      userId: user?.uid 
    })
  }, [loading, user])

  // Mostra loading mentre verifica lo stato di autenticazione
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  // Se l'utente è loggato, reindirizza a /home
  if (user) {
    console.log('[AuthRedirect] User authenticated, redirecting to /home', user.uid);
    return <Navigate to="/home" replace />
  }

  // Se l'utente non è loggato, reindirizza a /login
  console.log('[AuthRedirect] No user, redirecting to /login');
  return <Navigate to="/login" replace />
}

export default AuthRedirect