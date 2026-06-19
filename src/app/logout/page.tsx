"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/browserclient"
import { useRouter } from "next/navigation"

export default function LogoutButton({ onAfterSignOut }: { onAfterSignOut?: () => void }) {
  const router = useRouter()

  const handleLogout = async () => {
    onAfterSignOut?.()
    await getSupabaseBrowserClient().auth.signOut()
    router.push("/login") // redirect to login page
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300"
    >
      Logout
    </button>
  )
}