import { supabase } from "@/services/supabase";

async function authHeader(): Promise<Record<string, string>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sessão expirada, faça login novamente.");
  return { Authorization: `Bearer ${token}` };
}

export async function createSubscriptionCheckout(): Promise<{ checkoutUrl: string }> {
  const { data, error } = await supabase.functions.invoke("mp-create-subscription", {
    headers: await authHeader()
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.checkoutUrl) throw new Error("Não foi possível iniciar o checkout.");

  return data;
}

export type PixPayment = { paymentId: string; qrCode: string; qrCodeBase64: string };

export async function createPixPayment(): Promise<PixPayment> {
  const { data, error } = await supabase.functions.invoke("mp-create-pix-payment", {
    headers: await authHeader()
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.qrCode || !data?.qrCodeBase64) throw new Error("Não foi possível gerar o Pix.");

  return data;
}
