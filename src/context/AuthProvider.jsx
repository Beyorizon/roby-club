import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  logout: async () => {},
  logUserUUID: async () => {}
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Calcola isAdmin dal profilo
  const isAdmin = useMemo(() => {
    return profile?.ruolo?.toLowerCase() === 'admin'
  }, [profile])

  // Funzione per stampare UUID utente in console
  const logUserUUID = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Errore nel recupero utente:', error.message)
        return
      }
      
      if (user) {
        console.log('🔑 UUID UTENTE LOGGATO:')
        console.log('📋 ID da copiare:', user.id)
        console.log('📧 Email:', user.email)
        console.log('📅 Creato il:', new Date(user.created_at).toLocaleString('it-IT'))
        console.log('✅ Confermato:', user.email_confirmed_at ? 'Sì' : 'No')
        console.log('---')
        console.log('💡 Copia questo UUID per inserirlo nel DB:', user.id)
      } else {
        console.log('❌ NESSUN UTENTE LOGGATO')
        console.log('💡 Effettua il login per vedere l\'UUID')
      }
    } catch (err) {
      console.error('💥 Errore critico nel recupero UUID:', err)
    }
  }

  // Funzione per ricaricare il profilo
  const refreshProfile = async () => {
    if (!user?.id) {
      setProfile(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('utenti')
        .select('id, nome, cognome, ruolo, email')
        .eq('auth_id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('Profile load error:', error.message)
        setProfile(null)
        return null
      }
      
      if (data) {
        setProfile(data)
        return data
      } else {
        // Nessuna riga trovata - utente appena creato
        console.warn('No profile found for user:', user.id)
        setProfile(null)
        return null
      }
    } catch (err) {
      console.error('Profile load exception:', err.message)
      setProfile(null)
      return null
    }
  }

  // Gestione centralizzata della sessione
  useEffect(() => {
    let isMounted = true

    // Carica sessione iniziale
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('❌ Errore caricamento sessione iniziale:', error.message)
        }
        
        if (!isMounted) return
        
        const currentSession = data?.session ?? null
        const currentUser = currentSession?.user ?? null
        
        setSession(currentSession)
        setUser(currentUser)
        
        // Se c'è un utente, carica il profilo
        if (currentUser?.id) {
          console.log('🔄 Caricamento profilo utente esistente...')
          await refreshProfile()
          // Log UUID per utente esistente
          setTimeout(() => {
            logUserUUID()
          }, 500)
        }
      } catch (err) {
        console.error('💥 Errore critico inizializzazione sessione:', err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initSession()

    // Listener centralizzato per cambiamenti di autenticazione
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return
      
      console.log('🔄 Auth state change:', event)
      
      if (event === 'SIGNED_IN') {
        console.log('✅ Utente loggato')
        
        // Recupera dati utente con getUser()
        try {
          const { data: { user: authUser }, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error('❌ Errore recupero dati utente:', error.message)
            return
          }
          
          if (authUser) {
            setSession(newSession)
            setUser(authUser)
            
            // Carica profilo dal database
            try {
              const { data: userData, error: userError } = await supabase
                .from('utenti')
                .select('id, nome, cognome, ruolo, email, auth_id')
                .eq('auth_id', authUser.id)
                .maybeSingle()
              
              if (userError) {
                console.error('❌ Errore caricamento profilo:', userError.message)
                setProfile(null)
              } else if (userData) {
                setProfile(userData)
                console.log('👤 Profilo caricato:')
                console.log('📋 auth_id:', userData.auth_id)
                console.log('👤 ruolo:', userData.ruolo)
                console.log('📧 email:', userData.email)
                console.log('✅ Conferma email:', authUser.email_confirmed_at ? 'Sì' : 'No')
              } else {
                console.warn('⚠️ Nessun profilo trovato per auth_id:', authUser.id)
                setProfile(null)
              }
            } catch (profileErr) {
              console.error('💥 Errore critico caricamento profilo:', profileErr)
              setProfile(null)
            }
            
            // Log UUID dopo login
            setTimeout(() => {
              logUserUUID()
            }, 500)
          }
        } catch (getUserErr) {
          console.error('💥 Errore critico getUser():', getUserErr)
        }
        
        setLoading(false)
        
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Utente disconnesso')
        
        // NON chiamare supabase.auth.getUser() su SIGNED_OUT
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        
        // Log disconnessione
        console.log('❌ NESSUN UTENTE LOGGATO')
        console.log('💡 Effettua il login per vedere l\'UUID')
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Errore logout:', error.message)
      }
    } catch (err) {
      console.error('💥 Errore critico logout:', err.message)
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
      logout,
      logUserUUID
    }),
    [session, user, profile, loading, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}