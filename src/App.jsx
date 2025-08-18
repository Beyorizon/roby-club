import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './context/AuthProvider.jsx'
import UserGuard from './components/UserGuard.jsx'
import AdminGuard from './components/AdminGuard.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'

// Admin Layout e Pagine
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Allievi from './pages/admin/Allievi.jsx'
import AllievoDettaglio from './pages/admin/AllievoDettaglio.jsx'
import Notizie from './pages/admin/Notizie.jsx'
import Riepilogo from './pages/admin/Riepilogo.jsx'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 overflow-x-hidden">
          <Navbar />
          <main className="pt-14">
            <Routes>
              {/* Route pubbliche */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Dashboard per utenti autenticati */}
              <Route 
                path="/dashboard" 
                element={
                  <UserGuard>
                    <Dashboard />
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
                <Route path="allievi/:authId" element={<AllievoDettaglio />} />
                <Route path="notizie" element={<Notizie />} />
                <Route path="riepilogo" element={<Riepilogo />} />
              </Route>
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App