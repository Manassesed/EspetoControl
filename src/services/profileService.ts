import { supabase } from "@/services/supabase";

export async function getCurrentUserProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const metadata = authData.user.user_metadata;
  const nome = typeof metadata.nome === "string" ? metadata.nome : authData.user.email?.split("@")[0] ?? "Usuario";
  const empresa = typeof metadata.empresa === "string" ? metadata.empresa : "Minha empresa";

  const { data: profile, error: profileError } = await supabase.rpc("create_initial_profile", {
    p_nome: nome,
    p_empresa: empresa,
    p_email: authData.user.email ?? ""
  });

  if (profileError) {
    throw profileError;
  }

  return profile;
}
