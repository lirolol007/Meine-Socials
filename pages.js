/* ===== Caching & Utilities ===== */
const CACHE_KEY = "liro_site_data_cache";
const CACHE_EXPIRY = 3600000; // 1 Stunde

function fromBase64(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    return str;
  }
}

/* ===== Load Site Data WITH CACHING ===== */
async function loadSiteData() {
  // Check localStorage first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      if (data.expiry > Date.now()) {
        console.log("📦 Daten aus Cache geladen");
        return data.content;
      }
    } catch (e) {}
  }

  try {
    console.log("🌐 Lade site-data.json von GitHub...");
    const res = await fetch(
      `https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/site-data.json?t=${Date.now()}`
    );
    
    if (!res.ok) {
      throw new Error(`GitHub Error ${res.status}`);
    }

    const data = await res.json();
    
    // Cache it
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      content: data,
      expiry: Date.now() + CACHE_EXPIRY
    }));

    console.log("✅ site-data.json geladen & gecacht");
    return data;
  } catch (e) {
    console.warn("⚠️ Fehler beim Laden von site-data.json:", e.message);
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
    bio1: "Moin — ich bin Liro und mache vor allem VRChat-Content",
    bio2: "Ich freue mich über neue Bekanntschaften!",
    pages: {
      about: {
        title: "Über mich",
        subtitle: "VRChat Creator, Streamer & Chaos-Agent",
        content: "<p>Moin!</p>"
      }
    },
    blogPosts: [],
    galleryTitles: {},
    collabs: []
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

/* ===== HOME PAGE - Load Modals ===== */
async function loadHomeModals() {
  const data = await loadSiteData();
  
  // Modal: Über mich
  const aboutContent = document.getElementById("modal-about-content");
  if (aboutContent) {
    const aboutText = data.bio1 && data.bio2 
      ? `<p>${data.bio1}</p><p>${data.bio2}</p>`
      : data.pages?.about?.content || "<p>Keine Inhalte</p>";
    aboutContent.innerHTML = aboutText;
  }

  // Modal: Kollegen
  const collabList = document.getElementById("collab-list");
  if (collabList && data.collabs?.length > 0) {
    collabList.innerHTML = data.collabs.map(c => {
      // Extrahiere TikTok Username aus URL
      const tiktokMatch = c.url?.match(/@([a-zA-Z0-9._-]+)/);
      const tiktokUsername = tiktokMatch ? tiktokMatch[1] : null;
      // TikTok Avatar URL (fallback auf profile.jpg)
      const avatarUrl = tiktokUsername 
        ? `https://p16-sign.tiktokcdn.com/avatar-web/${tiktokUsername}?x-expires=9999999999`
        : 'profile.jpg';
      
      return `
        <li style="text-align: center; list-style: none; padding: 1rem;">
          <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; transition: transform 0.3s; hover: transform 1.05;">
            <img src="${avatarUrl}" alt="${c.name}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); object-fit: cover; transition: transform 0.3s;" onerror="this.src='profile.jpg'">
            <span style="color: var(--accent); font-weight: 600;">
              ${c.name} ↗
            </span>
          </a>
        </li>
      `;
    }).join("");
    collabList.style.display = "grid";
    collabList.style.gridTemplateColumns = "repeat(auto-fit, minmax(120px, 1fr))";
    collabList.style.gap = "1rem";
    collabList.style.listStyle = "none";
    collabList.style.padding = "1rem 0";
  }
}

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

  let content = about.content || "";
  if (!content && data.bio1) {
    content = `<p>${data.bio1}</p>`;
    if (data.bio2) content += `<p>${data.bio2}</p>`;
  }
  
  contentEl.innerHTML = content || "<p>Keine Inhalte verfügbar</p>";

  // Facts
  if (document.getElementById("fact-name")) document.getElementById("fact-name").textContent = data.factName || "—";
  if (document.getElementById("fact-age")) document.getElementById("fact-age").textContent = data.factAge || "—";
  if (document.getElementById("fact-height")) document.getElementById("fact-height").textContent = data.factHeight || "—";
  if (document.getElementById("fact-origin")) document.getElementById("fact-origin").textContent = data.factOrigin || "—";

  console.log("✅ About-Seite geladen");
}

/* ===== GALLERY PAGE ===== */
async function initGalleryPage() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  console.log("🖼️ Laden Galerie...");

  try {
    const data = await loadSiteData();
    const captions = data.galleryTitles || {};

    // Hardcoded gallery images - direct URLs
    const galleryImages = [
      "gallery1.png",
      "gallery2.png",
      "gallery3.png",
      "gallery4.png",
      "gallery5.png",
      "gallery6.png",
      "gallery7.png",
      "gallery8.png",
      "gallery9.png",
      "gallery10.png",
      "gallery11.png",
      "gallery12.png"
    ];

    const imageHtml = galleryImages.map((filename, idx) => {
      const cap = captions[filename] || {};
      const rawUrl = `https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/${filename}`;
      return `
        <div class="gallery-item" data-index="${idx}" data-url="${rawUrl}" data-title="${(cap.title || filename).replace(/"/g, "&quot;")}" data-text="${(cap.text || '').replace(/"/g, "&quot;")}">
          <img src="${rawUrl}" alt="${filename}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">
          ${cap.title ? `<div class="gallery-item__caption"><span class="gallery-item__title">${cap.title}</span></div>` : ""}
        </div>
      `;
    }).join("");

    grid.innerHTML = imageHtml;
    console.log("✅ Galerie geladen - 12 Bilder");
  } catch (e) {
    console.error("❌ Galerie-Fehler:", e);
    grid.innerHTML = `<p style="grid-column: 1/-1; color: #ff6b6b; text-align: center;">❌ Fehler beim Laden der Galerie</p>`;
  }
}

/* ===== Gallery Lightbox ===== */
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
  if (lightbox) lightbox.setAttribute("hidden", "");
  document.body.style.overflow = "auto";
}

document.getElementById("lightbox-close")?.addEventListener("click", closeGalleryLightbox);
document.getElementById("lightbox")?.addEventListener("click", (e) => {
  if (e.target.id === "lightbox" || e.target.classList.contains("modal__backdrop")) {
    closeGalleryLightbox();
  }
});

// Gallery item click handler
document.addEventListener("click", (e) => {
  const galleryItem = e.target.closest(".gallery-item");
  if (galleryItem) {
    const url = galleryItem.dataset.url;
    const title = galleryItem.dataset.title;
    const text = galleryItem.dataset.text;
    openGalleryLightbox(url, title, text);
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
    grid.innerHTML = '<div class="blog-empty" style="grid-column: 1/-1;"><p>Noch keine Blog-Posts vorhanden.</p></div>';
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

  const modal = document.getElementById("blog-modal");
  if (!modal) return;

  document.getElementById("blog-post-title").textContent = post.title;
  
  const dateStr = new Date(post.date).toLocaleDateString('de-DE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  document.getElementById("blog-post-meta").innerHTML = `<span>📅 ${dateStr}</span>`;

  const bodyHtml = renderBlogBlocks(post.content);
  document.getElementById("blog-post-body").innerHTML = bodyHtml;
  
  modal.classList.add("is-open");
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
  console.log("🚀 pages.js init...");
  initTheme();
  
  // Home page modals
  if (document.getElementById("modal-about-content")) {
    console.log("→ Home-Seite erkannt");
    await loadHomeModals();
  }
  
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

  console.log("✅ pages.js ready!");
});
