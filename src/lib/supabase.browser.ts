import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let _client: SupabaseClient | null = null;

/**
 * Returns a singleton browser-side Supabase client.
 * Uses the ANON (public) key — safe to expose in the browser bundle.
 * The service-role key lives only in createServerFn handlers (config.server.ts).
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error(
      "VITE_SUPABASE_URL is not set. Add it to .env.local (copy from SUPABASE_URL value)."
    );
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}
