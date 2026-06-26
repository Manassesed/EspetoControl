import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

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
      // No web, o link de convite/recuperação chega com o token na URL.
      // No nativo, o deep link é tratado manualmente (ver app/auth/set-password.tsx).
      detectSessionInUrl: Platform.OS === "web"
    }
  }
);
