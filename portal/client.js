import { requireAccount, logout, safe, message } from "./core.js";

document.querySelector(".portal-logout").addEventListener("click", logout);
const account = await requireAccount(["CLIENTE"]);
if (account) {
  const list = document.querySelector("#my-machines");
  const { data, error } = await account.client.from("machines")
    .select("id, identifier, manufacturer, model, serial_number, equipment_type, registration_status")
    .eq("client_id", account.profile.client_id).order("created_at", { ascending: false });
  if (error) {
    message(document.querySelector("#page-status"), "Não foi possível carregar suas máquinas.");
  } else if (!data.length) {
    list.innerHTML = '<p class="empty-state">Nenhuma máquina cadastrada para esta conta.</p>';
  } else {
    list.innerHTML = data.map(machine => `<article class="machine-card">
      <p class="portal-kicker">${safe(machine.registration_status)}</p>
      <h2>${safe([machine.manufacturer, machine.model].filter(Boolean).join(" ") || machine.identifier)}</h2>
      <p><strong>Identificação:</strong> ${safe(machine.identifier)}</p>
      <p><strong>Número de série:</strong> ${safe(machine.serial_number || "Não informado")}</p>
      <p><strong>Tipo:</strong> ${safe(machine.equipment_type || "Não informado")}</p>
      <a class="portal-button" href="../telemetria/?id=${encodeURIComponent(machine.id)}">ACESSAR TELEMETRIA →</a>
    </article>`).join("");
  }
}
