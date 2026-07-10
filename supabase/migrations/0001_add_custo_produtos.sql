-- Margem por produto: adiciona o custo unitário em produtos.
-- Seguro para rodar em produção: coluna com default 0, registros antigos ficam custo = 0.
-- Rode no Supabase (SQL Editor) ANTES de publicar o app novo.

alter table public.produtos
  add column if not exists custo numeric(12, 2) not null default 0 check (custo >= 0);
