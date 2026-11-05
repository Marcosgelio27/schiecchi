// Operação privilegiada executada exclusivamente no Supabase Edge Functions.
// A chave secret/service_role permanece no ambiente do servidor, nunca no navegador.
import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return reply(405, { error: "Método não permitido." });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
    const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !publicKey || !secretKey) return reply(503, { error: "Serviço não configurado." });

    const token = request.headers.get("Authorization")?.replace(/^Bearer /i, "");
    if (!token) return reply(401, { error: "Sessão necessária." });
    const authClient = createClient(url, publicKey, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return reply(401, { error: "Sessão inválida." });

    const adminClient = createClient(url, secretKey, { auth: { persistSession: false } });
    const { data: caller, error: callerError } = await adminClient.from("profiles")
      .select("role, active").eq("id", user.id).single();
    if (callerError || !caller?.active || caller.role !== "ADMINISTRADOR") {
      return reply(403, { error: "Acesso administrativo necessário." });
    }

    const { action, profile } = await request.json();
    if (!["invite", "update"].includes(action) || !profile || typeof profile !== "object") {
      return reply(400, { error: "Solicitação inválida." });
    }
    const username = String(profile.username || "").trim().toLowerCase();
    const email = String(profile.email || "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply(400, { error: "Usuário ou e-mail inválido." });
    }
    if (!["CLIENTE", "ADMINISTRADOR"].includes(profile.role)) {
      return reply(400, { error: "Perfil inválido." });
    }
    if (profile.role === "CLIENTE" && !profile.client_id) {
      return reply(400, { error: "Selecione um cliente para este usuário." });
    }
    const values = {
      username, email, full_name: String(profile.full_name || "").trim().slice(0, 120) || null,
      phone: String(profile.phone || "").trim().slice(0, 30) || null,
      role: profile.role, client_id: profile.role === "CLIENTE" ? profile.client_id : null,
      active: Boolean(profile.active)
    };

    if (action === "invite") {
      const siteUrl = Deno.env.get("PORTAL_SITE_URL");
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, siteUrl ? {
        redirectTo: `${siteUrl.replace(/\/$/, "")}/acesso/`
      } : {});
      if (error || !data.user) return reply(400, { error: error?.message || "Convite não enviado." });
      const { error: profileError } = await adminClient.from("profiles")
        .insert({ id: data.user.id, ...values });
      if (profileError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return reply(400, { error: profileError.message });
      }
      return reply(200, { ok: true });
    }

    const id = String(profile.id || "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { error: "ID inválido." });
    const { data: existing, error: existingError } = await adminClient.from("profiles")
      .select("email").eq("id", id).single();
    if (existingError || !existing) return reply(404, { error: "Usuário não encontrado." });
    if (existing.email !== email) {
      const { error: emailError } = await adminClient.auth.admin.updateUserById(id, { email });
      if (emailError) return reply(400, { error: emailError.message });
    }
    const { error: updateError } = await adminClient.from("profiles").update(values).eq("id", id);
    if (updateError) return reply(400, { error: updateError.message });
    return reply(200, { ok: true });
  } catch {
    return reply(500, { error: "Não foi possível processar a solicitação." });
  }
});
