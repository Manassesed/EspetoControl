import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoExpenses, isDemoCompany } from "@/constants/demo";
import type { ExpenseForm } from "@/lib/schemas";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "@/services/expenseService";

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
    mutationFn: async (data: ExpenseForm) => {
      if (isDemoCompany(empresaId)) return;
      await createExpense(empresaId!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
    }
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExpenseForm }) => {
      if (isDemoCompany(empresaId)) return;
      await updateExpense(empresaId!, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
    }
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      isDemoCompany(empresaId) ? Promise.resolve() : deleteExpense(empresaId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
    }
  });

  return { create, update, remove };
}
