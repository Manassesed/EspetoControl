import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  abrirComanda,
  cancelarComanda,
  definirItem,
  fecharComanda,
  getComanda,
  incrementarItem
} from "@/services/comandaService";
import type { PaymentMethod } from "@/types/database";

export function useComanda(comandaId?: string) {
  return useQuery({
    queryKey: ["comanda", comandaId],
    enabled: Boolean(comandaId),
    queryFn: () => getComanda(comandaId!)
  });
}

export function useComandaMutations(empresaId?: string) {
  const queryClient = useQueryClient();

  const invalidateMesas = () => {
    queryClient.invalidateQueries({ queryKey: ["mesas", empresaId] });
    queryClient.invalidateQueries({ queryKey: ["comandas-abertas", empresaId] });
  };

  const abrir = useMutation({
    mutationFn: (mesaId: string) => abrirComanda(mesaId),
    onSuccess: invalidateMesas
  });

  const incrementar = useMutation({
    mutationFn: ({ comandaId, produtoId, delta }: { comandaId: string; produtoId: string; delta: number }) =>
      incrementarItem(comandaId, produtoId, delta),
    onSuccess: (_data, variables) => {
      invalidateMesas();
      queryClient.invalidateQueries({ queryKey: ["comanda", variables.comandaId] });
    }
  });

  const definir = useMutation({
    mutationFn: ({ comandaId, produtoId, quantidade }: { comandaId: string; produtoId: string; quantidade: number }) =>
      definirItem(comandaId, produtoId, quantidade),
    onSuccess: (_data, variables) => {
      invalidateMesas();
      queryClient.invalidateQueries({ queryKey: ["comanda", variables.comandaId] });
    }
  });

  const fechar = useMutation({
    mutationFn: ({ comandaId, formaPagamento }: { comandaId: string; formaPagamento: PaymentMethod }) =>
      fecharComanda(comandaId, formaPagamento),
    onSuccess: (_data, variables) => {
      invalidateMesas();
      queryClient.invalidateQueries({ queryKey: ["comanda", variables.comandaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["report", empresaId] });
    }
  });

  const cancelar = useMutation({
    mutationFn: (comandaId: string) => cancelarComanda(comandaId),
    onSuccess: (_data, comandaId) => {
      invalidateMesas();
      queryClient.invalidateQueries({ queryKey: ["comanda", comandaId] });
    }
  });

  return { abrir, incrementar, definir, fechar, cancelar };
}
