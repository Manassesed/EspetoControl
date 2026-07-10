-- Feature Mesas/Comandas: catálogo de mesas fixas + conta aberta que acumula
-- itens ao longo do atendimento e, ao fechar, vira uma venda normal via
-- registrar_venda (reaproveita 100% a validação/cálculo já existente).

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.comandas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  mesa_id uuid not null references public.mesas(id) on delete restrict,
  status text not null default 'aberta' check (status in ('aberta', 'fechada', 'cancelada')),
  aberta_por uuid not null references public.usuarios(id) on delete restrict,
  fechada_por uuid references public.usuarios(id) on delete restrict,
  venda_id uuid references public.vendas(id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Só pode existir UMA comanda "aberta" por mesa por vez.
create unique index if not exists comandas_mesa_aberta_uidx
  on public.comandas(mesa_id) where status = 'aberta';

create table if not exists public.comanda_itens (
  id uuid primary key default gen_random_uuid(),
  -- denormalizado de propósito: permite RLS/Realtime filtrarem por empresa_id
  -- direto nesta tabela, igual mesas/comandas.
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  comanda_id uuid not null references public.comandas(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  -- snapshot do preço no momento do add/ajuste, só para exibir o total da
  -- comanda em aberto — o valor cobrado de fato é recalculado por
  -- registrar_venda no fechamento (preço atual, igual ao balcão hoje).
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0),
  adicionado_por uuid not null references public.usuarios(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (comanda_id, produto_id)
);

create index if not exists mesas_empresa_id_idx on public.mesas(empresa_id);
create index if not exists comandas_empresa_id_idx on public.comandas(empresa_id);
create index if not exists comandas_mesa_id_idx on public.comandas(mesa_id);
create index if not exists comanda_itens_comanda_id_idx on public.comanda_itens(comanda_id);
create index if not exists comanda_itens_empresa_id_idx on public.comanda_itens(empresa_id);

-- Abre (ou retoma, idempotente) a comanda de uma mesa. Idempotente pra
-- resolver corrida de dois atendentes tocando a mesma mesa ao mesmo tempo.
create or replace function public.abrir_comanda(p_mesa_id uuid)
returns public.comandas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_empresa_id uuid;
  v_comanda public.comandas;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select public.current_empresa_id() into v_empresa_id;
  if v_empresa_id is null then
    raise exception 'Perfil da empresa nao encontrado';
  end if;

  if public.current_user_status() <> 'ativo' then
    raise exception 'Usuario inativo';
  end if;

  if not exists (
    select 1 from public.mesas
    where id = p_mesa_id and empresa_id = v_empresa_id and ativa = true
  ) then
    raise exception 'Mesa invalida';
  end if;

  insert into public.comandas (empresa_id, mesa_id, aberta_por, status)
  values (v_empresa_id, p_mesa_id, v_user_id, 'aberta')
  on conflict (mesa_id) where (status = 'aberta') do nothing;

  select * into v_comanda
  from public.comandas
  where mesa_id = p_mesa_id and status = 'aberta'
  limit 1;

  if not found then
    raise exception 'Nao foi possivel abrir a comanda';
  end if;

  return v_comanda;
end;
$$;

-- Soma/subtrai p_delta na quantidade de um produto na comanda. "for update"
-- trava a linha pra dois toques simultâneos (+1/-1) em aparelhos diferentes
-- resolverem em série, não perderem incremento um do outro.
create or replace function public.comanda_incrementar_item(
  p_comanda_id uuid,
  p_produto_id uuid,
  p_delta integer
)
returns public.comanda_itens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_preco numeric(12, 2);
  v_item public.comanda_itens;
  v_nova_qtd integer;
begin
  if public.current_user_status() <> 'ativo' then
    raise exception 'Usuario inativo';
  end if;

  if not exists (
    select 1 from public.comandas
    where id = p_comanda_id and empresa_id = v_empresa_id and status = 'aberta'
  ) then
    raise exception 'Comanda invalida ou fechada';
  end if;

  select preco into v_preco
  from public.produtos
  where id = p_produto_id and empresa_id = v_empresa_id and ativo = true;

  if v_preco is null then
    raise exception 'Produto invalido ou inativo';
  end if;

  select * into v_item
  from public.comanda_itens
  where comanda_id = p_comanda_id and produto_id = p_produto_id
  for update;

  if found then
    v_nova_qtd := v_item.quantidade + p_delta;

    if v_nova_qtd <= 0 then
      delete from public.comanda_itens where id = v_item.id;
      return null;
    end if;

    update public.comanda_itens
    set quantidade = v_nova_qtd, valor_unitario = v_preco, adicionado_por = auth.uid()
    where id = v_item.id
    returning * into v_item;

    return v_item;
  end if;

  if p_delta <= 0 then
    return null;
  end if;

  insert into public.comanda_itens (empresa_id, comanda_id, produto_id, quantidade, valor_unitario, adicionado_por)
  values (v_empresa_id, p_comanda_id, p_produto_id, p_delta, v_preco, auth.uid())
  returning * into v_item;

  return v_item;
end;
$$;

-- Define a quantidade absoluta de um produto na comanda (usado pelo teclado
-- numérico). p_quantidade <= 0 remove o item.
create or replace function public.comanda_definir_item(
  p_comanda_id uuid,
  p_produto_id uuid,
  p_quantidade integer
)
returns public.comanda_itens
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_preco numeric(12, 2);
  v_item public.comanda_itens;
begin
  if public.current_user_status() <> 'ativo' then
    raise exception 'Usuario inativo';
  end if;

  if not exists (
    select 1 from public.comandas
    where id = p_comanda_id and empresa_id = v_empresa_id and status = 'aberta'
  ) then
    raise exception 'Comanda invalida ou fechada';
  end if;

  if p_quantidade <= 0 then
    delete from public.comanda_itens
    where comanda_id = p_comanda_id and produto_id = p_produto_id;
    return null;
  end if;

  select preco into v_preco
  from public.produtos
  where id = p_produto_id and empresa_id = v_empresa_id and ativo = true;

  if v_preco is null then
    raise exception 'Produto invalido ou inativo';
  end if;

  insert into public.comanda_itens (empresa_id, comanda_id, produto_id, quantidade, valor_unitario, adicionado_por)
  values (v_empresa_id, p_comanda_id, p_produto_id, p_quantidade, v_preco, auth.uid())
  on conflict (comanda_id, produto_id)
  do update set
    quantidade = excluded.quantidade,
    valor_unitario = excluded.valor_unitario,
    adicionado_por = excluded.adicionado_por
  returning * into v_item;

  return v_item;
end;
$$;

-- Fecha a comanda: agrega os itens acumulados e chama registrar_venda (mesma
-- RPC usada pelo balcão) pra gerar a venda de verdade, com o preço ATUAL dos
-- produtos — não o preço congelado de quando o item foi adicionado.
create or replace function public.fechar_comanda(
  p_comanda_id uuid,
  p_forma_pagamento text
)
returns public.vendas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_empresa_id uuid;
  v_items jsonb;
  v_venda public.vendas;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select public.current_empresa_id() into v_empresa_id;

  if public.current_user_status() <> 'ativo' then
    raise exception 'Usuario inativo';
  end if;

  if not exists (
    select 1 from public.comandas
    where id = p_comanda_id and empresa_id = v_empresa_id and status = 'aberta'
    for update
  ) then
    raise exception 'Comanda invalida ou ja fechada';
  end if;

  select jsonb_agg(jsonb_build_object('produto_id', produto_id, 'quantidade', quantidade))
  into v_items
  from public.comanda_itens
  where comanda_id = p_comanda_id;

  if v_items is null then
    raise exception 'Comanda sem itens';
  end if;

  v_venda := public.registrar_venda(p_forma_pagamento, v_items);

  update public.comandas
  set status = 'fechada', venda_id = v_venda.id, fechada_por = v_user_id, closed_at = now()
  where id = p_comanda_id;

  return v_venda;
end;
$$;

-- Cancela uma comanda aberta sem gerar venda (ex.: cliente saiu sem pedir
-- nada, mesa aberta por engano). Mantém o registro pra auditoria.
create or replace function public.cancelar_comanda(p_comanda_id uuid)
returns public.comandas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_comanda public.comandas;
begin
  update public.comandas
  set status = 'cancelada', fechada_por = auth.uid(), closed_at = now()
  where id = p_comanda_id and empresa_id = v_empresa_id and status = 'aberta'
  returning * into v_comanda;

  if not found then
    raise exception 'Comanda invalida ou ja finalizada';
  end if;

  return v_comanda;
end;
$$;

grant execute on function public.abrir_comanda(uuid) to authenticated;
grant execute on function public.comanda_incrementar_item(uuid, uuid, integer) to authenticated;
grant execute on function public.comanda_definir_item(uuid, uuid, integer) to authenticated;
grant execute on function public.fechar_comanda(uuid, text) to authenticated;
grant execute on function public.cancelar_comanda(uuid) to authenticated;

alter table public.mesas enable row level security;
alter table public.comandas enable row level security;
alter table public.comanda_itens enable row level security;

-- mesas: catálogo. Todos da empresa leem, só gerente escreve.
drop policy if exists "mesas_select_same_company" on public.mesas;
create policy "mesas_select_same_company"
on public.mesas for select
to authenticated
using (empresa_id = public.current_empresa_id());

drop policy if exists "mesas_insert_gerente" on public.mesas;
create policy "mesas_insert_gerente"
on public.mesas for insert
to authenticated
with check (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');

drop policy if exists "mesas_update_gerente" on public.mesas;
create policy "mesas_update_gerente"
on public.mesas for update
to authenticated
using (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente')
with check (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');

drop policy if exists "mesas_delete_gerente" on public.mesas;
create policy "mesas_delete_gerente"
on public.mesas for delete
to authenticated
using (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');

-- comandas: enquanto aberta/cancelada é operacional (todo mundo da empresa lê
-- e mexe). Uma vez fechada, a privacidade fica igual a "vendas" (colaborador
-- só vê a que ele mesmo fechou).
drop policy if exists "comandas_select_same_company" on public.comandas;
create policy "comandas_select_same_company"
on public.comandas for select
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and (status <> 'fechada' or public.current_user_role() = 'gerente' or fechada_por = auth.uid())
);

drop policy if exists "comandas_insert_same_company" on public.comandas;
create policy "comandas_insert_same_company"
on public.comandas for insert
to authenticated
with check (
  empresa_id = public.current_empresa_id()
  and aberta_por = auth.uid()
  and public.current_user_status() = 'ativo'
);

drop policy if exists "comandas_update_while_open" on public.comandas;
create policy "comandas_update_while_open"
on public.comandas for update
to authenticated
using (empresa_id = public.current_empresa_id() and status = 'aberta')
with check (empresa_id = public.current_empresa_id());

-- comanda_itens: leitura acompanha a visibilidade da comanda; escrita só
-- enquanto a comanda está aberta.
drop policy if exists "comanda_itens_select_same_company" on public.comanda_itens;
create policy "comanda_itens_select_same_company"
on public.comanda_itens for select
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and exists (
    select 1 from public.comandas c
    where c.id = comanda_itens.comanda_id
      and (c.status <> 'fechada' or public.current_user_role() = 'gerente' or c.fechada_por = auth.uid())
  )
);

drop policy if exists "comanda_itens_write_while_open" on public.comanda_itens;
create policy "comanda_itens_write_while_open"
on public.comanda_itens for all
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and exists (select 1 from public.comandas c where c.id = comanda_itens.comanda_id and c.status = 'aberta')
)
with check (
  empresa_id = public.current_empresa_id()
  and public.current_user_status() = 'ativo'
  and exists (select 1 from public.comandas c where c.id = comanda_itens.comanda_id and c.status = 'aberta')
  and exists (select 1 from public.produtos p where p.id = comanda_itens.produto_id and p.empresa_id = public.current_empresa_id())
);

-- Realtime: mesas/comandas/comanda_itens precisam refletir quase na hora
-- entre aparelhos diferentes (mais crítico ainda que em vendas, já que dois
-- atendentes podem estar na mesma mesa ao mesmo tempo).
alter table public.mesas replica identity full;
alter table public.comandas replica identity full;
alter table public.comanda_itens replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'mesas'
  ) then
    alter publication supabase_realtime add table public.mesas;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comandas'
  ) then
    alter publication supabase_realtime add table public.comandas;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comanda_itens'
  ) then
    alter publication supabase_realtime add table public.comanda_itens;
  end if;
end $$;
