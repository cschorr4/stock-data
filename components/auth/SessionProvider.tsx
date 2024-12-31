// components/auth/SessionProvider.tsx
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect } from 'react'

export function SessionProvider() {
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription }} = supabase.auth.onAuthStateChange(() => {})
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return null
}