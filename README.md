# Schiecchi Mecatrônica

Site estático de `schiecchi.com.br`.

Para alterar o site, abra esta pasta no Codex e descreva a mudança nesta tarefa. O Codex pode editar os arquivos, registrar um commit e enviar a alteração ao repositório GitHub. Quando o GitHub Pages estiver ativado, cada envio para a branch `main` atualizará o site.

## Publicação

No GitHub Free, o repositório precisa ser público para usar o GitHub Pages. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main`, pasta `/ (root)`. Em **Custom domain**, use `schiecchi.com.br` e, após o certificado ficar disponível, ative **Enforce HTTPS**.

Na zona DNS da Registro.br, crie quatro registros `A` para `@`, apontando para `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Crie também um registro `CNAME` para `www`, apontando para `marcosgelio27.github.io`.
