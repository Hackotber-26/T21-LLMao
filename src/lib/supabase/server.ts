import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export async function createClient() {
  let cookieStore: { getAll: () => any[]; setAll: (cookiesToSet: any[]) => void } = {
    getAll: () => [],
    setAll: () => {},
  };

  try {
    const nextCookies = await cookies();
    cookieStore = {
      getAll: () => nextCookies.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            nextCookies.set(name, value, options)
          );
        } catch {
          // Ignored in Server Components
        }
      },
    };
  } catch {
    // Outside request context (e.g. testing or CLI scripts)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieStore,
  });
}

/**
 * Helper to fetch the authenticated user on the server side.
 * Returns null if unauthenticated.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
