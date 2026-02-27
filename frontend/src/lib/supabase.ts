import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from './env'

let serverClient: SupabaseClient | null = null

export function getSupabaseServer(): SupabaseClient {
  if (!serverClient) {
    const env = getEnv()
    serverClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return serverClient
}
