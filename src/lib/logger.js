import supabase from "./supabase"

export async function sendLog(context, message, data = {}) {
  try {
    await supabase.from("logs").insert({
      context,
      message,
      data
    })
  } catch (error) {
    console.error("[Logger] Errore inserimento log:", error)
  }
}