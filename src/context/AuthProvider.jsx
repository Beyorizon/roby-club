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

  // Sign out con pulizia completa e reload forzato
  const signOut = async () => {
    console.log('🔄 [DEBUG] Logout clicked')
    
    try {
      // 1. Esegui supabase.auth.signOut()
      console.log('🚀 [DEBUG] Calling supabase.auth.signOut()...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ [DEBUG] Supabase signOut error:', error)
        // Continua comunque con la pulizia locale
      } else {
        console.log('✅ [DEBUG] Supabase signOut done')
      }
      
      // 2. Pulizia localStorage e IndexedDB
      console.log('🧹 [DEBUG] Starting local storage and IndexedDB cleanup...')
      
      // Rimuovi token generici
      localStorage.removeItem('supabase.auth.token')
      
      // Rimuovi token specifici per questo progetto Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (supabaseUrl) {
        const urlPart = supabaseUrl.split('://')[1]
        localStorage.removeItem(`sb-${urlPart}-auth-token`)
        console.log(`🗑️ [DEBUG] Removed sb-${urlPart}-auth-token from localStorage`)
      }
      
      // Rimuovi tutti i possibili token Supabase dal localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ [DEBUG] Removed ${key} from localStorage`)
      })
      
      // Pulizia IndexedDB
      try {
        if ('indexedDB' in window) {
          await new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase('supabase-auth')
            deleteReq.onsuccess = () => {
              console.log('🗑️ [DEBUG] IndexedDB supabase-auth deleted successfully')
              resolve()
            }
            deleteReq.onerror = () => {
              console.log('⚠️ [DEBUG] IndexedDB deletion failed or database did not exist')
              resolve() // Non bloccare il processo
            }
            deleteReq.onblocked = () => {
              console.log('⚠️ [DEBUG] IndexedDB deletion blocked')
              resolve() // Non bloccare il processo
            }
          })
        }
      } catch (dbError) {
        console.log('⚠️ [DEBUG] IndexedDB cleanup error:', dbError.message)
      }
      
      console.log('✅ [DEBUG] Local storage and IndexedDB cleared')
      
      // 3. Reset dello stato locale
      setIsAdmin(false)
      setUserProfile(null)
      setSession(null)
      setUser(null)
      
      // 4. Reload forzato della pagina
      console.log('🔄 [DEBUG] Reloading page…')
      
      // Piccolo delay per permettere ai log di essere visualizzati
      setTimeout(() => {
        window.location.reload()
      }, 100)
      
    } catch (err) {
      console.error('💥 [DEBUG] SignOut error:', {
        message: err.message,
        name: err.name,
        stack: err.stack?.slice(0, 200)
      })
      
      // Anche in caso di errore, esegui la pulizia locale e il reload
      setIsAdmin(false)
      setUserProfile(null)
      setSession(null)
      setUser(null)
      
      console.log('🔄 [DEBUG] Reloading page after error…')
      setTimeout(() => {
        window.location.reload()
      }, 100)
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
        // Modifica: usa fallback via email per admin
        const isEmailAdmin = user?.email && ADMIN_EMAILS.has(user.email)
        setIsAdmin(isEmailAdmin)
        return
      }

      if (!isMounted) return
      setUserProfile(data || null)
      // Modifica: considera sia ruolo del profilo che fallback email
      const isEmailAdmin = user?.email && ADMIN_EMAILS.has(user.email)
      const isRoleAdmin = typeof data?.ruolo === 'string' && data.ruolo.toLowerCase() === 'admin'
      setIsAdmin(isRoleAdmin || isEmailAdmin)
    }

    const init = async () => {
      try {
        console.log('🔄 [DEBUG] Starting auth initialization...')
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('[supabase] getSession error:', error?.message || error?.code || 'unknown')
        }
        console.log('📋 [DEBUG] Initial session:', !!initialSession)
        if (!isMounted) return
        setSession(initialSession || null)
        setUser(initialSession?.user ?? null)
        await fetchProfile(initialSession?.user?.id || null)
      } catch (err) {
        console.error('[auth] init error:', err?.message || 'unknown')
      } finally {
        if (isMounted) {
          console.log('✅ [DEBUG] Auth initialization complete, setting loading to false')
          setLoading(false)
        }
      }
    }

    // Timeout di sicurezza per evitare loading infinito
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⚠️ [DEBUG] Safety timeout triggered - forcing loading to false')
        setLoading(false)
      }
    }, 10000) // 10 secondi

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
          setLoading(false) // Assicurati che loading sia false dopo logout
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
      
      // Assicurati sempre che loading sia false dopo ogni cambio di stato
      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe?.()
      clearTimeout(safetyTimeout)
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

// Aggiunta: fallback per riconoscere admin tramite email
const ADMIN_EMAILS = new Set(['grafica.valeriobottiglieri@gmail.com'])