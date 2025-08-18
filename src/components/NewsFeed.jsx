import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase.js'
import CardGlass from './CardGlass.jsx'
import { timeAgo } from '../lib/timeAgo.js'

const PAGE_SIZE = 10

export default function NewsFeed() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const fetchPage = async (pageIndex, append = false) => {
    const from = pageIndex * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('annunci')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }
    const chunk = data ?? []
    if (append) {
      setItems((prev) => [...prev, ...chunk])
    } else {
      setItems(chunk)
    }
    if (chunk.length < PAGE_SIZE) {
      setHasMore(false)
    } else {
      setHasMore(true)
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        await fetchPage(0, false)
        if (active) {
          setPage(0)
        }
      } catch (e) {
        if (active) setError(e.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setError(null)
    const next = page + 1
    try {
      await fetchPage(next, true)
      setPage(next)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Ultime notizie</h2>

      {loading && (
        <p className="text-white/70">Caricamento…</p>
      )}

      {!loading && error && (
        <p className="text-red-400">Errore: {error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-white/70">Nessun annuncio disponibile</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((a) => (
            <CardGlass key={a.id} className="p-4 text-left">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold">{a.titolo ?? 'Annuncio'}</h3>
                <span className="text-xs text-white/60 whitespace-nowrap">
                  {a.created_at ? timeAgo(a.created_at) : ''}
                </span>
              </div>
              <p className="text-white/80 mt-2">
                {(a.testo ?? '').length > 180
                  ? `${(a.testo ?? '').slice(0, 180)}…`
                  : (a.testo ?? '')}
              </p>
            </CardGlass>
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <div>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition disabled:opacity-60"
          >
            {loadingMore ? 'Caricamento…' : 'Carica altri'}
          </button>
        </div>
      )}
    </section>
  )
}