import { supabase } from "@/services/supabase";

export async function createSubscriptionCheckout(): Promise<{ checkoutUrl: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada, faça login novamente.");

  const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.checkoutUrl) throw new Error("Não foi possível iniciar o checkout.");

  return data;
}
