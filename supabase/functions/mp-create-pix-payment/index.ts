// Edge Function: cria uma cobranca avulsa via Pix no Mercado Pago (sem
// debito automatico) pra empresa do gerente que chamou, e devolve o QR
// code / codigo copia-e-cola. Alternativa mais simples ao cartao
// recorrente (mp-create-subscription) pra quem prefere pagar mes a mes.
//
// Deploy: supabase functions deploy mp-create-pix-payment
// Secrets necessários (supabase secrets set ...):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (já disponíveis por padrão no runtime)
//   MP_ACCESS_TOKEN (mesmo token usado pelo mp-create-subscription)

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
    .select("empresa_id, role, email, nome")
    .eq("id", callerData.user.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    return jsonResponse({ error: "Perfil não encontrado" }, 403);
  }

  if (callerProfile.role !== "gerente") {
    return jsonResponse({ error: "Apenas o gerente pode pagar o plano" }, 403);
  }

  const [firstName, ...rest] = (callerProfile.nome ?? "").trim().split(/\s+/);

  const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID()
    },
    body: JSON.stringify({
      transaction_amount: MONTHLY_PRICE,
      description: "EspetoControl - Assinatura mensal (Pix)",
      payment_method_id: "pix",
      external_reference: callerProfile.empresa_id,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      payer: {
        email: callerProfile.email,
        first_name: firstName || undefined,
        last_name: rest.join(" ") || undefined
      }
    })
  });

  const mpData = await mpResponse.json();

  if (!mpResponse.ok) {
    return jsonResponse({ error: mpData?.message ?? "Falha ao gerar o Pix no Mercado Pago" }, 400);
  }

  const qrCode = mpData?.point_of_interaction?.transaction_data?.qr_code;
  const qrCodeBase64 = mpData?.point_of_interaction?.transaction_data?.qr_code_base64;

  if (!qrCode || !qrCodeBase64) {
    return jsonResponse({ error: "Mercado Pago não retornou o QR code do Pix" }, 500);
  }

  return jsonResponse({ paymentId: mpData.id, qrCode, qrCodeBase64 });
});
