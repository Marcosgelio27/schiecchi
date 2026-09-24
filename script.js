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

document.querySelector("#lead-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#lead-name").value.trim();
  const whatsapp = document.querySelector("#lead-whatsapp").value.trim();
  const subject = encodeURIComponent("Contato pelo site SCHIECCHI");
  const interestLine = selectedTechnology ? `Interesse: ${selectedTechnology}\n` : "";
  const body = encodeURIComponent(
    `Nome: ${name}\nWhatsApp: ${whatsapp}\n${interestLine}\nGostaria de falar com um especialista.`
  );
  window.location.href = `mailto:contato@schiecchi.com.br?subject=${subject}&body=${body}`;
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
