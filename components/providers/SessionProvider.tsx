'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function SessionProvider() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          router.refresh();
        }
      });

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up auth state change listener:', error);
    }
  }, [router]);

  return null;
}

export default SessionProvider;