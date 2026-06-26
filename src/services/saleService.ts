import type { PaymentMethod, ProductSale } from "@/types/database";
import type { CartItem } from "@/store/saleStore";
import { supabase } from "@/services/supabase";

type CreateSalePayload = {
  formaPagamento: PaymentMethod;
  items: CartItem[];
};

type SaleItemRow = {
  produto_id: string;
  quantidade: number;
  valor: number;
  produtos: {
    nome: string;
    categoria: string;
  } | null;
};

export async function createSale(payload: CreateSalePayload) {
  const { data: venda, error } = await supabase.rpc("registrar_venda", {
    p_forma_pagamento: payload.formaPagamento,
    p_items: payload.items.map((item) => ({
      produto_id: item.produto.id,
      quantidade: item.quantidade
    }))
  });

  if (error) {
    throw new Error(error.message ?? JSON.stringify(error));
  }

  return venda;
}

export async function listTodaySales(empresaId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .eq("empresa_id", empresaId)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message ?? JSON.stringify(error));
  }

  return data;
}

export async function deleteSale(saleId: string) {
  const { error } = await supabase.from("vendas").delete().eq("id", saleId);
  if (error) {
    throw new Error(error.message ?? JSON.stringify(error));
  }
}

export type SaleItemDetail = { produto_id: string; nome: string; quantidade: number; valor: number };

export async function listSaleItems(saleIds: string[]): Promise<Record<string, SaleItemDetail[]>> {
  if (!saleIds.length) return {};

  const { data, error } = await supabase
    .from("venda_itens")
    .select("venda_id, produto_id, quantidade, valor, produtos(nome)")
    .in("venda_id", saleIds);

  if (error) {
    throw new Error(error.message ?? JSON.stringify(error));
  }

  const rows = (data ?? []) as unknown as (SaleItemDetail & { venda_id: string; produtos: { nome: string } | null })[];

  return rows.reduce<Record<string, SaleItemDetail[]>>((acc, row) => {
    const list = acc[row.venda_id] ?? [];
    list.push({
      produto_id: row.produto_id,
      nome: row.produtos?.nome ?? "Produto removido",
      quantidade: row.quantidade,
      valor: row.valor
    });
    acc[row.venda_id] = list;
    return acc;
  }, {});
}

export async function listTodayProductSales(empresaId: string, start: string, end: string): Promise<ProductSale[]> {
  const { data, error } = await supabase
    .from("venda_itens")
    .select("produto_id, quantidade, valor, produtos(nome, categoria), vendas!inner(empresa_id, created_at)")
    .eq("vendas.empresa_id", empresaId)
    .gte("vendas.created_at", start)
    .lte("vendas.created_at", end);

  if (error) {
    throw new Error(error.message ?? JSON.stringify(error));
  }

  const rows = (data ?? []) as unknown as SaleItemRow[];
  const grouped = rows.reduce<Record<string, ProductSale>>((acc, row) => {
    const current = acc[row.produto_id] ?? {
      produto_id: row.produto_id,
      nome: row.produtos?.nome ?? "Produto removido",
      categoria: row.produtos?.categoria ?? "Sem categoria",
      quantidade: 0,
      total: 0
    };

    current.quantidade += row.quantidade;
    current.total += row.valor;
    acc[row.produto_id] = current;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.total - a.total);
}
