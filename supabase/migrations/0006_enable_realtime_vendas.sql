-- Habilita Supabase Realtime na tabela vendas: sem isso, a venda lançada pelo
-- colaborador só aparece pro gerente quando ele reabrir/focar a tela e o
-- staleTime do React Query (30s) já tiver expirado — na prática um delay que
-- pode passar bem de 30s se a tela ficar aberta. Com Realtime, o app do
-- gerente recebe um push via websocket e invalida o cache na hora.

-- REPLICA IDENTITY FULL: garante que eventos de DELETE carreguem a linha
-- inteira (incluindo empresa_id), já que o filtro do canal usa esse campo.
alter table public.vendas replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'vendas'
  ) then
    alter publication supabase_realtime add table public.vendas;
  end if;
end $$;
