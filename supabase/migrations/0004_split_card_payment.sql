-- Separa "cartao" em "cartao_credito" e "cartao_debito" para refletir a forma
-- real de pagamento nos relatórios.

-- Remove a constraint antiga ANTES de migrar os dados — caso contrário o UPDATE abaixo
-- violaria a regra antiga (que só aceitava 'cartao') antes mesmo de ela ser substituída.
alter table public.vendas drop constraint if exists vendas_forma_pagamento_check;

update public.vendas set forma_pagamento = 'cartao_credito' where forma_pagamento = 'cartao';

alter table public.vendas add constraint vendas_forma_pagamento_check
  check (forma_pagamento in ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito'));

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

  if p_forma_pagamento not in ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito') then
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
