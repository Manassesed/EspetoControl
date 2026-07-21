import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isDemoCompany } from "@/constants/demo";
import type { MesaForm } from "@/lib/schemas";
import { listComandasAbertas } from "@/services/comandaService";
import { createMesa, deleteMesa, listMesas, toggleMesa, updateMesa } from "@/services/mesaService";
import type { Mesa } from "@/types/database";

export type MesaComStatus = {
  mesa: Mesa;
  comandaId: string | null;
  total: number;
  itemCount: number;
};

/** Grade de mesas: junta o catálogo (mesas) com as comandas abertas no momento. */
export function useMesasComComandas(empresaId?: string) {
  const enabled = Boolean(empresaId) && !isDemoCompany(empresaId);

  // Busca todas (ativas e pausadas) — o gerente precisa ver as pausadas pra
  // poder reativá-las; a tela filtra o que mostra pra cada papel.
  const mesasQuery = useQuery({
    queryKey: ["mesas", empresaId],
    enabled,
    queryFn: () => listMesas(empresaId!, false)
  });

  const comandasQuery = useQuery({
    queryKey: ["comandas-abertas", empresaId],
    enabled,
    queryFn: () => listComandasAbertas(empresaId!)
  });

  const mesas = useMemo<MesaComStatus[]>(() => {
    const mesasList = mesasQuery.data ?? [];
    const comandasList = comandasQuery.data ?? [];

    return mesasList.map((mesa) => {
      const comanda = comandasList.find((c) => c.mesa_id === mesa.id);
      if (!comanda) {
        return { mesa, comandaId: null, total: 0, itemCount: 0 };
      }

      const itens = comanda.comanda_itens ?? [];
      const total = itens.reduce((sum, item) => sum + Number(item.valor_unitario) * item.quantidade, 0);
      const itemCount = itens.reduce((sum, item) => sum + item.quantidade, 0);

      return { mesa, comandaId: comanda.id, total, itemCount };
    });
  }, [mesasQuery.data, comandasQuery.data]);

  return {
    mesas,
    isLoading: mesasQuery.isLoading || comandasQuery.isLoading,
    isFetching: mesasQuery.isFetching || comandasQuery.isFetching,
    isError: mesasQuery.isError || comandasQuery.isError,
    refetch: () => {
      mesasQuery.refetch();
      comandasQuery.refetch();
    }
  };
}

export function useMesaMutations(empresaId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["mesas", empresaId] });

  const create = useMutation({
    mutationFn: (data: MesaForm) => createMesa(empresaId!, data),
    onSuccess: invalidate
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MesaForm }) => updateMesa(empresaId!, id, data),
    onSuccess: invalidate
  });

  const toggle = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => toggleMesa(empresaId!, id, ativa),
    onSuccess: invalidate
  });

  const remove = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteMesa(empresaId!, id),
    onSuccess: invalidate
  });

  return { create, update, toggle, remove };
}
