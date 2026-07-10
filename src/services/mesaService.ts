import type { MesaForm } from "@/lib/schemas";
import { supabase } from "@/services/supabase";

async function ensureFreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ?? 0;
  if (Date.now() / 1000 > expiresAt - 60) {
    await supabase.auth.refreshSession();
  }
}

export async function listMesas(empresaId: string, onlyActive = false) {
  await ensureFreshToken();

  let query = supabase
    .from("mesas")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (onlyActive) {
    query = query.eq("ativa", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data;
}

export async function createMesa(empresaId: string, mesa: MesaForm) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("mesas")
    .insert({ ...mesa, empresa_id: empresaId, ativa: true });

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  const { data, error: fetchError } = await supabase
    .from("mesas")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("nome", mesa.nome)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw new Error(fetchError.message ?? JSON.stringify(fetchError));
  return data;
}

export async function updateMesa(empresaId: string, id: string, mesa: MesaForm) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("mesas")
    .update(mesa)
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  const { data, error: fetchError } = await supabase
    .from("mesas")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message ?? JSON.stringify(fetchError));
  return data;
}

export async function toggleMesa(empresaId: string, id: string, ativa: boolean) {
  await ensureFreshToken();
  const { error } = await supabase
    .from("mesas")
    .update({ ativa })
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));
}

export async function deleteMesa(empresaId: string, id: string) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("mesas")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));
}
