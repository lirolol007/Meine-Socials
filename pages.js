/* ===== Utilities ===== */
function fromBase64(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    return str;
  }
}

/* ===== Load Site Data ===== */
async function loadSiteData() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/Lirolol007/Meine-Socials/contents/site-data.json?t=${Date.now()}`
    );
    if (!res.ok) throw new Error("site-data.json nicht gefunden");
    const file = await res.json();
    return JSON.parse(fromBase64(file.content.replace(/\n/g, "")));
  } catch (e) {
    console.warn("site-data.json konnte nicht geladen werden:", e.message);
    return getDefaultData();
  }
}

function getDefaultData() {
  return {
    name: "Liro",
    badge: "VRChat Creator",
    factName: "Liro / Leon",
    factAge: "19",
    factHeight: "1,78 m",
    factOrigin: "🇩🇪 Deutschland",
    pages: {
      about: {
        title: "Über mich",
        subtitle: "VRChat Creator, Streamer & Chaos-Agent",
        content: "<p>Moin!</p>"
      }
    },
    blogPosts: [],
    galleryTitles: {}
  };
}

/* ===== Theme Toggle ===== */
function initTheme() {
  const stored = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", stored);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  btn.textContent = current === "dark" ? "☀️" : "🌙";
}

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeButton();
});

/* ===== Nav Toggle ===== */
document.getElementById("nav-toggle")?.addEventListener("click", () => {
  const links = document.querySelector(".nav__links");
  if (links) links.classList.toggle("active");
});

/* ===== ABOUT PAGE ===== */
async function initAboutPage() {
  const contentEl = document.getElementById("page-content");
  if (!contentEl) return;

  console.log("📄 Laden About-Seite...");
  const data = await loadSiteData();
  const about = data.pages?.about || {};

  const titleEl = document.getElementById("page-title");
  const subtitleEl = document.getElementById("page-subtitle");

  if (titleEl) titleEl.textContent = about.title || "Über mich";
  if (subtitleEl) subtitleEl.textContent = about.subtitle || "";

  contentEl.innerHTML = about.content || "<p>Keine Inhalte verfügbar</p>";

  // Facts — mit DEINEN IDs!
  const factName = document.getElementById("fact-name");
  const factAge = document.getElementById("fact-age");
  const factHeight = document.getElementById("fact-height");
  const factOrigin = document.getElementById("fact-origin");

  if (factName) factName.textContent = data.factName || "—";
  if (factAge) factAge.textContent = data.factAge || "—";
  if (factHeight) factHeight.textContent = data.factHeight || "—";
  if (factOrigin) factOrigin.textContent = data.factOrigin || "—";

  console.log("✅ About-Seite geladen");
}

/* ===== GALLERY PAGE ===== */
async function initGalleryPage() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  console.log("🖼️ Laden Galerie...");
  grid.innerHTML = "<p style=\"grid-column: 1/-1; text-align: center; color: var(--text-muted);\">Lädt Bilder...</p>";

  try {
    // Fetch repo contents für Galerie-Bilder
    const res = await fetch(
      `https://api.github.com/repos/Lirolol007/Meine-Socials/contents/?t=${Date.now()}`
    );
    
    if (!res.ok) {
      throw new Error(`GitHub API Fehler: ${res.status}`);
    }

    const files = await res.json();
    const images = files.filter(f => /^gallery\d+\.(png|jpg|jpeg|gif|webp)$/i.test(f.name));

    console.log("📦 Gefundene Bilder:", images.length);

    if (images.length === 0) {
      grid.innerHTML = "<p style=\"grid-column: 1/-1; text-align: center; color: var(--text-muted);\">Noch keine Bilder in der Galerie</p>";
      return;
    }

    // Sort by number
    images.sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)[0]);
      const numB = parseInt(b.name.match(/\d+/)[0]);
      return numA - numB;
    });

    // Load captions
    const data = await loadSiteData();
    const captions = data.galleryTitles || {};

    grid.innerHTML = images.map(f => {
      const cap = captions[f.name] || {};
      return `
        <div class="gallery-item" onclick="openGalleryLightbox('${f.download_url}', '${(cap.title || f.name).replace(/'/g, "\\'")}', '${(cap.text || '').replace(/'/g, "\\'")}'">
          <img src="${f.download_url}" alt="${f.name}" loading="lazy">
          ${cap.title ? `<div class="gallery-item__caption"><span class="gallery-item__title">${cap.title}</span></div>` : ""}
        </div>
      `;
    }).join("");

    console.log("✅ Galerie geladen");
  } catch (e) {
    console.error("❌ Galerie-Fehler:", e);
    grid.innerHTML = `<p style="grid-column: 1/-1; color: #ff6b6b;">❌ Fehler beim Laden der Galerie: ${e.message}</p>`;
  }
}

