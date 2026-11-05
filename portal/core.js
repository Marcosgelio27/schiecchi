import { supabaseUrl, supabasePublishableKey } from "./config.js";

let connection;
export const configured = Boolean(supabaseUrl && supabasePublishableKey);

export async function db() {
  if (!configured) throw new Error("O projeto Supabase ainda não foi configurado.");
  if (!connection) {
    connection = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")
      .then(({ createClient }) => createClient(supabaseUrl, supabasePublishableKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      }));
  }
  return connection;
}

export async function currentAccount() {
  const client = await db();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return null;
  const { data: profile, error } = await client.from("profiles")
    .select("id, client_id, username, email, full_name, role, active")
    .eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (!profile?.active) return null;
  return { client, user, profile };
}

export async function requireAccount(allowedRoles) {
  if (!configured) {
    showPageMessage("O Portal do Cliente aguarda a configuração do projeto Supabase.");
    return null;
  }
  try {
    const account = await currentAccount();
    if (!account) {
      location.replace("../acesso/");
      return null;
    }
    if (!allowedRoles.includes(account.profile.role)) {
      showPageMessage("Acesso negado para este perfil.");
      return null;
    }
    document.documentElement.classList.add("portal-authorized");
    return account;
  } catch (error) {
    showPageMessage("Não foi possível validar sua sessão. Tente novamente.");
    return null;
  }
}

export async function logout() {
  try { await (await db()).auth.signOut(); } finally { location.replace("../acesso/"); }
}

export function showPageMessage(message) {
  const target = document.querySelector("#page-status");
  if (target) { target.textContent = message; target.hidden = false; }
  document.documentElement.classList.add("portal-locked");
}

export function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function message(target, text, kind = "error") {
  target.textContent = text;
  target.dataset.kind = kind;
  target.hidden = false;
}

export function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function titleCase(value) {
  return String(value ?? "").replaceAll("_", " ");
}
