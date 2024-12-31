import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ResponseCookie } from "next/dist/server/web/spec-extension/cookies";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              // Ensure sameSite is correctly typed
              sameSite: options.sameSite as ResponseCookie["sameSite"],
            });
          } catch (error) {
            // Handle cookie setting error in middleware
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              // Ensure sameSite is correctly typed
              sameSite: options.sameSite as ResponseCookie["sameSite"],
            });
          } catch (error) {
            // Handle cookie removal error in middleware
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
};