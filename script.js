const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");

menuButton.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menu");
  });
});

let selectedTechnology = "";
document.querySelectorAll("[data-interest]").forEach((link) => {
  link.addEventListener("click", () => {
    selectedTechnology = link.dataset.interest;
  });
});

const leadForm = document.querySelector("#lead-form");
const leadStatus = document.querySelector("#lead-status");
const whatsappField = document.querySelector("#lead-whatsapp");

whatsappField.addEventListener("input", () => whatsappField.setCustomValidity(""));

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const digits = whatsappField.value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13) {
    whatsappField.setCustomValidity("Informe um WhatsApp válido com DDD.");
    whatsappField.reportValidity();
    return;
  }

  // O envio e o registro serão conectados somente após a aprovação do serviço.
  leadStatus.textContent = "Não foi possível enviar agora. Tente novamente em alguns instantes.";
  leadStatus.hidden = false;
});

const upcomingDialog = document.querySelector("#upcoming-dialog");
document.querySelector("#cases-button").addEventListener("click", () => {
  upcomingDialog.showModal();
});
upcomingDialog.querySelector(".dialog-close").addEventListener("click", () => {
  upcomingDialog.close();
});
upcomingDialog.querySelector("a").addEventListener("click", () => {
  upcomingDialog.close();
});
