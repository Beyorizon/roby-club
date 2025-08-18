import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const isActive = (path) => {
    if (path === '/admin' && location.pathname.startsWith('/admin')) {
      return true
    }
    return location.pathname === path
  }

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              RC
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Roby Club
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                isActive('/') ? 'bg-white/10 text-white' : ''
              }`}
            >
              Home
            </Link>
            
            {/* Link condizionali basati su autenticazione e ruolo */}
            {user && !isAdmin && (
              <Link 
                to="/dashboard" 
                className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                  isActive('/dashboard') ? 'bg-white/10 text-white' : ''
                }`}
              >
                Dashboard
              </Link>
            )}
            
            {isAdmin && (
              <Link 
                to="/admin/allievi" 
                className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                  isActive('/admin') ? 'bg-white/10 text-white' : ''
                }`}
              >
                Admin
              </Link>
            )}
            
            {/* Autenticazione */}
            {!user ? (
              <Link 
                to="/login" 
                className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                  isActive('/login') ? 'bg-white/10 text-white' : ''
                }`}
              >
                Login
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-white/60 text-sm">
                  {profile?.nome || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white/80 hover:text-white p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                onClick={() => setIsMenuOpen(false)}
                className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                  isActive('/') ? 'bg-white/10 text-white' : ''
                }`}
              >
                Home
              </Link>
              
              {user && !isAdmin && (
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                    isActive('/dashboard') ? 'bg-white/10 text-white' : ''
                  }`}
                >
                  Dashboard
                </Link>
              )}
              
              {isAdmin && (
                <Link 
                  to="/admin/allievi" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                    isActive('/admin') ? 'bg-white/10 text-white' : ''
                  }`}
                >
                  Admin
                </Link>
              )}
              
              {!user ? (
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10 ${
                    isActive('/login') ? 'bg-white/10 text-white' : ''
                  }`}
                >
                  Login
                </Link>
              ) : (
                <div className="flex flex-col space-y-2">
                  <span className="text-white/60 text-sm px-3 py-2">
                    {profile?.nome || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-left text-white/80 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}