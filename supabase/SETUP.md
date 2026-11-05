# Portal do Cliente SCHIECCHI — configuração

O projeto institucional é servido pelo GitHub Pages. O portal usa Supabase Auth e tabelas PostgreSQL com RLS; nenhuma senha ou chave administrativa deve ser colocada nos arquivos públicos.

Configuração inicial concluída em 05/11/2026: projeto Supabase criado, esquema SQL aplicado, administrador inicial criado, URL e chave publishable configuradas em `portal/config.js`, função `admin-users` implantada e URLs de retorno local/oficial autorizadas. Convites e isolamento entre dois clientes reais ainda dependem de contas de cliente para teste completo.

## Ordem de ativação

1. Crie um projeto em https://supabase.com/dashboard. Guarde a senha do banco somente no gerenciador de senhas. Não a envie por chat.
2. Em **SQL Editor**, execute `migrations/20261105_portal_base.sql` uma única vez. Isso cria `clients`, `profiles`, `machines`, `telemetry_devices`, vínculos, restrições e políticas RLS.
3. Em **Authentication > URL Configuration**, configure a URL principal do site e inclua `https://schiecchi.com.br/acesso/` entre os redirecionamentos autorizados. Para testes locais, inclua também `http://127.0.0.1:8765/acesso/`.
4. Em **Authentication > Users**, crie o primeiro usuário com um e-mail real sob controle da SCHIECCHI. Defina a senha inicial na interface segura do Supabase. O identificador público `schiecchi` ficará no perfil; o login utiliza o **e-mail**, conforme o Supabase Auth. Não escreva a senha em SQL, código ou arquivos do repositório.
5. Copie o UUID desse usuário e o mesmo e-mail para `bootstrap-admin.example.sql`, execute a instrução no SQL Editor e confirme que o perfil tem papel `ADMINISTRADOR` e está ativo. Use o arquivo somente como modelo; não grave dados reais nele.
6. Em **Project Settings > API**, copie apenas a URL do projeto e a chave **publishable/anon** para `portal/config.js`. Essa chave é destinada ao navegador. Jamais coloque `service_role` ou uma secret key nesse arquivo.
7. Faça o deploy somente da Edge Function `supabase/functions/admin-users/index.ts` no projeto Supabase, com o nome `admin-users`, quando estiver pronto para testar a integração. Para testes locais, configure `PORTAL_SITE_URL=http://127.0.0.1:8765` no ambiente seguro da função; antes da publicação futura, ajuste para `https://schiecchi.com.br`. A função usa `SUPABASE_SERVICE_ROLE_KEY` no servidor e verifica que o chamador é um administrador ativo. Fazer o deploy dessa função é uma etapa futura, separada da preparação local solicitada agora.
8. Teste login, redefinição de senha, convite, criação de cliente/máquina, vínculo e isolamento de clientes. Use `tests/rls-isolation.example.sql` como roteiro inicial. Somente depois considere publicação.

## Como executar localmente

Na raiz do projeto, sirva o diretório por HTTP local (por exemplo, `python -m http.server 8765 --bind 127.0.0.1`). Abra `http://127.0.0.1:8765/acesso/`. Não use `file://` para testar módulos JavaScript e redirecionamentos de autenticação.

## Regras de segurança

- `portal/config.js` recebe somente URL pública e chave publishable/anon. A proteção dos dados é feita por sessão verificada e RLS, inclusive se alguém modificar URL ou requisição.
- O administrador inicial não pode ser criado apenas pelo site estático. Ele depende do usuário em Supabase Auth e do perfil administrativo correspondente.
- Os convites de novos usuários são enviados pela Edge Function. O usuário define a própria senha no fluxo de convite.
- A estrutura de telemetria ainda não armazena sinais nem simula dados. A futura ingestão exigirá API e autenticação de dispositivos próprias.
- Uma página HTML privada continua sendo um arquivo acessível; os dados privados só são consultados após autenticação e RLS. Não coloque dados sensíveis diretamente em HTML ou JavaScript.
