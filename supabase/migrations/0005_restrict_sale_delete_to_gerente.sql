-- O colaborador não deve poder excluir (nem editar) vendas, só visualizar as
-- próprias. A 0003 liberou o delete pro próprio autor da venda "pra desfazer
-- erro de lançamento" — mas o pedido é que só o gerente tenha essa ação.
-- Edição de venda não existe em nenhuma policy nem tela, então não há o que
-- restringir além do delete.

drop policy if exists "vendas_delete_own_or_gerente" on public.vendas;
create policy "vendas_delete_gerente"
on public.vendas for delete
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and public.current_user_role() = 'gerente'
);
