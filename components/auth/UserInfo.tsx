'use client'
import { Button } from "@/components/ui/button"
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from "react"
import { AuthDialog } from './AuthDialog'

export default function AuthButton() {
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return email ? (
    <Button onClick={handleSignOut}>Sign Out</Button>
  ) : (
    <AuthDialog />
  )
}
