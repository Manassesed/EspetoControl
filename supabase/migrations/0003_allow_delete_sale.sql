-- Permite desfazer uma venda lançada por erro: quem registrou a venda (ou o
-- gerente) pode excluí-la. venda_itens já tem "on delete cascade" pra venda_id,
-- então excluir a venda limpa os itens junto.

drop policy if exists "vendas_delete_own_or_gerente" on public.vendas;
create policy "vendas_delete_own_or_gerente"
on public.vendas for delete
to authenticated
using (
  empresa_id = public.current_empresa_id()
  and (usuario_id = auth.uid() or public.current_user_role() = 'gerente')
);
