import type { Comanda, ComandaItem, PaymentMethod } from "@/types/database";
import { supabase } from "@/services/supabase";

async function ensureFreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ?? 0;
  if (Date.now() / 1000 > expiresAt - 60) {
    await supabase.auth.refreshSession();
  }
}

export type ComandaComItens = Comanda & { comanda_itens: ComandaItem[] };

export type ComandaItemDetalhe = ComandaItem & {
  produtos: { nome: string; categoria: string } | null;
};

export type ComandaDetalhe = Comanda & { comanda_itens: ComandaItemDetalhe[] };

export async function listComandasAbertas(empresaId: string): Promise<ComandaComItens[]> {
  await ensureFreshToken();

  const { data, error } = await supabase
    .from("comandas")
    .select("*, comanda_itens(*)")
    .eq("empresa_id", empresaId)
    .eq("status", "aberta");

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return (data ?? []) as unknown as ComandaComItens[];
}

export async function getComanda(comandaId: string): Promise<ComandaDetalhe> {
  await ensureFreshToken();

  const { data, error } = await supabase
    .from("comandas")
    .select("*, comanda_itens(*, produtos(nome, categoria))")
    .eq("id", comandaId)
    .single();

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data as unknown as ComandaDetalhe;
}

export async function abrirComanda(mesaId: string): Promise<Comanda> {
  await ensureFreshToken();
  const { data, error } = await supabase.rpc("abrir_comanda", { p_mesa_id: mesaId });
  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data as Comanda;
}

export async function incrementarItem(comandaId: string, produtoId: string, delta: number) {
  await ensureFreshToken();
  const { error } = await supabase.rpc("comanda_incrementar_item", {
    p_comanda_id: comandaId,
    p_produto_id: produtoId,
    p_delta: delta
  });
  if (error) throw new Error(error.message ?? JSON.stringify(error));
}

export async function definirItem(comandaId: string, produtoId: string, quantidade: number) {
  await ensureFreshToken();
  const { error } = await supabase.rpc("comanda_definir_item", {
    p_comanda_id: comandaId,
    p_produto_id: produtoId,
    p_quantidade: quantidade
  });
  if (error) throw new Error(error.message ?? JSON.stringify(error));
}

export async function fecharComanda(comandaId: string, formaPagamento: PaymentMethod) {
  await ensureFreshToken();
  const { data, error } = await supabase.rpc("fechar_comanda", {
    p_comanda_id: comandaId,
    p_forma_pagamento: formaPagamento
  });
  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data;
}

export async function cancelarComanda(comandaId: string): Promise<Comanda> {
  await ensureFreshToken();
  const { data, error } = await supabase.rpc("cancelar_comanda", { p_comanda_id: comandaId });
  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data as Comanda;
}
