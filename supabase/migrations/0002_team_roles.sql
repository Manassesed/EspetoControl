-- Equipe real: papel (role) e status por usuário, convite por email, RLS por papel.
-- Substitui o antigo "modo colaborador" local (PIN no device) por contas reais.
-- Rode no Supabase (SQL Editor) depois do 0001_add_custo_produtos.sql.

alter table public.usuarios
  add column if not exists role text not null default 'gerente' check (role in ('gerente', 'colaborador')),
  add column if not exists status text not null default 'ativo' check (status in ('pendente', 'ativo', 'inativo')),
  add column if not exists convidado_por uuid references public.usuarios(id),
  add column if not exists created_at timestamptz not null default now();

create index if not exists usuarios_empresa_role_idx on public.usuarios(empresa_id, role);

-- Helpers usados pelas policies abaixo.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.usuarios where id = auth.uid() limit 1
$$;

create or replace function public.current_user_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select status from public.usuarios where id = auth.uid() limit 1
$$;

-- Quem é convidado entra como 'gerente' criando empresa nova (fluxo de cadastro atual).
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

  select * into v_usuario from public.usuarios where id = v_user_id;
  if found then
    return v_usuario;
  end if;

  insert into public.empresas (nome)
  values (trim(p_empresa))
  returning id into v_empresa_id;

  insert into public.usuarios (id, empresa_id, nome, email, role, status)
  values (v_user_id, v_empresa_id, trim(p_nome), lower(trim(p_email)), 'gerente', 'ativo')
  returning * into v_usuario;

  return v_usuario;
end;
$$;

-- Quem aceita um convite (criado via Edge Function invite-member) entra com a
-- empresa_id/role que vieram nos metadados do auth.users, em vez de criar empresa nova.
create or replace function public.accept_invite_profile(p_nome text)
returns public.usuarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_meta jsonb;
  v_empresa_id uuid;
  v_role text;
  v_usuario public.usuarios;
begin
  if v_user_id is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select * into v_usuario from public.usuarios where id = v_user_id;
  if found then
    update public.usuarios
    set status = 'ativo', nome = coalesce(trim(p_nome), nome)
    where id = v_user_id
    returning * into v_usuario;
    return v_usuario;
  end if;

  select email, raw_user_meta_data into v_email, v_meta
  from auth.users where id = v_user_id;

  v_empresa_id := (v_meta ->> 'empresa_id')::uuid;
  v_role := coalesce(v_meta ->> 'role', 'colaborador');

  if v_empresa_id is null then
    raise exception 'Convite invalido: empresa nao encontrada';
  end if;

  insert into public.usuarios (id, empresa_id, nome, email, role, status)
  values (v_user_id, v_empresa_id, trim(p_nome), lower(trim(v_email)), v_role, 'ativo')
  returning * into v_usuario;

  return v_usuario;
end;
$$;

-- Trocar nível de acesso de um membro da equipe. Só o gerente pode, e não pode
-- rebaixar a si mesmo se for o único gerente (evita empresa sem gerente).
create or replace function public.update_member_role(p_user_id uuid, p_role text)
returns public.usuarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_gerentes_count integer;
  v_usuario public.usuarios;
begin
  if public.current_user_role() <> 'gerente' then
    raise exception 'Apenas o gerente pode alterar nivel de acesso';
  end if;

  if p_role not in ('gerente', 'colaborador') then
    raise exception 'Nivel de acesso invalido';
  end if;

  if p_user_id = auth.uid() and p_role = 'colaborador' then
    select count(*) into v_gerentes_count
    from public.usuarios where empresa_id = v_empresa_id and role = 'gerente';
    if v_gerentes_count <= 1 then
      raise exception 'A empresa precisa de ao menos um gerente';
    end if;
  end if;

  update public.usuarios
  set role = p_role
  where id = p_user_id and empresa_id = v_empresa_id
  returning * into v_usuario;

  if not found then
    raise exception 'Membro nao encontrado';
  end if;

  return v_usuario;
end;
$$;

-- Ativar/desativar um membro. Só o gerente pode, e não pode desativar a si mesmo.
create or replace function public.update_member_status(p_user_id uuid, p_status text)
returns public.usuarios
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa_id uuid := public.current_empresa_id();
  v_usuario public.usuarios;
begin
  if public.current_user_role() <> 'gerente' then
    raise exception 'Apenas o gerente pode alterar status de membros';
  end if;

  if p_status not in ('ativo', 'inativo') then
    raise exception 'Status invalido';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Voce nao pode alterar seu proprio status';
  end if;

  update public.usuarios
  set status = p_status
  where id = p_user_id and empresa_id = v_empresa_id
  returning * into v_usuario;

  if not found then
    raise exception 'Membro nao encontrado';
  end if;

  return v_usuario;
end;
$$;

grant execute on function public.create_initial_profile(text, text, text) to authenticated;
grant execute on function public.accept_invite_profile(text) to authenticated;
grant execute on function public.update_member_role(uuid, text) to authenticated;
grant execute on function public.update_member_status(uuid, text) to authenticated;

-- RLS: dados financeiros (gastos, e a listagem completa de vendas) só para gerente.
-- Colaborador continua podendo registrar a própria venda, mas não vê o caixa todo.

drop policy if exists "vendas_all_same_company" on public.vendas;

drop policy if exists "vendas_select_same_company" on public.vendas;
create policy "vendas_select_same_company"
on public.vendas for select
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and (public.current_user_role() = 'gerente' or usuario_id = auth.uid())
);

drop policy if exists "vendas_insert_same_company" on public.vendas;
create policy "vendas_insert_same_company"
on public.vendas for insert
to authenticated
with check (
  empresa_id = public.current_empresa_id()
  and usuario_id = auth.uid()
  and public.current_user_status() = 'ativo'
);

drop policy if exists "gastos_all_same_company" on public.gastos;
create policy "gastos_all_same_company"
on public.gastos for all
to authenticated
using (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente')
with check (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');

-- Produtos: qualquer ativo da empresa pode ler (precisa pra vender), só gerente edita.
drop policy if exists "produtos_all_same_company" on public.produtos;

drop policy if exists "produtos_select_same_company" on public.produtos;
create policy "produtos_select_same_company"
on public.produtos for select
to authenticated
using (empresa_id = public.current_empresa_id());

drop policy if exists "produtos_write_gerente" on public.produtos;
create policy "produtos_write_gerente"
on public.produtos for insert
to authenticated
with check (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');

drop policy if exists "produtos_update_gerente" on public.produtos;
create policy "produtos_update_gerente"
on public.produtos for update
to authenticated
using (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente')
with check (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');

drop policy if exists "produtos_delete_gerente" on public.produtos;
create policy "produtos_delete_gerente"
on public.produtos for delete
to authenticated
using (empresa_id = public.current_empresa_id() and public.current_user_role() = 'gerente');
