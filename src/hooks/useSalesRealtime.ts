import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { isDemoCompany } from "@/constants/demo";
import { supabase } from "@/services/supabase";

/**
 * Escuta INSERT/DELETE em vendas da empresa via Supabase Realtime e invalida
 * dashboard/relatório na hora. Sem isso, a venda do colaborador só aparece
 * pro gerente quando a tela é refeita e o staleTime (30s) já expirou —
 * em outro aparelho o invalidateQueries do useSaleMutations não tem efeito.
 */
export function useSalesRealtime(empresaId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!empresaId || isDemoCompany(empresaId)) return;

    const channel = supabase
      .channel(`vendas-empresa-${empresaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendas", filter: `empresa_id=eq.${empresaId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
          queryClient.invalidateQueries({ queryKey: ["report", empresaId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, queryClient]);
}
