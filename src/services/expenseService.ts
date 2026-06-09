import type { ExpenseForm } from "@/lib/schemas";
import { supabase } from "@/services/supabase";

export async function listExpenses(empresaId: string) {
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function listTodayExpenses(empresaId: string, start: string, end: string) {
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .eq("empresa_id", empresaId)
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createExpense(empresaId: string, expense: ExpenseForm) {
  const { data, error } = await supabase
    .from("gastos")
    .insert({ ...expense, empresa_id: empresaId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
