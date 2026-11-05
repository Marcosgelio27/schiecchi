-- Teste a executar em projeto Supabase configurado, com dois usuários CLIENTE já criados.
-- Substitua os dois UUIDs abaixo. Execute no SQL Editor em transação.
-- O cliente A deve possuir suas máquinas; o cliente B deve possuir outra máquina.
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'UUID_DO_USUARIO_CLIENTE_A';
select id, identifier, client_id from public.machines;
-- Resultado esperado: somente máquinas do Cliente A.
select id from public.machines where id = 'UUID_DA_MAQUINA_DO_CLIENTE_B';
-- Resultado obrigatório: zero linhas. Teste também acesso direto via REST com JWT do Cliente A.
rollback;
