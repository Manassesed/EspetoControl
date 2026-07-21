-- Pagamento avulso via Pix (alternativa ao cartao recorrente do preapproval).
-- Sem debito automatico, entao a gente precisa guardar ate quando o
-- pagamento cobre: cada Pix aprovado empurra "paid_until" 30 dias pra
-- frente. O gate de acesso considera "active" com paid_until vencido como
-- bloqueado, igual ao trial.

alter table public.empresas
  add column if not exists paid_until timestamptz;

comment on column public.empresas.paid_until is
  'Ate quando o acesso esta pago via Pix avulso. Null = assinatura via cartao (mp_preapproval_id), sem controle de data local — o Mercado Pago cobra e o webhook atualiza subscription_status direto.';

-- Mercado Pago reenvia o mesmo webhook de pagamento varias vezes (retry).
-- Sem isso, cada reenvio empurraria paid_until +30 dias de novo pro mesmo
-- Pix pago uma unica vez. A PK em mp_payment_id garante que so a primeira
-- vez credita o acesso.
create table if not exists public.pix_pagamentos (
  mp_payment_id text primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.pix_pagamentos enable row level security;
-- Sem policies: só a service role (Edge Function) grava/lê aqui.
