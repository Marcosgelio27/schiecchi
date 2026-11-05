-- Execute APÓS criar o usuário inicial em Authentication > Users no Dashboard Supabase.
-- Defina a senha somente no Dashboard. Nunca copie senha para este arquivo.
-- Substitua o e-mail abaixo pelo e-mail real usado no Supabase Auth.
insert into public.profiles (id, username, email, role, active)
select id, 'schiecchi', email, 'ADMINISTRADOR', true
from auth.users
where email = 'SUBSTITUA_PELO_EMAIL_DO_ADMINISTRADOR'
on conflict (id) do nothing;
