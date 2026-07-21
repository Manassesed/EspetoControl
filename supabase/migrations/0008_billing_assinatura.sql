-- Assinatura mensal (SaaS billing) via Mercado Pago. Empresa nova nasce em
-- trial de 30 dias; sem assinatura ativa depois disso, o app bloqueia tudo
-- (ver gate no client, mesmo padrão do status "pendente" de convite).

alter table public.empresas
  add column if not exists subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'past_due', 'canceled', 'lifetime')),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '30 days'),
  add column if not exists mp_preapproval_id text,
  add column if not exists mp_payer_email text,
  add column if not exists subscription_updated_at timestamptz not null default now();

create index if not exists empresas_subscription_status_idx on public.empresas(subscription_status);

-- Backfill: empresas que já existiam ANTES desta migration não devem ficar
-- sujeitas ao relógio de trial — viram "active" (grandfathered). Roda uma
-- vez só; empresas criadas DEPOIS já nascem com os defaults acima.
update public.empresas
set subscription_status = 'active', subscription_updated_at = now()
where subscription_status = 'trial';

-- A policy antiga "empresas_update_same_company" (schema.sql) permite que
-- QUALQUER usuário autenticado da empresa (não só gerente) atualize a
-- própria linha sem nenhuma restrição de coluna — o que deixaria um jeito
-- trivial de burlar o bloqueio de trial direto via client
-- (supabase.from("empresas").update({ subscription_status: "active", ... })).
-- Nenhuma tela do app hoje escreve em "empresas", então removemos o acesso
-- de escrita do client por completo: as colunas de assinatura só mudam via
-- as Edge Functions (service role, ignora RLS). Se um dia for preciso
-- deixar o gerente renomear a empresa, isso deve virar uma RPC
-- security definer dedicada (mesmo padrão de update_member_role), nunca um
-- update direto na tabela.
drop policy if exists "empresas_update_same_company" on public.empresas;

-- Realtime: depois que o gerente paga no Mercado Pago e volta pro app, o
-- webhook atualiza subscription_status no servidor. Sem realtime, a tela de
-- assinatura ficaria "vencida" até um refresh manual.
alter table public.empresas replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'empresas'
  ) then
    alter publication supabase_realtime add table public.empresas;
  end if;
end $$;
