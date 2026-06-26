import { supabase } from "@/services/supabase";
import type { AccessRole, Usuario } from "@/types/database";

export async function listTeam(empresaId: string): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function inviteMember(email: string, role: AccessRole) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada, faça login novamente.");

  const { data, error } = await supabase.functions.invoke("invite-member", {
    body: { email, role },
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { ok: true; userId?: string; resent?: boolean };
}

export async function resendInvite(email: string, role: AccessRole) {
  return inviteMember(email, role);
}

/** Manda o próprio usuário definir uma nova senha por email. O gerente nunca vê a senha. */
export async function resetMemberPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function updateMemberRole(userId: string, role: AccessRole) {
  const { data, error } = await supabase.rpc("update_member_role", {
    p_user_id: userId,
    p_role: role
  });
  if (error) throw error;
  return data as Usuario;
}

export async function updateMemberStatus(userId: string, status: "ativo" | "inativo") {
  const { data, error } = await supabase.rpc("update_member_status", {
    p_user_id: userId,
    p_status: status
  });
  if (error) throw error;
  return data as Usuario;
}
