-- Permite ao administrador excluir clientes e máquinas de teste.
-- As chaves estrangeiras existentes impedem apagar registros com vínculos.
-- Nenhum cliente recebe permissão de exclusão.

grant delete on public.clients, public.machines to authenticated;

drop policy if exists clients_admin_delete on public.clients;
create policy clients_admin_delete on public.clients for delete to authenticated
using ((select app.is_admin()));

drop policy if exists machines_admin_delete on public.machines;
create policy machines_admin_delete on public.machines for delete to authenticated
using ((select app.is_admin()));