/* ===== Gallery Lightbox (mit DEINEN IDs!) ===== */
function openGalleryLightbox(url, title, text) {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  
  document.getElementById("lightbox-img").src = url;
  document.getElementById("lightbox-title").textContent = title;
  document.getElementById("lightbox-text").textContent = text;
  lightbox.removeAttribute("hidden");
  document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.setAttribute("hidden", "");
  }
  document.body.style.overflow = "auto";
}

document.getElementById("lightbox-close")?.addEventListener("click", closeGalleryLightbox);
document.getElementById("lightbox")?.addEventListener("click", (e) => {
  if (e.target.id === "lightbox" || e.target.classList.contains("modal__backdrop")) {
    closeGalleryLightbox();
  }
});

/* ===== BLOG PAGE ===== */
let allBlogPosts = [];

async function initBlogPage() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  console.log("📝 Laden Blog...");
  const data = await loadSiteData();
  allBlogPosts = data.blogPosts || [];

  if (allBlogPosts.length === 0) {
    grid.innerHTML = '<div class="blog-empty"><p>Noch keine Blog-Posts vorhanden.</p></div>';
    return;
  }

  grid.innerHTML = allBlogPosts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(post => `
      <div class="blog-card" onclick="openBlogPost(${post.id})">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="blog-card__img">` : `<div class="blog-card__img"></div>`}
        <div class="blog-card__content">
          <p class="blog-card__date">${new Date(post.date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h3 class="blog-card__title">${post.title}</h3>
          <p class="blog-card__excerpt">${post.excerpt}</p>
          <a href="#" class="blog-card__btn" onclick="return false;">Lesen →</a>
        </div>
      </div>
    `)
    .join("");

  console.log("✅ Blog geladen");
}

/* ===== Blog Post Rendering ===== */
function renderBlogBlocks(blocksJson) {
  let blocks = [];
  try {
    blocks = JSON.parse(blocksJson);
  } catch (e) {
    return "<p>Fehler beim Laden der Blöcke</p>";
  }

  return blocks.map(block => {
    if (block.type === "text") {
      return `
        <div class="blog-block blog-block--text">
          <p>${block.content.replace(/\n/g, '</p><p>')}</p>
        </div>
      `;
    }

    if (block.type === "heading") {
      return `
        <div class="blog-block blog-block--heading">
          <h3>${block.content}</h3>
        </div>
      `;
    }

    if (block.type === "image") {
      const position = block.position || "left";
      const width = block.width || "50";
      return `
        <div class="blog-block blog-block--image position-${position}">
          <div class="blog-block--image__img" style="width: ${position === 'full' ? '100%' : width + '%'};">
            <img src="${block.url}" alt="Blog Image">
          </div>
        </div>
      `;
    }

    return "";
  }).join("");
}

function openBlogPost(id) {
  const post = allBlogPosts.find(p => p.id === id);
  if (!post) return;

  document.getElementById("blog-post-title").textContent = post.title;
  
  const dateStr = new Date(post.date).toLocaleDateString('de-DE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  document.getElementById("blog-post-meta").innerHTML = `<span>📅 ${dateStr}</span>`;

  const bodyHtml = renderBlogBlocks(post.content);
  document.getElementById("blog-post-body").innerHTML = bodyHtml;
  
  document.getElementById("blog-modal").classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeBlogPost() {
  const modal = document.getElementById("blog-modal");
  if (modal) modal.classList.remove("is-open");
  document.body.style.overflow = "auto";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeBlogPost();
    closeGalleryLightbox();
  }
});

document.getElementById("blog-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "blog-modal") closeBlogPost();
});

/* ===== Init ALL ===== */
window.addEventListener("load", async () => {
  console.log("🚀 Pages.js initializing...");
  initTheme();
  
  // Check welche Seite wir sind und lade entsprechend
  if (document.getElementById("blog-grid")) {
    console.log("→ Blog-Seite erkannt");
    await initBlogPage();
  }
  
  if (document.getElementById("gallery-grid")) {
    console.log("→ Galerie-Seite erkannt");
    await initGalleryPage();
  }
  
  if (document.getElementById("page-content")) {
    console.log("→ About-Seite erkannt");
    await initAboutPage();
  }

  console.log("✅ Pages.js ready!");
});
