import type { EmpresaSubscription } from "@/types/database";
import { supabase } from "@/services/supabase";

export async function getEmpresaSubscription(empresaId: string): Promise<EmpresaSubscription> {
  const { data, error } = await supabase
    .from("empresas")
    .select("subscription_status, trial_ends_at, mp_preapproval_id")
    .eq("id", empresaId)
    .single();

  if (error) throw new Error(error.message ?? JSON.stringify(error));
  return data;
}
