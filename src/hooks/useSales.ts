import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isDemoCompany } from "@/constants/demo";
import { createSale, deleteSale } from "@/services/saleService";
import type { PaymentMethod } from "@/types/database";
import type { CartItem } from "@/store/saleStore";

export function useSaleMutations(empresaId?: string, usuarioId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
    queryClient.invalidateQueries({ queryKey: ["report", empresaId] });
  };

  const create = useMutation({
    mutationFn: (payload: { formaPagamento: PaymentMethod; items: CartItem[]; total: number }) =>
      isDemoCompany(empresaId)
        ? Promise.resolve({
            id: `demo-${Date.now()}`,
            empresa_id: empresaId!,
            usuario_id: usuarioId!,
            forma_pagamento: payload.formaPagamento,
            valor_total: payload.total,
            created_at: new Date().toISOString()
          })
        : createSale({
            formaPagamento: payload.formaPagamento,
            items: payload.items
          }),
    onSuccess: invalidate
  });

  const remove = useMutation({
    mutationFn: (saleId: string) => (isDemoCompany(empresaId) ? Promise.resolve() : deleteSale(saleId)),
    onSuccess: invalidate
  });

  return { create, remove };
}
