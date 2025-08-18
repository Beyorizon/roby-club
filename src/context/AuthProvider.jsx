import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  logout: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Calcola isAdmin dal profilo
  const isAdmin = useMemo(() => {
    return profile?.ruolo === 'admin'
  }, [profile])

  // Funzione per ricaricare il profilo
  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('utenti')
        .select('*')
        .eq('auth_id', user.id)
        .single()
      
      if (error) {
        console.warn('Profile load error:', error.message)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.warn('Profile load exception:', err.message)
      setProfile(null)
    }
  }

  // Carica sessione iniziale
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error.message)
        }
        if (!isMounted) return
        
        setSession(data?.session ?? null)
        setUser(data?.session?.user ?? null)
      } catch (err) {
        console.error('Session init error:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    // Sottoscrizione ai cambiamenti di autenticazione
    const {
      data: authListener
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return
      
      setSession(newSession)
      setUser(newSession?.user ?? null)
      
      // Se l'utente si è disconnesso, pulisci il profilo
      if (!newSession?.user) {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Carica profilo quando cambia l'utente
  useEffect(() => {
    if (user?.id) {
      refreshProfile()
    } else {
      setProfile(null)
    }
  }, [user?.id])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error.message)
      }
    } catch (err) {
      console.error('Logout exception:', err.message)
    }
  }

  const value = useMemo(
    () => ({ 
      session, 
      user, 
      profile, 
      loading, 
      isAdmin, 
      refreshProfile, 
      logout 
    }),
    [session, user, profile, loading, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}