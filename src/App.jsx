import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './context/AuthProvider.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
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
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
          <Navbar />
          <Routes>
            {/* Route pubbliche */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Dashboard per utenti autenticati */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Area admin - solo per admin */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect da /admin a /admin/allievi */}
              <Route index element={<Navigate to="allievi" replace />} />
              
              {/* Sottopagine admin */}
              <Route path="allievi" element={<Allievi />} />
              <Route path="allievi/:authId" element={<AllievoDettaglio />} />
              <Route path="notizie" element={<Notizie />} />
              <Route path="riepilogo" element={<Riepilogo />} />
            </Route>
            
            {/* Fallback per route non trovate */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App