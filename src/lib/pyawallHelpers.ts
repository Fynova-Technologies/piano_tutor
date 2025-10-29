import { supabase } from "./supabaseClient";


export async function getUserUsage() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // If user doesn't exist in table, create entry
  if (error && error.code === "PGRST116") { // row not found
    const { data: newData } = await supabase
      .from("user_usage")
      .insert({ user_id: user.id })
      .select()
      .single()
    return newData
  }

  return data
}

export async function recordPlay() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { paywalled: false, error: "User not logged in" }

  const usage = await getUserUsage()
  if (!usage) return { paywalled: false, error: "Couldn't get user" }

  const oneDay = 24 * 60 * 60 * 1000
  const now = new Date()
  const lastReset = new Date(usage.last_reset)
  let playCount = usage.play_count

  // Reset if 24h passed
  if (now.getTime() - lastReset.getTime() > oneDay) {
    playCount = 0
    await supabase
      .from("user_usage")
      .update({ play_count: 0, last_reset: now })
      .eq("user_id", user.id)
  }

  // Check if paywalled
  const limit = 5
  if (!usage.is_subscribed && playCount >= limit) {
    return { paywalled: true, count: playCount }
  }

  // Increment play count
  const { data, error } = await supabase
    .from("user_usage")
    .update({ play_count: playCount + 1 })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return { paywalled: false, error: "Failed to record play" }

  return { paywalled: false, count: data.play_count }
}