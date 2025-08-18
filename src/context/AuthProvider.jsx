import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  userProfile: null,
  signIn: async () => {},
  signOut: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  // Check if user is admin
  const checkAdminStatus = async (user) => {
    if (!user) {
      setIsAdmin(false)
      setUserProfile(null)
      return
    }

    try {
      // Controllo diretto email admin
      const adminEmail = 'grafica.valeriobottiglieri@gmail.com'
      const isUserAdmin = user.email === adminEmail
      setIsAdmin(isUserAdmin)

      // Carica profilo utente
      const { data: profile, error } = await supabase
        .from('utenti')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (!error && profile) {
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Errore controllo admin:', error)
      // Non forzare isAdmin a false in caso di errore profilo
      setUserProfile(null)
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return data
  }

  // Sign out con debug ultra-dettagliato
  const signOut = async () => {
    console.log('🔄 [DEBUG] Calling supabase.auth.signOut()')
    
    // Log configurazione Supabase
    console.log('🔧 [DEBUG] Supabase config:', {
      url: import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.slice(0, 30)}...` : 'MISSING',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 10)}...` : 'MISSING',
      hasClient: !!supabase,
      hasAuth: !!supabase?.auth,
      currentSession: !!session
    })
    
    try {
      // Metodo alternativo: reset manuale se signOut fallisce
      let signOutSuccess = false
      
      try {
        console.log('🚀 [DEBUG] Attempting supabase.auth.signOut()...')
        const result = await supabase.auth.signOut()
        console.log('📋 [DEBUG] SignOut result:', result)
        
        if (result.error) {
          console.error('❌ [DEBUG] SignOut returned error:', {
            message: result.error.message,
            status: result.error.status,
            code: result.error.code,
            name: result.error.name,
            details: result.error.details
          })
          throw result.error
        }
        
        signOutSuccess = true
        console.log('✅ [DEBUG] Supabase signOut completed successfully')
        
      } catch (signOutError) {
        console.error('💥 [DEBUG] SignOut failed with error:', {
          message: signOutError.message,
          name: signOutError.name,
          status: signOutError.status,
          code: signOutError.code,
          stack: signOutError.stack?.slice(0, 300)
        })
        
        // Fallback: reset manuale dello stato
        console.log('🔄 [DEBUG] Attempting manual state reset as fallback...')
        signOutSuccess = false
      }
      
      // Reset dello stato locale (sempre, anche se signOut fallisce)
      setIsAdmin(false)
      setUserProfile(null)
      setSession(null)
      setUser(null)
      
      console.log('🧹 [DEBUG] Auth state cleared locally')
      
      // Se signOut è fallito, forza un refresh della pagina come ultima risorsa
      if (!signOutSuccess) {
        console.log('🔄 [DEBUG] SignOut failed, will force page reload after navigation')
        // Non facciamo reload qui, lo faremo dopo navigate
      }
      
    } catch (err) {
      console.error('💥 [DEBUG] SignOut outer catch error:', {
        message: err.message,
        name: err.name,
        stack: err.stack?.slice(0, 200)
      })
      
      // Anche in caso di errore totale, resettiamo lo stato locale
      setIsAdmin(false)
      setUserProfile(null)
      setSession(null)
      setUser(null)
      console.log('🧹 [DEBUG] Auth state cleared after error')
      
      // Non rilanciamo l'errore per permettere la navigazione
    }
  }

  useEffect(() => {
    let isMounted = true
    const lastFetchedAuthIdRef = { current: null }

    const fetchProfile = async (authId) => {
      if (!authId) return

      // evita doppi fetch (init + INITIAL_SESSION/SIGNED_IN)
      if (lastFetchedAuthIdRef.current === authId) return
      lastFetchedAuthIdRef.current = authId

      const { data, error } = await supabase
        .from('utenti')
        .select('*')
        .eq('auth_id', authId)
        .single()

      if (error) {
        console.error('[supabase] utenti fetch error:', error?.message || error?.code || 'unknown')
        if (!isMounted) return
        setUserProfile(null)
        setIsAdmin(false)
        return
      }

      if (!isMounted) return
      setUserProfile(data || null)
      setIsAdmin((data?.ruolo || '') === 'admin')
    }

    const init = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('[supabase] getSession error:', error?.message || error?.code || 'unknown')
        }
        if (!isMounted) return
        setSession(initialSession || null)
        setUser(initialSession?.user ?? null)
        await fetchProfile(initialSession?.user?.id || null)
      } catch (err) {
        console.error('[auth] init error:', err?.message || 'unknown')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Log dettagliato per ogni evento auth
      console.log(`🔔 [DEBUG] Auth state changed: ${event}, session: ${!!newSession}`)
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 [DEBUG] SIGNED_OUT event received - logout successful')
        // Assicuriamoci che lo stato sia pulito
        if (isMounted) {
          setSession(null)
          setUser(null)
          setUserProfile(null)
          setIsAdmin(false)
        }
      }

      if (!isMounted) return
      setSession(newSession || null)
      setUser(newSession?.user ?? null)

      if (newSession?.user?.id) {
        await fetchProfile(newSession.user.id)
      } else {
        setUserProfile(null)
        setIsAdmin(false)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe?.()
    }
  }, [])

  const value = {
    session,
    user,
    loading,
    isAdmin,
    userProfile,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}