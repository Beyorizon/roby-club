import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase.js"

import DashboardAllievo from "./DashboardAllievo.jsx"

function DashboardFiglio() {
  const { id } = useParams()
  const [allievo, setAllievo] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from("utenti")
        .select("*")
        .eq("id", id)
        .single()
      setAllievo(data)
    }
    if (id) loadData()
  }, [id])

  if (!allievo) {
    return <div className="p-6 text-white">Caricamento dati figlio...</div>
  }

  // Riutilizza la dashboard allievo ma passando i dati del figlio
  return <DashboardAllievo allievoOverride={allievo} />
}

export default DashboardFiglio
