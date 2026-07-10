// Edge Function: convida um membro da equipe por email.
// Roda no servidor do Supabase, nunca no app — é a única peça que pode usar a
// service_role key (admin API), porque essa chave ignora RLS por completo.
//
// Deploy: supabase functions deploy invite-member
// Secrets necessários (supabase secrets set ...):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (já disponíveis por padrão no runtime)

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type InvitePayload = {
  email: string;
  role: "gerente" | "colaborador";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}

Deno.serve(async (req) => {
  // Preflight do navegador antes do POST real — sem isso o browser bloqueia a chamada por CORS.
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

  // Cliente "do chamador", só pra validar quem está pedindo o convite.
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
    .select("empresa_id, role")
    .eq("id", callerData.user.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    return jsonResponse({ error: "Perfil não encontrado" }, 403);
  }

  if (callerProfile.role !== "gerente") {
    return jsonResponse({ error: "Apenas o gerente pode convidar membros" }, 403);
  }

  let payload: InvitePayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido" }, 400);
  }

  const email = payload.email?.trim().toLowerCase();
  const role = payload.role;

  if (!email || !email.includes("@")) {
    return jsonResponse({ error: "Email inválido" }, 400);
  }
  if (role !== "gerente" && role !== "colaborador") {
    return jsonResponse({ error: "Nível de acesso inválido" }, 400);
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      empresa_id: callerProfile.empresa_id,
      role
    }
  });

  if (inviteError) {
    // Convite repetido para quem já tem conta: o Supabase recusa o invite.
    // Nesse caso, reenviamos um link de recuperação de senha (efeito equivalente).
    if (inviteError.message?.toLowerCase().includes("already")) {
      const { error: linkError } = await admin.auth.resetPasswordForEmail(email);
      if (linkError) return jsonResponse({ error: linkError.message }, 400);
      return jsonResponse({ ok: true, resent: true });
    }
    return jsonResponse({ error: inviteError.message }, 400);
  }

  const newUserId = invited.user?.id;
  if (newUserId) {
    // Cria o perfil já como "pendente" pra aparecer na lista da equipe
    // antes mesmo da pessoa aceitar o convite e definir a senha.
    const { error: profileInsertError } = await admin.from("usuarios").insert({
      id: newUserId,
      empresa_id: callerProfile.empresa_id,
      nome: email.split("@")[0],
      email,
      role,
      status: "pendente",
      convidado_por: callerData.user.id
    });
    if (profileInsertError) {
      return jsonResponse({ error: profileInsertError.message }, 400);
    }
  }

  return jsonResponse({ ok: true, userId: newUserId });
});
