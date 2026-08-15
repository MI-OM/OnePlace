import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-side operations that must bypass RLS
 * (e.g. inserting AI/system messages and reading member-only knowledge).
 * Never import this from client components.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
