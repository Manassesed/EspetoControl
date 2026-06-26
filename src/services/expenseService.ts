import type { ExpenseForm } from "@/lib/schemas";
import { supabase } from "@/services/supabase";

async function ensureFreshToken() {
  const { data: { session } } = await supabase.auth.getSession();
  const expiresAt = session?.expires_at ?? 0;
  if (Date.now() / 1000 > expiresAt - 60) {
    await supabase.auth.refreshSession();
  }
}

export async function listExpenses(empresaId: string) {
  await ensureFreshToken();
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message ?? JSON.stringify(error));
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

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data;
}

export async function createExpense(empresaId: string, expense: ExpenseForm) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("gastos")
    .insert({ ...expense, empresa_id: empresaId });

  if (error) throw new Error(error.message ?? JSON.stringify(error));
}

export async function updateExpense(empresaId: string, id: string, expense: ExpenseForm) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("gastos")
    .update(expense)
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));

  const { data, error: fetchError } = await supabase
    .from("gastos")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message ?? JSON.stringify(fetchError));
  return data;
}

export async function deleteExpense(empresaId: string, id: string) {
  if (!empresaId) throw new Error("Sessão inválida. Saia e entre novamente.");
  await ensureFreshToken();

  const { error } = await supabase
    .from("gastos")
    .delete()
    .eq("id", id)
    .eq("empresa_id", empresaId);

  if (error) throw new Error(error.message ?? JSON.stringify(error));
}
