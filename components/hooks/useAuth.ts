// hooks/useAuth.ts
import { createClient } from '@/utils/supabase/client';

export const useAuth = () => {
  const supabase = createClient();
  
  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('Not authenticated');
    return user;
  };

  return { getCurrentUser, supabase };
};