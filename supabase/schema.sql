create extension if not exists "pgcrypto";

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  email text not null unique
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  preco numeric(12, 2) not null check (preco >= 0),
  custo numeric(12, 2) not null default 0 check (custo >= 0),
  categoria text not null,
  ativo boolean not null default true
);

-- Para bancos já existentes (executar uma vez):
-- alter table public.produtos add column if not exists custo numeric(12, 2) not null default 0 check (custo >= 0);

create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete restrict,
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'dinheiro', 'cartao')),
  created_at timestamptz not null default now()
);

create table if not exists public.venda_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  valor numeric(12, 2) not null check (valor >= 0)
);

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  descricao text not null,
  categoria text not null,
  valor numeric(12, 2) not null check (valor >= 0),
  created_at timestamptz not null default now()
);

create index if not exists usuarios_empresa_id_idx on public.usuarios(empresa_id);
create index if not exists produtos_empresa_id_idx on public.produtos(empresa_id);
create index if not exists vendas_empresa_created_at_idx on public.vendas(empresa_id, created_at desc);
create index if not exists gastos_empresa_created_at_idx on public.gastos(empresa_id, created_at desc);
create index if not exists venda_itens_venda_id_idx on public.venda_itens(venda_id);
create index if not exists venda_itens_produto_id_idx on public.venda_itens(produto_id);

create or replace function public.current_empresa_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from public.usuarios where id = auth.uid() limit 1
$$;

create or replace function public.create_initial_profile(
  p_nome text,
  p_empresa text,
  p_email text
)
returns public.usuarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_empresa_id uuid;
  v_usuario public.usuarios;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select *
  into v_usuario
  from public.usuarios
  where id = v_user_id;

  if found then
    return v_usuario;
  end if;

  insert into public.empresas (nome)
  values (trim(p_empresa))
  returning id into v_empresa_id;

  insert into public.usuarios (id, empresa_id, nome, email)
  values (v_user_id, v_empresa_id, trim(p_nome), lower(trim(p_email)))
  returning * into v_usuario;

  return v_usuario;
end;
$$;

create or replace function public.registrar_venda(
  p_forma_pagamento text,
  p_items jsonb
)
returns public.vendas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_empresa_id uuid;
  v_venda public.vendas;
  v_total numeric(12, 2);
  v_requested_count integer;
  v_valid_count integer;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select public.current_empresa_id() into v_empresa_id;

  if v_empresa_id is null then
    raise exception 'Perfil da empresa nao encontrado';
  end if;

  if p_forma_pagamento not in ('pix', 'dinheiro', 'cartao') then
    raise exception 'Forma de pagamento invalida';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Venda sem itens';
  end if;

  with raw_items as (
    select produto_id, quantidade
    from jsonb_to_recordset(p_items) as item(produto_id uuid, quantidade integer)
  ),
  normalized_items as (
    select produto_id, sum(quantidade)::integer as quantidade
    from raw_items
    group by produto_id
  )
  select count(*)
  into v_requested_count
  from normalized_items
  where quantidade > 0;

  if v_requested_count = 0 then
    raise exception 'Venda sem itens validos';
  end if;

  with raw_items as (
    select produto_id, quantidade
    from jsonb_to_recordset(p_items) as item(produto_id uuid, quantidade integer)
  ),
  normalized_items as (
    select produto_id, sum(quantidade)::integer as quantidade
    from raw_items
    group by produto_id
  ),
  valid_items as (
    select p.id, p.preco, n.quantidade
    from normalized_items n
    join public.produtos p on p.id = n.produto_id
    where p.empresa_id = v_empresa_id
      and p.ativo = true
      and n.quantidade > 0
  )
  select count(*), coalesce(sum(preco * quantidade), 0)::numeric(12, 2)
  into v_valid_count, v_total
  from valid_items;

  if v_valid_count <> v_requested_count then
    raise exception 'Produto invalido ou inativo na venda';
  end if;

  insert into public.vendas (empresa_id, usuario_id, forma_pagamento, valor_total)
  values (v_empresa_id, v_user_id, p_forma_pagamento, v_total)
  returning * into v_venda;

  with raw_items as (
    select produto_id, quantidade
    from jsonb_to_recordset(p_items) as item(produto_id uuid, quantidade integer)
  ),
  normalized_items as (
    select produto_id, sum(quantidade)::integer as quantidade
    from raw_items
    group by produto_id
  )
  insert into public.venda_itens (venda_id, produto_id, quantidade, valor)
  select v_venda.id, p.id, n.quantidade, (p.preco * n.quantidade)::numeric(12, 2)
  from normalized_items n
  join public.produtos p on p.id = n.produto_id
  where p.empresa_id = v_empresa_id
    and p.ativo = true
    and n.quantidade > 0;

  return v_venda;
end;
$$;

grant execute on function public.create_initial_profile(text, text, text) to authenticated;
grant execute on function public.registrar_venda(text, jsonb) to authenticated;

alter table public.empresas enable row level security;
alter table public.usuarios enable row level security;
alter table public.produtos enable row level security;
alter table public.vendas enable row level security;
alter table public.venda_itens enable row level security;
alter table public.gastos enable row level security;

drop policy if exists "empresas_insert_authenticated" on public.empresas;

drop policy if exists "empresas_select_same_company" on public.empresas;
create policy "empresas_select_same_company"
on public.empresas for select
to authenticated
using (id = public.current_empresa_id());

drop policy if exists "empresas_update_same_company" on public.empresas;
create policy "empresas_update_same_company"
on public.empresas for update
to authenticated
using (id = public.current_empresa_id())
with check (id = public.current_empresa_id());

drop policy if exists "usuarios_insert_self" on public.usuarios;

drop policy if exists "usuarios_select_same_company_or_self" on public.usuarios;
create policy "usuarios_select_same_company_or_self"
on public.usuarios for select
to authenticated
using (id = auth.uid() or empresa_id = public.current_empresa_id());

drop policy if exists "usuarios_update_self" on public.usuarios;
create policy "usuarios_update_self"
on public.usuarios for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and empresa_id = public.current_empresa_id());

drop policy if exists "produtos_all_same_company" on public.produtos;
create policy "produtos_all_same_company"
on public.produtos for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());

drop policy if exists "vendas_all_same_company" on public.vendas;
create policy "vendas_all_same_company"
on public.vendas for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id() and usuario_id = auth.uid());

drop policy if exists "venda_itens_all_same_company" on public.venda_itens;
create policy "venda_itens_all_same_company"
on public.venda_itens for all
to authenticated
using (
  exists (
    select 1
    from public.vendas
    where vendas.id = venda_itens.venda_id
      and vendas.empresa_id = public.current_empresa_id()
  )
)
with check (
  exists (
    select 1
    from public.vendas
    where vendas.id = venda_itens.venda_id
      and vendas.empresa_id = public.current_empresa_id()
  )
  and exists (
    select 1
    from public.produtos
    where produtos.id = venda_itens.produto_id
      and produtos.empresa_id = public.current_empresa_id()
  )
);

drop policy if exists "gastos_all_same_company" on public.gastos;
create policy "gastos_all_same_company"
on public.gastos for all
to authenticated
using (empresa_id = public.current_empresa_id())
with check (empresa_id = public.current_empresa_id());
