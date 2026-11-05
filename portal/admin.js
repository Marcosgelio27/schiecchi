import { requireAccount, logout, message, readForm, safe, titleCase } from "./core.js";

const state = { clients: [], users: [], machines: [], devices: [] };
const notice = document.querySelector("#admin-status");
document.querySelector(".portal-logout").addEventListener("click", logout);

const account = await requireAccount(["ADMINISTRADOR"]);
if (account) {
  const { client } = account;
  document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("selected", item === button));
    document.querySelectorAll("[data-panel]").forEach(panel => panel.hidden = panel.dataset.panel !== button.dataset.tab);
    notice.hidden = true;
  }));

  document.querySelectorAll(".reset-form").forEach(button => button.addEventListener("click", () => {
    const form = button.closest("form");
    form.reset();
    form.elements.id.value = "";
  }));

  async function load() {
    const tables = ["clients", "profiles", "machines", "telemetry_devices"];
    const results = await Promise.all(tables.map(table => client.from(table).select("*").order("created_at", { ascending: false })));
    const failure = results.find(result => result.error);
    if (failure) throw failure.error;
    [state.clients, state.users, state.machines, state.devices] = results.map(result => result.data);
    render();
  }

  function setOptions(select, items, label, blank = "Selecione") {
    const selected = select.value;
    select.innerHTML = `<option value="">${safe(blank)}</option>` + items.map(item => `<option value="${safe(item.id)}">${safe(label(item))}</option>`).join("");
    select.value = selected;
  }

  function row(label, detail, type, id) {
    return `<div class="record-row"><div><strong>${safe(label)}</strong><small>${safe(detail)}</small></div><button type="button" data-edit="${type}" data-id="${safe(id)}">EDITAR</button></div>`;
  }

  function render() {
    document.querySelector("#count-clients").textContent = state.clients.length;
    document.querySelector("#count-machines").textContent = state.machines.length;
    document.querySelector("#count-users").textContent = state.users.filter(user => user.active).length;
    document.querySelector("#count-devices").textContent = state.devices.length;
    setOptions(document.querySelector("#user-client-select"), state.clients, item => item.legal_name, "Selecione quando o perfil for Cliente");
    setOptions(document.querySelector("#machine-client-select"), state.clients, item => item.legal_name);
    setOptions(document.querySelector("#device-machine-select"), state.machines, item => item.identifier, "Aguardando associação");
    document.querySelector("#clients-list").innerHTML = state.clients.length
      ? state.clients.map(item => row(item.legal_name, `${item.active ? "ATIVO" : "INATIVO"} · ${item.responsible || "Responsável não informado"} · ${new Date(item.created_at).toLocaleDateString("pt-BR")}`, "client", item.id)).join("")
      : '<p class="empty-state">Nenhum cliente cadastrado.</p>';
    document.querySelector("#users-list").innerHTML = state.users.length
      ? state.users.map(item => row(item.username, `${item.role} · ${item.email} · ${item.active ? "ATIVO" : "INATIVO"}`, "user", item.id)).join("")
      : '<p class="empty-state">Nenhum usuário cadastrado.</p>';
    document.querySelector("#machines-list").innerHTML = state.machines.length
      ? state.machines.map(item => row(item.identifier, `${state.clients.find(clientItem => clientItem.id === item.client_id)?.legal_name || "Cliente"} · ${item.registration_status} · ${item.manufacturer || "Fabricante não informado"} ${item.model || ""}`, "machine", item.id)).join("")
      : '<p class="empty-state">Nenhuma máquina cadastrada.</p>';
    document.querySelector("#devices-list").innerHTML = state.devices.length
      ? state.devices.map(item => row(item.id, `${item.registration_status} · ${state.machines.find(machine => machine.id === item.machine_id)?.identifier || "Sem máquina vinculada"}`, "device", item.id)).join("")
      : '<p class="empty-state">Nenhum dispositivo cadastrado.</p>';
  }

  document.querySelector(".portal-main").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit]");
    if (!edit) return;
    const table = { client: "clients", user: "users", machine: "machines", device: "devices" }[edit.dataset.edit];
    const form = document.querySelector(`#${edit.dataset.edit}-form`);
    const record = state[table].find(item => item.id === edit.dataset.id);
    if (!record) return;
    for (const [key, value] of Object.entries(record)) {
      if (form.elements[key]) form.elements[key].value = value ?? "";
    }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  async function saveForm(form, table, payload) {
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    notice.hidden = true;
    try {
      const id = form.elements.id.value;
      const query = id ? client.from(table).update(payload).eq("id", id) : client.from(table).insert(payload);
      const { error } = await query;
      if (error) throw error;
      form.reset(); form.elements.id.value = "";
      await load();
      message(notice, "Registro salvo.", "info");
    } catch (error) {
      message(notice, error.message || "Não foi possível salvar o registro.");
    } finally { submit.disabled = false; }
  }

  document.querySelector("#client-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = readForm(form);
    saveForm(form, "clients", {
      legal_name: values.legal_name.trim(), responsible: values.responsible.trim() || null,
      email: values.email.trim() || null, phone: values.phone.trim() || null, active: values.active === "true"
    });
  });

  document.querySelector("#user-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = readForm(form);
    if (values.role === "CLIENTE" && !values.client_id) {
      message(notice, "Selecione a organização do usuário Cliente.");
      return;
    }
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true; notice.hidden = true;
    try {
      const payload = {
        id: values.id || undefined, username: values.username.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(), full_name: values.full_name.trim() || null,
        phone: values.phone.trim() || null, role: values.role,
        client_id: values.role === "CLIENTE" ? values.client_id : null,
        active: values.active === "true"
      };
      const { data, error } = await client.functions.invoke("admin-users", {
        body: { action: values.id ? "update" : "invite", profile: payload }
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Falha na operação.");
      form.reset(); form.elements.id.value = "";
      await load();
      message(notice, values.id ? "Usuário atualizado." : "Convite enviado ao usuário.", "info");
    } catch (error) { message(notice, error.message || "Não foi possível salvar o usuário."); }
    finally { submit.disabled = false; }
  });

  document.querySelector("#machine-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = readForm(form);
    saveForm(form, "machines", {
      client_id: values.client_id, identifier: values.identifier.trim(),
      manufacturer: values.manufacturer.trim() || null, model: values.model.trim() || null,
      serial_number: values.serial_number.trim() || null, equipment_type: values.equipment_type.trim() || null,
      model_year: values.model_year ? Number(values.model_year) : null,
      location_unit: values.location_unit.trim() || null,
      registration_status: values.registration_status, notes: values.notes.trim() || null
    });
  });

  document.querySelector("#device-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = readForm(form);
    if ((values.machine_id && values.registration_status === "CADASTRADO") ||
        (!values.machine_id && values.registration_status === "ASSOCIADO")) {
      message(notice, "Ajuste o status para corresponder ao vínculo com a máquina.");
      return;
    }
    saveForm(form, "telemetry_devices", {
      machine_id: values.machine_id || null, registration_status: values.registration_status
    });
  });

  load().catch(error => message(notice, error.message || "Não foi possível carregar os cadastros."));
}
