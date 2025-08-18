import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import CardGlass from '../../components/CardGlass.jsx'

export default function AdminLayout() {
  const location = useLocation()
  
  const navItems = [
    { path: '/admin/allievi', label: 'Allievi', icon: '👥' },
    { path: '/admin/notizie', label: 'Notizie', icon: '📰' },
    { path: '/admin/riepilogo', label: 'Riepilogo', icon: '📊' }
  ]

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Pannello Amministrazione
          </h1>
        </div>

        {/* Navigation Tabs */}
        <CardGlass className="p-1">
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                              (item.path === '/admin/allievi' && location.pathname.startsWith('/admin/allievi'))
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </CardGlass>

        {/* Content Area */}
        <CardGlass className="min-h-[600px]">
          <Outlet />
        </CardGlass>
      </div>
    </main>
  )
}