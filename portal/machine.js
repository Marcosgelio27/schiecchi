import { requireAccount, logout, safe, message } from "./core.js";

document.querySelector(".portal-logout").addEventListener("click", logout);
const account = await requireAccount(["CLIENTE", "ADMINISTRADOR"]);
if (account) {
  const id = new URLSearchParams(location.search).get("id");
  const status = document.querySelector("#page-status");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    document.querySelector(".portal-private").hidden = true;
    message(status, "Identificador de máquina inválido.");
  } else {
    const { data: machine, error } = await account.client.from("machines")
      .select("id, client_id, identifier, manufacturer, model, serial_number, equipment_type, registration_status")
      .eq("id", id).maybeSingle();
    if (error || !machine) {
      document.querySelector(".portal-private").hidden = true;
      message(status, "Máquina não encontrada ou acesso não autorizado.");
    } else {
      const fields = [
        ["IDENTIFICAÇÃO", machine.identifier], ["FABRICANTE", machine.manufacturer || "Não informado"],
        ["MODELO", machine.model || "Não informado"], ["NÚMERO DE SÉRIE", machine.serial_number || "Não informado"],
        ["TIPO", machine.equipment_type || "Não informado"], ["STATUS CADASTRAL", machine.registration_status]
      ];
      document.querySelector("#machine-details").innerHTML = fields.map(([label, value]) =>
        `<div><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`).join("");
      document.title = `Telemetria · ${machine.identifier} — SCHIECCHI`;
    }
  }
}
