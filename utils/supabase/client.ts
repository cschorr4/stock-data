// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
    return createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return cookie ? decodeURIComponent(cookie) : undefined
        },
        set(name, value, options) {
          let cookie = `${name}=${encodeURIComponent(value)}`
          if (options.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`
          }
          if (options.path) {
            cookie += `; Path=${options.path}`
          }
          document.cookie = cookie
        },
        remove(name, options) {
          document.cookie = `${name}=; Max-Age=0; Path=${options?.path ?? '/'}`
        }
      }
    })
  }