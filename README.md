# SCHIECCHI

Site institucional estático de `schiecchi.com.br`, publicado pelo GitHub Pages. A SCHIECCHI é a marca de tecnologia; SCHIECCHI GATEWAY, AXIS WIND e AXIS LEVEL são produtos apresentados no site.

O formulário de contato usa provisoriamente `mailto:contato@schiecchi.com.br`: ele abre o aplicativo de e-mail do visitante com Nome e WhatsApp preenchidos. Ainda não há banco de leads ou envio automático. A imagem da grua exibida na seção do caso NUTRIOIL é uma ilustração gerada digitalmente e está identificada como tal na página.

Para alterar o site, abra esta pasta no Codex e descreva a mudança. Antes de editar, o Codex deve consultar as instruções em `AGENTS.md` e atualizar o projeto a partir do GitHub, preservando qualquer trabalho local. Depois, edita os arquivos, registra um commit e envia a alteração. Cada envio para a branch `main` atualiza automaticamente o site pelo GitHub Pages.

## Publicação

No GitHub Free, o repositório precisa ser público para usar o GitHub Pages. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`. Em **Custom domain**, use `schiecchi.com.br` e, após o certificado ficar disponível, ative **Enforce HTTPS**.

Na zona DNS da Registro.br, crie quatro registros `A` para `@`, apontando para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Crie também um registro `CNAME` para `www`, apontando para `marcosgelio27.github.io`.
