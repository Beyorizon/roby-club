import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

function AuthRedirect() {
  const { session, loading } = useAuth()

  // Mostra loading mentre verifica lo stato di autenticazione
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  // Se l'utente è loggato, reindirizza a /home
  if (session) {
    return <Navigate to="/home" replace />
  }

  // Se l'utente non è loggato, reindirizza a /login
  return <Navigate to="/login" replace />
}

export default AuthRedirect