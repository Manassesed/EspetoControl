import { useEffect } from "react";

import { isDemoCompany } from "@/constants/demo";
import { supabase } from "@/services/supabase";

/**
 * Escuta mudanças em "empresas" (status de assinatura) via Supabase Realtime.
 * Sem isso, depois que o gerente paga no Mercado Pago e volta pro app, a
 * atualização feita pelo webhook no servidor só apareceria num refresh
 * manual — a tela de assinatura ficaria "vencida" mesmo já paga.
 */
export function useEmpresaRealtime(empresaId: string | undefined, onChange: () => void) {
  useEffect(() => {
    if (!empresaId || isDemoCompany(empresaId)) return;

    const channel = supabase
      .channel(`empresa-${empresaId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "empresas", filter: `id=eq.${empresaId}` },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, onChange]);
}
