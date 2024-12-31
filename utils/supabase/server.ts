// utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Handle cookie setting error in middleware
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete(name, options)
          } catch {
            // Handle cookie removal error in middleware
          }
        }
      },
    }
  );
};
