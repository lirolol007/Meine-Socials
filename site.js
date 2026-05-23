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
      var id = btn.getAttribute("data-modal-open");
      if (id === "about") {
        var overlay = document.getElementById("about-overlay");
        if (!overlay) return;
        overlay.removeAttribute("hidden");
        document.body.classList.add("modal-open");
        return;
      }
      closeAllModals();
      var modal = document.getElementById("modal-" + id);
      if (!modal) return;
      modal.removeAttribute("hidden");
      document.body.classList.add("modal-open");
    });
  });

  var aboutClose = document.getElementById("about-overlay-close");
  if (aboutClose) {
    aboutClose.addEventListener("click", function () {
      var overlay = document.getElementById("about-overlay");
      if (overlay) overlay.setAttribute("hidden", "");
      document.body.classList.remove("modal-open");
    });
  }

  /* —— Cursor-Glow im About-Overlay —— */
  (function () {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var overlay = document.getElementById("about-overlay");
    if (!overlay) return;
    var glow = overlay.querySelector(".ao-cursor-glow");
    if (!glow) return;
    var tx = 0, ty = 0, cx = 0, cy = 0;
    overlay.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      overlay.classList.add("is-cursor-active");
    }, { passive: true });
    overlay.addEventListener("mouseleave", function () {
      overlay.classList.remove("is-cursor-active");
    });
    function aoTick() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      glow.style.transform = "translate(" + cx + "px, " + cy + "px)";
      requestAnimationFrame(aoTick);
    }
    aoTick();
  })();

  modals.forEach(function (modal) {
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeAllModals);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAllModals();
      var overlay = document.getElementById("about-overlay");
      if (overlay) overlay.setAttribute("hidden", "");
    }
  });
})();
