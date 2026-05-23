(function () {
  /* —— E-Mail vor einfachen Bots verstecken —— */
  var emailLink = document.getElementById("contact-email");
  if (emailLink) {
    var user = "Liro.lol007";
    var domain = "gmail.com";
    var address = user + "@" + domain;
    emailLink.href = "mailto:" + address;
    emailLink.textContent = address;
  }

  /* —— Kollegen-Avatare: Fallback ohne Inline-Skript —— */
  document.querySelectorAll(".collab-card__avatar[data-fallback]").forEach(function (img) {
    img.addEventListener("error", function () {
      if (img.dataset.tried) {
        img.classList.add("is-broken");
        return;
      }
      img.dataset.tried = "1";
      img.src = img.getAttribute("data-fallback");
    });
  });

  /* —— Modals —— */
  var modals = document.querySelectorAll(".modal");
  var openButtons = document.querySelectorAll("[data-modal-open]");

  function closeAllModals() {
    modals.forEach(function (modal) {
      modal.setAttribute("hidden", "");
    });
    document.body.classList.remove("modal-open");
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      closeAllModals();
      var id = btn.getAttribute("data-modal-open");
      var modal = document.getElementById("modal-" + id);
      if (!modal) return;
      modal.removeAttribute("hidden");
      document.body.classList.add("modal-open");
    });
  });

  modals.forEach(function (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeAllModals);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllModals();
  });
})();
