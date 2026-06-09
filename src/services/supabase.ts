import { createClient } from "@supabase/supabase-js";

import { assertSupabaseEnv, env } from "@/constants/env";
import { supabaseStorage } from "@/lib/secureStorage";
import type { Database } from "@/types/database";

assertSupabaseEnv();

export const supabase = createClient<Database>(
  env.supabaseUrl!,
  env.supabaseAnonKey!,
  {
    auth: {
      storage: supabaseStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);
