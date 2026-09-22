# Schiecchi Mecatrônica

Site estático de `schiecchi.com.br`.

Para alterar o site, abra esta pasta no Codex e descreva a mudança. Antes de editar, o Codex deve consultar as instruções em `AGENTS.md` e atualizar o projeto a partir do GitHub, preservando qualquer trabalho local. Depois, edita os arquivos, registra um commit e envia a alteração. Cada envio para a branch `main` atualiza automaticamente o site pelo GitHub Pages.

## Publicação

No GitHub Free, o repositório precisa ser público para usar o GitHub Pages. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`. Em **Custom domain**, use `schiecchi.com.br` e, após o certificado ficar disponível, ative **Enforce HTTPS**.

Na zona DNS da Registro.br, crie quatro registros `A` para `@`, apontando para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Crie também um registro `CNAME` para `www`, apontando para `marcosgelio27.github.io`.
