import type { ProductForm } from "@/lib/schemas";
import { supabase } from "@/services/supabase";

export async function listProducts(empresaId: string, onlyActive = false) {
  let query = supabase
    .from("produtos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (onlyActive) {
    query = query.eq("ativo", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function createProduct(empresaId: string, product: ProductForm) {
  const { data, error } = await supabase
    .from("produtos")
    .insert({ ...product, empresa_id: empresaId, ativo: true })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProduct(empresaId: string, id: string, product: ProductForm) {
  const { data, error } = await supabase
    .from("produtos")
    .update(product)
    .eq("id", id)
    .eq("empresa_id", empresaId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleProduct(empresaId: string, id: string, ativo: boolean) {
  const { error } = await supabase.from("produtos").update({ ativo }).eq("id", id).eq("empresa_id", empresaId);

  if (error) {
    throw error;
  }
}
