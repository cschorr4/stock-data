'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export function SessionProvider() {
  const [session, setSession] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  return null
}