import React, { useEffect, useState } from 'react'
import { listAnnunci, createAnnuncio, updateAnnuncio, deleteAnnuncio as apiDeleteAnnuncio } from '../lib/annunci.api.js'
import { listUsers, updateUser, getAllUsersForAdmin } from '../lib/users.api.js'
import { listCourses, getUserEnrollments, enrollUser, unenrollUser } from '../lib/courses.api.js'
import CardGlass from '../components/CardGlass.jsx'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('annunci')
  
  // Stati per Annunci
  const [annunci, setAnnunci] = useState([])
  const [loadingAnnunci, setLoadingAnnunci] = useState(true)
  const [editingAnnuncio, setEditingAnnuncio] = useState(null)
  const [formAnnuncio, setFormAnnuncio] = useState({ titolo: '', contenuto: '', published: false })
  const [submittingAnnuncio, setSubmittingAnnuncio] = useState(false)
  
  // Stati per Utenti
  const [utenti, setUtenti] = useState([])
  const [loadingUtenti, setLoadingUtenti] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [corsi, setCorsi] = useState([])
  const [userCorsi, setUserCorsi] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })

  // Carica annunci
  const loadAnnunci = async () => {
    setLoadingAnnunci(true)
    try {
      const data = await listAnnunci()
      setAnnunci(data || [])
    } catch (error) {
      showMessage('error', 'Errore nel caricamento annunci: ' + error.message)
    }
    setLoadingAnnunci(false)
  }

  // Carica utenti
  const loadUtenti = async () => {
    setLoadingUtenti(true)
    try {
      const data = await getAllUsersForAdmin()
      setUtenti(data)
    } catch (error) {
      console.error('Errore caricamento utenti', error)
    } finally {
      setLoadingUtenti(false)
    }
  }

  // Carica corsi
  const loadCorsi = async () => {
    try {
      const data = await listCourses()
      const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome))
      setCorsi(sorted)
    } catch (error) {
      console.error('Errore caricamento corsi', error)
    }
  }

  // Carica corsi di un utente
  const loadUserCorsi = async (userId) => {
    try {
      const courses = await getUserEnrollments(userId)
      setUserCorsi(courses || [])
    } catch (error) {
      console.error('Errore caricamento corsi utente', error)
    }
  }

  useEffect(() => {
    loadAnnunci()
    loadUtenti()
    loadCorsi()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // CRUD Annunci
  const handleSubmitAnnuncio = async (e) => {
    e.preventDefault()
    setSubmittingAnnuncio(true)
    
    try {
      if (editingAnnuncio) {
        // Update
        await updateAnnuncio(editingAnnuncio.id, formAnnuncio)
        
        // Optimistic update
        setAnnunci(prev => prev.map(a => 
          a.id === editingAnnuncio.id ? { ...a, ...formAnnuncio } : a
        ))
        
        showMessage('success', 'Annuncio aggiornato con successo')
        setEditingAnnuncio(null)
      } else {
        // Create
        const newAnnuncio = await createAnnuncio(formAnnuncio)
        
        // Optimistic update
        setAnnunci(prev => [newAnnuncio, ...prev])
        showMessage('success', 'Annuncio creato con successo')
      }
      
      setFormAnnuncio({ titolo: '', contenuto: '', published: false })
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
    
    setSubmittingAnnuncio(false)
  }

  const togglePublishAnnuncio = async (annuncio) => {
    const newPublished = !annuncio.published
    
    try {
      await updateAnnuncio(annuncio.id, { published: newPublished })
      
      // Optimistic update
      setAnnunci(prev => prev.map(a => 
        a.id === annuncio.id ? { ...a, published: newPublished } : a
      ))
      
      showMessage('success', `Annuncio ${newPublished ? 'pubblicato' : 'depubblicato'}`)
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const deleteAnnuncio = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return
    
    try {
      await apiDeleteAnnuncio(id)
      
      // Optimistic update
      setAnnunci(prev => prev.filter(a => a.id !== id))
      showMessage('success', 'Annuncio eliminato')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const startEditAnnuncio = (annuncio) => {
    setEditingAnnuncio(annuncio)
    setFormAnnuncio({
      titolo: annuncio.titolo,
      contenuto: annuncio.contenuto,
      published: annuncio.published
    })
  }

  // Gestione Utenti
  const updateUserRole = async (userId, newRole) => {
    try {
      await updateUser(userId, { ruolo: newRole })
      
      // Optimistic update
      setUtenti(prev => prev.map(u => 
        u.auth_id === userId ? { ...u, ruolo: newRole } : u
      ))
      
      showMessage('success', `Ruolo aggiornato a ${newRole}`)
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const updateUserDataIscrizione = async (userId, newDate) => {
    try {
      await updateUser(userId, { data_iscrizione: newDate })
      
      // Optimistic update
      setUtenti(prev => prev.map(u => 
        u.auth_id === userId ? { ...u, data_iscrizione: newDate } : u
      ))
      
      showMessage('success', 'Data iscrizione aggiornata')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  // NOTE: toggleUserCorso logic depends on how enrollments are stored.
  // In previous turns, we decided to store courses in user profile (corso_1, corso_2, etc.) or separate collection.
  // In DashboardFiglio and AllieviDettaglio we saw fields like corso_1, corso_2...
  // However, listCourses in courses.api.js mentions 'iscrizioni' collection in getUserEnrollments.
  // We should unify this. For now, let's look at courses.api.js again.
  // Wait, I see getUserEnrollments in courses.api.js uses 'iscrizioni' collection.
  // But DashboardFiglio uses fields in user document.
  const toggleUserCorso = async (userId, corsoId, isEnrolled) => {
    try {
      if (isEnrolled) {
        // Rimuovi iscrizione
        await unenrollUser(userId, corsoId)
        setUserCorsi(prev => prev.filter(id => id !== corsoId))
      } else {
        // Aggiungi iscrizione
        await enrollUser(userId, corsoId)
        setUserCorsi(prev => [...prev, corsoId])
      }
      
      showMessage('success', `Iscrizione ${isEnrolled ? 'rimossa' : 'aggiunta'}`)
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const openUserDetail = (user) => {
    setSelectedUser(user)
    loadUserCorsi(user.auth_id)
  }

  return (
    <main className="min-h-screen p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pannello Admin</h1>
        
        {/* Tabs */}
        <div className="flex bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('annunci')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'annunci' 
                ? 'bg-indigo-500 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            Annunci
          </button>
          <button
            onClick={() => setActiveTab('utenti')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'utenti' 
                ? 'bg-indigo-500 text-white' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            Utenti
          </button>
        </div>
      </div>

      {/* Messaggi di stato */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-100'
            : 'bg-red-500/20 border-red-500/30 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Sezione Annunci */}
      {activeTab === 'annunci' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Nuovo/Modifica Annuncio */}
          <CardGlass className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAnnuncio ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
            </h2>
            
            <form onSubmit={handleSubmitAnnuncio} className="space-y-4">
              <input
                type="text"
                placeholder="Titolo"
                value={formAnnuncio.titolo}
                onChange={(e) => setFormAnnuncio(prev => ({ ...prev, titolo: e.target.value }))}
                className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              
              <textarea
                placeholder="Contenuto"
                value={formAnnuncio.contenuto}
                onChange={(e) => setFormAnnuncio(prev => ({ ...prev, contenuto: e.target.value }))}
                className="w-full px-4 py-3 min-h-[120px] bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAnnuncio.published}
                  onChange={(e) => setFormAnnuncio(prev => ({ ...prev, published: e.target.checked }))}
                  className="w-4 h-4 text-indigo-500 bg-transparent border-white/20 rounded focus:ring-indigo-500"
                />
                <span className="text-white/80">Pubblica immediatamente</span>
              </label>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingAnnuncio}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold disabled:opacity-60"
                >
                  {submittingAnnuncio ? 'Salvando...' : (editingAnnuncio ? 'Aggiorna' : 'Crea')}
                </button>
                
                {editingAnnuncio && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnnuncio(null)
                      setFormAnnuncio({ titolo: '', contenuto: '', published: false })
                    }}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                  >
                    Annulla
                  </button>
                )}
              </div>
            </form>
          </CardGlass>

          {/* Lista Annunci */}
          <CardGlass className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-4">Gestione Annunci</h2>
            
            {loadingAnnunci ? (
              <p className="text-white/70">Caricamento annunci...</p>
            ) : annunci.length === 0 ? (
              <p className="text-white/70">Nessun annuncio presente</p>
            ) : (
              <div className="space-y-4">
                {annunci.map((annuncio) => (
                  <div key={annuncio.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{annuncio.titolo}</h3>
                        <p className="text-white/70 text-sm mt-1">
                          {new Date(annuncio.created_at).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          annuncio.published 
                            ? 'bg-green-500/20 text-green-100 border border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30'
                        }`}>
                          {annuncio.published ? 'Pubblicato' : 'Bozza'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-white/80 mb-4 line-clamp-3">
                      {annuncio.contenuto}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePublishAnnuncio(annuncio)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          annuncio.published
                            ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30 hover:bg-yellow-500/30'
                            : 'bg-green-500/20 text-green-100 border border-green-500/30 hover:bg-green-500/30'
                        }`}
                      >
                        {annuncio.published ? 'Depubblica' : 'Pubblica'}
                      </button>
                      
                      <button
                        onClick={() => startEditAnnuncio(annuncio)}
                        className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-100 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-medium transition-colors"
                      >
                        Modifica
                      </button>
                      
                      <button
                        onClick={() => deleteAnnuncio(annuncio.id)}
                        className="px-3 py-1 rounded-lg bg-red-500/20 text-red-100 border border-red-500/30 hover:bg-red-500/30 text-sm font-medium transition-colors"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardGlass>
        </div>
      )}

      {/* Sezione Utenti */}
      {activeTab === 'utenti' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tabella Utenti */}
          <CardGlass className="xl:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-4">Gestione Utenti</h2>
            
            {loadingUtenti ? (
              <p className="text-white/70">Caricamento utenti...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-white/70 border-b border-white/10">
                    <tr>
                      <th className="py-3 pr-4">Nome</th>
                      <th className="py-3 pr-4">Cognome</th>
                      <th className="py-3 pr-4">Email</th>
                      <th className="py-3 pr-4">Ruolo</th>
                      <th className="py-3 pr-4">Data Iscrizione</th>
                      <th className="py-3 pr-4">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utenti.map((user) => (
                      <tr key={user.auth_id} className="border-b border-white/5">
                        <td className="py-3 pr-4">{user.nome}</td>
                        <td className="py-3 pr-4">{user.cognome}</td>
                        <td className="py-3 pr-4 text-sm text-white/70">{user.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            user.ruolo === 'admin' ? 'bg-purple-500/20 text-purple-100' :
                            user.ruolo === 'insegnante' ? 'bg-blue-500/20 text-blue-100' :
                            'bg-green-500/20 text-green-100'
                          }`}>
                            {user.ruolo}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="date"
                            value={user.data_iscrizione || ''}
                            onChange={(e) => updateUserDataIscrizione(user.auth_id, e.target.value)}
                            className="px-2 py-1 bg-transparent border border-white/20 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateUserRole(user.auth_id, 'allievo')}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                user.ruolo === 'allievo' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white/10 hover:bg-white/20 border border-white/15'
                              }`}
                            >
                              Allievo
                            </button>
                            <button
                              onClick={() => updateUserRole(user.auth_id, 'insegnante')}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                user.ruolo === 'insegnante' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white/10 hover:bg-white/20 border border-white/15'
                              }`}
                            >
                              Insegnante
                            </button>
                            <button
                              onClick={() => updateUserRole(user.auth_id, 'admin')}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                user.ruolo === 'admin' 
                                  ? 'bg-purple-500 text-white' 
                                  : 'bg-white/10 hover:bg-white/20 border border-white/15'
                              }`}
                            >
                              Admin
                            </button>
                            <button
                              onClick={() => openUserDetail(user)}
                              className="px-2 py-1 rounded text-xs bg-indigo-500 hover:bg-indigo-600 transition-colors"
                            >
                              Corsi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardGlass>

          {/* Dettaglio Utente - Gestione Corsi */}
          <CardGlass className="p-6">
            <h2 className="text-xl font-semibold mb-4">Gestione Corsi</h2>
            
            {selectedUser ? (
              <div>
                <div className="mb-4 p-3 bg-white/5 rounded-xl">
                  <h3 className="font-semibold">{selectedUser.nome} {selectedUser.cognome}</h3>
                  <p className="text-sm text-white/70">{selectedUser.email}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-white/90">Corsi disponibili:</h4>
                  {corsi.map((corso) => {
                    const isEnrolled = userCorsi.includes(corso.id)
                    return (
                      <label key={corso.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnrolled}
                          onChange={() => toggleUserCorso(selectedUser.auth_id, corso.id, isEnrolled)}
                          className="w-4 h-4 text-indigo-500 bg-transparent border-white/20 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-white/90">{corso.nome}</span>
                          {corso.descrizione && (
                            <p className="text-xs text-white/60">{corso.descrizione}</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mt-4 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            ) : (
              <p className="text-white/70">Seleziona un utente dalla tabella per gestire i suoi corsi</p>
            )}
          </CardGlass>
        </div>
      )}
    </main>
  )
}