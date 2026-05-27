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
      modal.classList.remove("is-open");
      setTimeout(function () {
        if (!modal.classList.contains("is-open")) {
          modal.setAttribute("hidden", "");
        }
      }, 350);
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
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            overlay.classList.add("is-open");
          });
        });
        document.body.classList.add("modal-open");
        return;
      }
      closeAllModals();
      var modal = document.getElementById("modal-" + id);
      if (!modal) return;
      modal.removeAttribute("hidden");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          modal.classList.add("is-open");
        });
      });
      document.body.classList.add("modal-open");
    });
  });

  var aboutClose = document.getElementById("about-overlay-close");
  if (aboutClose) {
    aboutClose.addEventListener("click", function () {
      var overlay = document.getElementById("about-overlay");
      if (!overlay) return;
      overlay.classList.remove("is-open");
      setTimeout(function () {
        overlay.setAttribute("hidden", "");
      }, 450);
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
      if (overlay && overlay.classList.contains("is-open")) {
        overlay.classList.remove("is-open");
        setTimeout(function () {
          overlay.setAttribute("hidden", "");
        }, 450);
      }
    }
  });

  /* —— Lightbox —— */
  (function () {
    var lightbox = document.getElementById("lightbox");
    var lbImg = document.getElementById("lightbox-img");
    var lbClose = document.getElementById("lightbox-close");
    var lbBackdrop = document.getElementById("lightbox-backdrop");
    var lbCaption = document.getElementById("lightbox-caption");
    var lbTitle = document.getElementById("lightbox-caption-title");
    var lbText = document.getElementById("lightbox-caption-text");
    if (!lightbox || !lbImg) return;

    var captions = {};
    fetch("https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/gallery-captions.json")
      .then(function(r) { return r.ok ? r.json() : {}; })
      .then(function(d) { captions = d; })
      .catch(function() {});

    function openLightbox(src, filename) {
      lbImg.src = src;
      var cap = captions[filename] || {};
      if (cap.title || cap.text) {
        lbTitle.textContent = cap.title || "";
        lbText.textContent = cap.text || "";
        lbCaption.style.display = "block";
      } else {
        lbCaption.style.display = "none";
      }
      lightbox.removeAttribute("hidden");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          lightbox.classList.add("is-open");
        });
      });
      document.body.classList.add("modal-open");
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      setTimeout(function () {
        lightbox.setAttribute("hidden", "");
        lbImg.src = "";
      }, 320);
      document.body.classList.remove("modal-open");
    }

    document.querySelectorAll(".ao-gallery__item img").forEach(function (img) {
      img.parentElement.addEventListener("click", function () {
        openLightbox(img.src, img.alt);
      });
    });

    lbClose.addEventListener("click", closeLightbox);
    lbBackdrop.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hasAttribute("hidden")) {
        closeLightbox();
      }
    });

    window._openLightbox = openLightbox;
  })();

  /* —— Galerie Overlay —— */
  (function () {
    var btn = document.getElementById("gallery-more-btn");
    var overlay = document.getElementById("gallery-overlay");
    var closeBtn = document.getElementById("gallery-overlay-close");
    var backdrop = document.getElementById("gallery-overlay-backdrop");
    var grid = document.getElementById("gallery-overlay-grid");
    if (!btn || !overlay) return;

    var loaded = false;

    async function loadGalleryImages() {
      try {
        var res = await fetch("https://api.github.com/repos/Lirolol007/Meine-Socials/contents/");
        var files = await res.json();
        var images = files.filter(function(f) { return /^gallery\d+\./i.test(f.name); });
        images.sort(function(a, b) {
          var na = parseInt(a.name.match(/\d+/)[0]);
          var nb = parseInt(b.name.match(/\d+/)[0]);
          return na - nb;
        });
        if (!images.length) {
          grid.innerHTML = "<p style='font-size:0.85rem;color:#9ca3af;padding:1rem'>Noch keine Bilder</p>";
          return;
        }
        grid.innerHTML = "";
        images.forEach(function(f) {
          var item = document.createElement("div");
          item.className = "ao-gallery__item";
          var img = document.createElement("img");
          img.src = f.download_url;
          img.alt = f.name;
          img.loading = "lazy";
          item.appendChild(img);
          item.addEventListener("click", function () {
            if (window._openLightbox) window._openLightbox(f.download_url, f.name);
          });
          grid.appendChild(item);
        });
        loaded = true;
      } catch(e) {
        grid.innerHTML = "<p style='font-size:0.85rem;color:#ff6b6b;padding:1rem'>Fehler beim Laden der Bilder</p>";
      }
    }

    function openGallery() {
      overlay.removeAttribute("hidden");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          overlay.classList.add("is-open");
        });
      });
      document.body.classList.add("modal-open");
      if (!loaded) loadGalleryImages();
    }

    function closeGallery() {
      overlay.classList.remove("is-open");
      setTimeout(function () {
        overlay.setAttribute("hidden", "");
      }, 450);
      document.body.classList.remove("modal-open");
    }

    btn.addEventListener("click", openGallery);
    closeBtn.addEventListener("click", closeGallery);
    backdrop.addEventListener("click", closeGallery);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hasAttribute("hidden")) closeGallery();
    });
  })();

  /* —— Site Data laden (am Ende) —— */
  setTimeout(function() {
    fetch("site-data.json?t=" + Date.now())
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) { 
        if (!d) return;
        applyData(d);
      })
      .catch(function(e) { 
        console.log("site-data.json konnte nicht geladen werden");
      });
  }, 100);

  function applyData(d) {
    if (!d) return;

    var nameEl = document.querySelector(".name");
    if (nameEl) nameEl.textContent = d.name || "";

    var badgeEl = document.querySelector(".badge");
    if (badgeEl) badgeEl.textContent = d.badge || "";

    var tagsEl = document.querySelector(".tags");
    if (tagsEl && d.tags && d.tags.length) {
      tagsEl.innerHTML = d.tags.map(function(t) {
        return '<span class="tag">' + t + '</span>';
      }).join("");
    }

    var cpEl = document.querySelector(".catchphrase");
    if (cpEl) cpEl.textContent = d.catchphrase || "";

    var bioEl = document.querySelector(".bio");
    if (bioEl) bioEl.innerHTML = (d.bio || "") + "<br>Willkommen :3";

    var heroName = document.querySelector(".ao-hero__name");
    if (heroName) heroName.textContent = d.name || "";

    var heroSub = document.querySelector(".ao-hero__sub");
    if (heroSub) heroSub.textContent = d.bio || "";

    var heroQuote = document.querySelector(".ao-hero__quote");
    if (heroQuote) heroQuote.textContent = "„" + (d.quote || "") + """;

    var facts = document.querySelectorAll(".ao-fact__val");
    var factVals = [d.factName, d.factAge, d.factHeight, d.factOrigin];
    facts.forEach(function(el, i) { if (factVals[i] !== undefined) el.textContent = factVals[i]; });

    var bioBlock = document.querySelectorAll(".ao-text-block p");
    if (bioBlock[0] && d.bio1) bioBlock[0].textContent = d.bio1;
    if (bioBlock[1] && d.bio2) bioBlock[1].textContent = d.bio2;

    if (d.links) {
      Object.keys(d.links).forEach(function(brand) {
        var link = d.links[brand];
        var el = document.querySelector('[data-brand="' + brand + '"]');
        if (!el) return;
        var labelEl = el.querySelector(".link__label");
        if (labelEl) labelEl.textContent = link.label || "";
        var hintEl = el.querySelector(".link__hint");
        if (hintEl) {
          if (link.hint) { hintEl.textContent = link.hint; hintEl.style.display = ""; }
          else hintEl.style.display = "none";
        }
      });
    }

    if (d.collabs) {
      var collabList = document.querySelector(".collab-list");
      if (collabList) {
        collabList.innerHTML = d.collabs.map(function(c) {
          var initial = c.name.charAt(0).toUpperCase();
          var tiktokHandle = c.url.includes("@") ? c.url.split("@")[1].split("?")[0] : "";
          return '<li class="collab-card">' +
            '<div class="collab-card__avatar-wrap">' +
            '<img class="collab-card__avatar" src="collabs/' + c.name.toLowerCase() + '.jpg" ' +
            'data-fallback="https://unavatar.io/tiktok/' + tiktokHandle + '" ' +
            'alt="' + c.name + '" width="44" height="44">' +
            '<span class="collab-card__initials" aria-hidden="true">' + initial + '</span>' +
            '</div>' +
            '<div class="collab-card__info">' +
            '<span class="collab-card__name">' + c.name + '</span>' +
            '<a class="collab-card__btn" href="' + c.url + '" target="_blank" rel="noopener noreferrer">Zum Kanal</a>' +
            '</div></li>';
        }).join("");
        collabList.querySelectorAll(".collab-card__avatar[data-fallback]").forEach(function(img) {
          img.addEventListener("error", function() {
            if (img.dataset.tried) { img.classList.add("is-broken"); return; }
            img.dataset.tried = "1"; img.src = img.getAttribute("data-fallback");
          });
        });
      }
    }
  }
})();
