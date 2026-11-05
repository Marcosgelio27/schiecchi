import { configured, db, currentAccount, message } from "./core.js";

const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");
const submit = form.querySelector("button[type=submit]");
const password = form.elements.password;

if (!configured) {
  message(status, "O acesso estará disponível após a configuração do projeto Supabase.", "info");
  submit.disabled = true;
} else {
  const invitation = new URLSearchParams(location.hash.slice(1)).get("type") === "invite";
  if (invitation) {
    form.hidden = true;
    document.querySelector("#new-password-form").hidden = false;
    document.querySelector("#reset-password").hidden = true;
    message(status, "Defina uma senha para ativar seu acesso.", "info");
  }
  db().then(client => client.auth.onAuthStateChange(event => {
    if (event === "PASSWORD_RECOVERY") {
      document.querySelector("#login-form").hidden = true;
      document.querySelector("#new-password-form").hidden = false;
      document.querySelector("#reset-password").hidden = true;
      message(status, "Defina uma nova senha para sua conta.", "info");
    }
  })).catch(() => {});
}

document.querySelector("#toggle-password").addEventListener("click", event => {
  password.type = password.type === "password" ? "text" : "password";
  event.currentTarget.textContent = password.type === "password" ? "MOSTRAR" : "OCULTAR";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity() || !configured) return;
  submit.disabled = true;
  status.hidden = true;
  try {
    const client = await db();
    const { error } = await client.auth.signInWithPassword({
      email: form.elements.username.value.trim().toLowerCase(),
      password: password.value
    });
    if (error) throw error;
    const account = await currentAccount();
    if (!account) {
      await client.auth.signOut();
      throw new Error("Perfil não autorizado ou inativo.");
    }
    location.replace(account.profile.role === "ADMINISTRADOR" ? "../admin/" : "../cliente/");
  } catch {
    message(status, "Não foi possível entrar. Confira o usuário e a senha ou contate a SCHIECCHI.");
    submit.disabled = false;
  }
});

document.querySelector("#reset-password").addEventListener("click", async () => {
  const email = form.elements.username.value.trim().toLowerCase();
  if (!email || !form.elements.username.checkValidity()) {
    form.elements.username.reportValidity();
    return;
  }
  try {
    const { error } = await (await db()).auth.resetPasswordForEmail(email, {
      redirectTo: new URL("../acesso/", location.href).href
    });
    if (error) throw error;
    message(status, "Se este e-mail estiver cadastrado, você receberá instruções para redefinir a senha.", "info");
  } catch {
    message(status, "Não foi possível solicitar a redefinição agora.");
  }
});

document.querySelector("#new-password-form").addEventListener("submit", async event => {
  event.preventDefault();
  const recoveryForm = event.currentTarget;
  if (!recoveryForm.reportValidity()) return;
  try {
    const { error } = await (await db()).auth.updateUser({ password: recoveryForm.elements.new_password.value });
    if (error) throw error;
    recoveryForm.elements.new_password.value = "";
    message(status, "Senha definida. Você pode entrar com seu e-mail e senha.", "info");
    recoveryForm.hidden = true;
    form.hidden = false;
    document.querySelector("#reset-password").hidden = false;
    await (await db()).auth.signOut();
  } catch {
    message(status, "Não foi possível alterar a senha. Solicite um novo link.");
  }
});
