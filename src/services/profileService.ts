import { supabase } from "@/services/supabase";

export async function loadProfileForUser(userId: string, email?: string, meta?: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  // profile doesn't exist yet — create it
  const nome = typeof meta?.nome === "string" ? meta.nome : email?.split("@")[0] ?? "Usuario";
  const empresa = typeof meta?.empresa === "string" ? meta.empresa : "Minha Empresa";

  const { data: profile, error: rpcError } = await supabase.rpc("create_initial_profile", {
    p_nome: nome,
    p_empresa: empresa,
    p_email: email ?? ""
  });

  if (rpcError) throw rpcError;
  return profile;
}

export async function getCurrentUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const { user } = session;
  return loadProfileForUser(user.id, user.email ?? undefined, user.user_metadata);
}
