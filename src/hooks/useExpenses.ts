import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoExpenses, isDemoCompany } from "@/constants/demo";
import type { ExpenseForm } from "@/lib/schemas";
import { createExpense, listExpenses } from "@/services/expenseService";

export function useExpenses(empresaId?: string) {
  return useQuery({
    queryKey: ["expenses", empresaId],
    enabled: Boolean(empresaId),
    queryFn: () => (isDemoCompany(empresaId) ? Promise.resolve(demoExpenses) : listExpenses(empresaId!))
  });
}

export function useExpenseMutations(empresaId?: string) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: ExpenseForm) =>
      isDemoCompany(empresaId)
        ? Promise.resolve({ ...data, id: `demo-${Date.now()}`, empresa_id: empresaId!, created_at: new Date().toISOString() })
        : createExpense(empresaId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
    }
  });

  return { create };
}
