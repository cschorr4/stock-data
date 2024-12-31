'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

export function UserInfo() {
  const [email, setEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)
    }
    getUser()
    supabase.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return email ? (
    <div className="flex items-center gap-4">
      <span>{email}</span>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  ) : null
}

export default UserInfo;