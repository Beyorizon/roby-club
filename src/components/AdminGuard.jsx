import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

function AdminGuard({ children }) {
  const { session, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin-login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />
  }

  return children
}

export default AdminGuard