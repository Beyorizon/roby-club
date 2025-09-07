import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthProvider from './context/AuthProvider.jsx'
import UserGuard from './components/UserGuard.jsx'
import AdminGuard from './components/AdminGuard.jsx'
import Navbar from './components/Navbar.jsx'

// Pagine pubbliche
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import SignupGenitore from './pages/SignupGenitore.jsx'
import SignupAllievo from './pages/SignupAllievo.jsx'
import Orari from './pages/Orari.jsx'
import Notizie from './pages/Notizie.jsx'

// Dashboard
import DashboardUtente from './pages/DashboardUtente.jsx'
import AggiungiFiglio from './pages/AggiungiFiglio.jsx'
import DashboardFiglio from './pages/DashboardFiglio.jsx'

// Admin Layout e Pagine
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Allievi from './pages/admin/Allievi.jsx'
import AllievoDettaglio from './pages/admin/AllievoDettaglio.jsx'
import NotizieAdmin from './pages/admin/NotizieAdmin.jsx'
import Riepilogo from './pages/admin/Riepilogo.jsx'

import './App.css'

function AppContent() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/signup-genitore' || location.pathname === '/signup-allievo'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-x-hidden">
      {!hideNavbar && <Navbar />}
      <main className="pt-0">
        <Routes>
          {/* Route principale - Login obbligatorio */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup-genitore" element={<SignupGenitore />} />
          <Route path="/signup-allievo" element={<SignupAllievo />} />
          
          {/* Pagine protette - richiedono autenticazione */}
          <Route path="/home" element={<UserGuard><Home /></UserGuard>} />
          <Route path="/orari" element={<UserGuard><Orari /></UserGuard>} />
          <Route path="/notizie" element={<UserGuard><Notizie /></UserGuard>} />
          <Route path="/orari" element={<Orari />} />
          <Route path="/notizie" element={<Notizie />} />

          {/* Dashboard unificata per utenti autenticati */}
          <Route 
            path="/dashboard-utente" 
            element={
              <UserGuard>
                <DashboardUtente />
              </UserGuard>
            } 
          />
          {/* Redirect delle vecchie route */}
          <Route 
            path="/aggiungi-figlio" 
            element={
              <UserGuard>
                <AggiungiFiglio />
              </UserGuard>
            } 
          />
          <Route 
            path="/figlio/:id" 
            element={
              <UserGuard>
                <DashboardFiglio />
              </UserGuard>
            } 
          />

          {/* Area admin protetta */}
          <Route 
            path="/admin/*" 
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="allievi" replace />} />
            <Route path="allievi" element={<Allievi />} />
            <Route path="allievi/:id" element={<AllievoDettaglio />} />
            <Route path="notizie" element={<NotizieAdmin />} />
            <Route path="riepilogo" element={<Riepilogo />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
