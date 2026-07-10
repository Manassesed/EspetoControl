import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { isDemoCompany } from "@/constants/demo";
import { supabase } from "@/services/supabase";

/**
 * Escuta mudanças em mesas/comandas/comanda_itens da empresa via Supabase
 * Realtime. Mais crítico ainda que o realtime de vendas: dois atendentes
 * podem estar na mesma mesa ao mesmo tempo, em aparelhos diferentes.
 */
export function useComandasRealtime(empresaId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!empresaId || isDemoCompany(empresaId)) return;

    const invalidateMesas = () => {
      queryClient.invalidateQueries({ queryKey: ["mesas", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["comandas-abertas", empresaId] });
    };

    const invalidateComanda = (payload: { new?: unknown; old?: unknown }) => {
      const row = (payload.new ?? payload.old) as { id?: string; comanda_id?: string } | undefined;
      const comandaId = row?.comanda_id ?? row?.id;
      if (comandaId) {
        queryClient.invalidateQueries({ queryKey: ["comanda", comandaId] });
      }
    };

    const channel = supabase
      .channel(`comandas-empresa-${empresaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas", filter: `empresa_id=eq.${empresaId}` },
        invalidateMesas
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comandas", filter: `empresa_id=eq.${empresaId}` },
        (payload) => {
          invalidateMesas();
          invalidateComanda(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comanda_itens", filter: `empresa_id=eq.${empresaId}` },
        (payload) => {
          invalidateMesas();
          invalidateComanda(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, queryClient]);
}
