// Edge Function: cria uma assinatura recorrente (Preapproval) no Mercado
// Pago pra empresa do gerente que chamou, e devolve a URL de checkout.
//
// Deploy: supabase functions deploy mp-create-subscription
// Secrets necessários (supabase secrets set ...):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (já disponíveis por padrão no runtime)
//   MP_ACCESS_TOKEN (access token do Mercado Pago — gerar no painel de
//     desenvolvedor da conta que vai receber os pagamentos; NUNCA usar a
//     chave pública/EXPO_PUBLIC_* pra isso, esse token é secreto)

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

const MONTHLY_PRICE = 29.9;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Não autenticado" }, 401);
  }

  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerData.user) {
    return jsonResponse({ error: "Sessão inválida" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: callerProfile, error: profileError } = await admin
    .from("usuarios")
    .select("empresa_id, role, email")
    .eq("id", callerData.user.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    return jsonResponse({ error: "Perfil não encontrado" }, 403);
  }

  if (callerProfile.role !== "gerente") {
    return jsonResponse({ error: "Apenas o gerente pode assinar o plano" }, 403);
  }

  const backUrl =
    req.headers.get("origin") ? `${req.headers.get("origin")}/assinatura` : "espetocontrol://assinatura";

  const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      reason: "EspetoControl - Assinatura mensal",
      external_reference: callerProfile.empresa_id,
      payer_email: callerProfile.email,
      back_url: backUrl,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: MONTHLY_PRICE,
        currency_id: "BRL"
      }
    })
  });

  const mpData = await mpResponse.json();

  if (!mpResponse.ok) {
    return jsonResponse({ error: mpData?.message ?? "Falha ao criar assinatura no Mercado Pago" }, 400);
  }

  const { error: updateError } = await admin
    .from("empresas")
    .update({
      mp_preapproval_id: mpData.id,
      mp_payer_email: callerProfile.email,
      subscription_updated_at: new Date().toISOString()
    })
    .eq("id", callerProfile.empresa_id);

  if (updateError) {
    return jsonResponse({ error: "Assinatura criada, mas houve um erro ao salvar. Contate o suporte." }, 500);
  }

  const checkoutUrl = mpData.init_point ?? mpData.sandbox_init_point;
  if (!checkoutUrl) {
    return jsonResponse({ error: "Mercado Pago não retornou o link de checkout" }, 500);
  }

  return jsonResponse({ checkoutUrl });
});
