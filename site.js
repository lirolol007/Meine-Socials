(function () {
  /* ===== E-Mail vor Bots verstecken ===== */
  var emailLink = document.getElementById("contact-email");
  if (emailLink) {
    var user = "Liro.lol007";
    var domain = "gmail.com";
    var address = user + "@" + domain;
    emailLink.href = "mailto:" + address;
    emailLink.textContent = address;
  }

  /* ===== Modals ===== */
  var modals = document.querySelectorAll(".modal");
  var openButtons = document.querySelectorAll("[data-modal-open]");

  function closeAllModals() {
    modals.forEach(function (modal) {
      modal.setAttribute("hidden", "");
    });
    document.body.classList.remove("modal-open");
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeAllModals();
      var id = btn.getAttribute("data-modal-open");
      var modal = document.getElementById("modal-" + id);
      if (!modal) return;
      modal.removeAttribute("hidden");
      document.body.classList.add("modal-open");
    });
  });

  modals.forEach(function (modal) {
    // Close button
    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllModals();
      });
    });

    // Backdrop click
    var backdrop = modal.querySelector(".modal__backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllModals();
      });
    }

    // Prevent closing when clicking inside modal
    modal.querySelector(".modal__panel")?.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  // Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllModals();
  });

  /* ===== Navigation Toggle ===== */
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("top-nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("active");
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("active");
      });
    });
  }

  /* ===== Theme Toggle ===== */
  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    var stored = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", stored);
    updateThemeBtn();

    themeToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") || "dark";
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      updateThemeBtn();
    });
  }

  function updateThemeBtn() {
    if (!themeToggle) return;
    var current = document.documentElement.getAttribute("data-theme") || "dark";
    themeToggle.textContent = current === "dark" ? "☀️" : "🌙";
  }
})();
