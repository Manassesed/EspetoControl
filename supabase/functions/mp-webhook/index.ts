// Edge Function: recebe as notificações de webhook do Mercado Pago sobre a
// assinatura (Preapproval) OU sobre um pagamento avulso via Pix, e atualiza
// o status de cobrança da empresa.
//
// Segurança: NUNCA confia nos valores que vêm no corpo do webhook — o
// Mercado Pago manda só o tipo do evento e o id do recurso; sempre buscamos
// o recurso de verdade na API deles com o nosso próprio access token antes
// de decidir o que gravar. Isso evita que alguém falsifique um POST pra cá
// fingindo que uma assinatura foi aprovada.
//
// Deploy: supabase functions deploy mp-webhook
// Depois do deploy, a URL fica algo como:
//   https://<project-ref>.supabase.co/functions/v1/mp-webhook
// O mp-create-subscription já manda essa URL como "notification_url" na
// hora de criar cada assinatura, então não precisa configurar nada manual
// no painel do Mercado Pago.
//
// Secrets necessários (supabase secrets set ...):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (já disponíveis por padrão no runtime)
//   MP_ACCESS_TOKEN (mesmo token usado pelo mp-create-subscription)

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

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

// Mercado Pago usa nomes de "type"/"topic" diferentes dependendo da versão
// da API e de como a notificação foi configurada. Aceita as variações
// conhecidas pra assinatura (Preapproval).
const PREAPPROVAL_TYPES = ["preapproval", "subscription_preapproval"];

const PIX_CREDIT_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// deno-lint-ignore no-explicit-any
async function handlePixPayment(admin: any, paymentId: string) {
  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
  });

  if (!paymentResponse.ok) {
    return jsonResponse({ error: "Falha ao consultar pagamento no Mercado Pago" }, 502);
  }

  const payment = await paymentResponse.json();

  if (payment.status !== "approved" || payment.payment_method_id !== "pix") {
    return jsonResponse({ ok: true, ignored: true });
  }

  const empresaId = payment.external_reference;
  if (!empresaId) {
    return jsonResponse({ ok: true, ignored: true });
  }

  // Marca esse pagamento como processado ANTES de creditar. O Mercado Pago
  // reenvia o mesmo webhook várias vezes; a PK em mp_payment_id garante que
  // só a primeira tentativa passa daqui — reentregas caem no "unique
  // violation" e retornam sem mexer em paid_until de novo.
  const { error: insertError } = await admin
    .from("pix_pagamentos")
    .insert({ mp_payment_id: String(payment.id), empresa_id: empresaId });

  if (insertError) {
    if (insertError.code === "23505") {
      return jsonResponse({ ok: true, alreadyProcessed: true });
    }
    return jsonResponse({ error: "Falha ao registrar pagamento" }, 500);
  }

  const { data: empresa, error: fetchError } = await admin
    .from("empresas")
    .select("paid_until")
    .eq("id", empresaId)
    .maybeSingle();

  if (fetchError) {
    return jsonResponse({ error: "Falha ao buscar empresa" }, 500);
  }

  const currentPaidUntil = empresa?.paid_until ? new Date(empresa.paid_until).getTime() : 0;
  const base = Math.max(currentPaidUntil, Date.now());
  const newPaidUntil = new Date(base + PIX_CREDIT_DAYS_MS).toISOString();

  const { error: updateError } = await admin
    .from("empresas")
    .update({
      subscription_status: "active",
      paid_until: newPaidUntil,
      subscription_updated_at: new Date().toISOString()
    })
    .eq("id", empresaId);

  if (updateError) {
    return jsonResponse({ error: "Falha ao atualizar assinatura" }, 500);
  }

  return jsonResponse({ ok: true });
}

function mapMpStatus(mpStatus: string): "active" | "past_due" | "canceled" | null {
  switch (mpStatus) {
    case "authorized":
      return "active";
    case "paused":
      return "past_due";
    case "cancelled":
      return "canceled";
    default:
      // "pending" ou outro status intermediário: nada a atualizar ainda.
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido" }, 405);
  }

  const url = new URL(req.url);

  let type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? undefined;
  let resourceId = url.searchParams.get("id") ?? url.searchParams.get("data.id") ?? undefined;

  try {
    const body = await req.json();
    type = body?.type ?? body?.topic ?? type;
    resourceId = body?.data?.id ?? resourceId;
  } catch {
    // Algumas notificações do MP vêm só via query string, sem corpo JSON — segue com o que já leu da URL.
  }

  if (!type || !resourceId) {
    // Corpo/formato inesperado: responde 200 pra não gerar reentrega infinita por algo que não vamos processar mesmo.
    return jsonResponse({ ok: true, ignored: true });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  if (type === "payment") {
    return handlePixPayment(admin, resourceId);
  }

  if (!PREAPPROVAL_TYPES.includes(type)) {
    return jsonResponse({ ok: true, ignored: true });
  }

  const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
  });

  if (!mpResponse.ok) {
    // Erro ao consultar o MP: responde erro pra eles reentregarem depois.
    return jsonResponse({ error: "Falha ao consultar assinatura no Mercado Pago" }, 502);
  }

  const preapproval = await mpResponse.json();
  const newStatus = mapMpStatus(preapproval.status);

  if (!newStatus) {
    return jsonResponse({ ok: true, ignored: true });
  }

  // Casa primeiro pelo id da assinatura (gravado no momento da criação);
  // se por algum motivo essa empresa ainda não tiver esse id salvo (ex.:
  // webhook chegou antes da resposta do mp-create-subscription terminar
  // de gravar), usa o external_reference (empresa_id) como plano B.
  const { data: updatedByPreapproval, error: updateError } = await admin
    .from("empresas")
    .update({ subscription_status: newStatus, subscription_updated_at: new Date().toISOString() })
    .eq("mp_preapproval_id", resourceId)
    .select("id");

  if (updateError) {
    return jsonResponse({ error: "Falha ao atualizar assinatura" }, 500);
  }

  if (!updatedByPreapproval || updatedByPreapproval.length === 0) {
    const empresaId = preapproval.external_reference;
    if (empresaId) {
      await admin
        .from("empresas")
        .update({
          subscription_status: newStatus,
          mp_preapproval_id: resourceId,
          subscription_updated_at: new Date().toISOString()
        })
        .eq("id", empresaId);
    }
  }

  return jsonResponse({ ok: true });
});
