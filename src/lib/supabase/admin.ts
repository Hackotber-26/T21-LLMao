import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Service role Supabase client for privileged backend-only tasks
 * (e.g., administrative synchronization, system setup, or bypassing RLS where strictly needed).
 * 
 * NEVER EXPOSE THIS CLIENT OR THE SERVICE ROLE KEY TO THE CLIENT/BROWSER.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL and SUPABASE_SERVICE_ROLE_KEY must be configured for admin client');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
