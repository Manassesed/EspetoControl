import type { ProductForm } from "@/lib/schemas";
import { supabase } from "@/services/supabase";

async function ensureFreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ?? 0;
  if (Date.now() / 1000 > expiresAt - 60) {
    await supabase.auth.refreshSession();
  }
}

export async function listProducts(empresaId: string, onlyActive = false) {
  await ensureFreshToken();

  let query = supabase
    .from("produtos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (onlyActive) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data;
}

export async function createProduct(empresaId: string, product: ProductForm) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("produtos")
    .insert({ ...product, empresa_id: empresaId, ativo: true });

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  const { data, error: fetchError } = await supabase
    .from("produtos")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("nome", product.nome)
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw new Error(fetchError.message ?? JSON.stringify(fetchError));
  return data;
}

export async function updateProduct(empresaId: string, id: string, product: ProductForm) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("produtos")
    .update(product)
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  const { data, error: fetchError } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message ?? JSON.stringify(fetchError));
  return data;
}

export async function toggleProduct(empresaId: string, id: string, ativo: boolean) {
  await ensureFreshToken();
  const { error } = await supabase
    .from("produtos")
    .update({ ativo })
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));
}

export async function deleteProduct(empresaId: string, id: string) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));
}
