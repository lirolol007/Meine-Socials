/* ===== LOAD SITE DATA FROM GITHUB ===== */
async function loadSiteData() {
  try {
    console.log("🌐 Lade site-data.json von GitHub (frisch)...");
    const res = await fetch(
      `https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/site-data.json?t=${Date.now()}`,
      { cache: "no-store" }
    );
    
    if (!res.ok) {
      throw new Error(`GitHub Error ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ site-data.json geladen:", data);
    console.log("📝 Catchphrase im JSON:", data.catchphrase);
    return data;
  } catch (e) {
    console.error("❌ Fehler beim Laden von site-data.json:", e.message);
    return null;
  }
}

/* ===== HOME PAGE - Load Modals & Profile ===== */
async function loadHomeModals() {
  console.log("🏠 Lade Home Page Daten...");
  const data = await loadSiteData();
  
  if (!data) {
    console.error("❌ Keine Daten geladen!");
    return;
  }
  
  // 1. Profil Catchphrase
  console.log("🔄 Setze Catchphrase: " + data.catchphrase);
  const catchEl = document.getElementById("profile-catchphrase");
  if (catchEl) {
    catchEl.textContent = data.catchphrase || "";
    console.log("✅ Catchphrase gesetzt!");
  } else {
    console.warn("⚠️ Element #profile-catchphrase nicht gefunden!");
  }
  
  // 2. Modal: Über mich
  const aboutContent = document.getElementById("modal-about-content");
  if (aboutContent) {
    const aboutText = data.bio1 && data.bio2 
      ? `<p>${data.bio1}</p><p>${data.bio2}</p>`
      : data.pages?.about?.content || "<p>Keine Inhalte</p>";
    aboutContent.innerHTML = aboutText;
    console.log("✅ Über mich Modal gefüllt!");
  }

  // 3. Modal: Kollegen
  const collabList = document.getElementById("collab-list");
  if (collabList && data.collabs?.length > 0) {
    collabList.innerHTML = data.collabs.map(c => `
      <li style="text-align: center; list-style: none; padding: 1rem;">
        <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; transition: transform 0.3s;">
          <img src="profile.jpg" alt="${c.name}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); object-fit: cover; transition: transform 0.3s;">
          <span style="color: var(--accent); font-weight: 600;">
            ${c.name} ↗
          </span>
        </a>
      </li>
    `).join("");
    console.log("✅ Kollegen Modal gefüllt!");
  }
}

/* ===== ABOUT PAGE ===== */
async function initAboutPage() {
  console.log("ℹ️ Lade About Page...");
  const data = await loadSiteData();
  
  if (!data?.pages?.about) {
    console.warn("⚠️ About-Daten nicht gefunden");
    return;
  }

  const about = data.pages.about;
  const pageContent = document.getElementById("page-content");
  
  if (pageContent) {
    const html = `
      <h2 class="page-title">${about.title || "Über mich"}</h2>
      <p class="page-subtitle">${about.subtitle || ""}</p>
      ${about.content || ""}
      
      <div class="facts-grid" style="margin-top: 3rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem;">
        <div class="fact-card" style="background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; text-align: center;">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">👤</span>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">Name</p>
          <p style="font-weight: 600; color: var(--text);">${data.factName || "-"}</p>
        </div>
        <div class="fact-card" style="background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; text-align: center;">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🎂</span>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">Alter</p>
          <p style="font-weight: 600; color: var(--text);">${data.factAge || "-"}</p>
        </div>
        <div class="fact-card" style="background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; text-align: center;">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📏</span>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">Größe</p>
          <p style="font-weight: 600; color: var(--text);">${data.factHeight || "-"}</p>
        </div>
        <div class="fact-card" style="background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; text-align: center;">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🌍</span>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">Herkunft</p>
          <p style="font-weight: 600; color: var(--text);">${data.factOrigin || "-"}</p>
        </div>
      </div>
    `;
    pageContent.innerHTML = html;
    console.log("✅ About Page geladen!");
  }
}

/* ===== GALLERY PAGE ===== */
async function initGalleryPage() {
  console.log("🖼️ Lade Gallery Page...");
  const data = await loadSiteData();
  
  if (!data?.pages?.gallery?.items) {
    console.warn("⚠️ Gallery-Items nicht gefunden");
    return;
  }

  const galleryGrid = document.getElementById("gallery-grid");
  if (!galleryGrid) return;

  const items = data.pages.gallery.items;
  
  galleryGrid.innerHTML = items.map((item, idx) => {
    const imgUrl = item.image.startsWith("http") 
      ? item.image 
      : `https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/${item.image}`;
    
    return `
      <div class="gallery-item" style="cursor: pointer;" onclick="openLightbox('${imgUrl.replace(/'/g, "\\'")}', '${item.title.replace(/'/g, "\\'")}')">
        <img src="${imgUrl}" alt="${item.title}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; transition: transform 0.3s;">
        <p style="margin-top: 0.75rem; font-weight: 600; color: var(--text);">${item.title}</p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${item.description}</p>
      </div>
    `;
  }).join("");

  console.log("✅ Gallery Page geladen!");
}

/* ===== BLOG PAGE ===== */
async function initBlogPage() {
  console.log("📝 Lade Blog Page...");
  const data = await loadSiteData();
  
  if (!data?.blogPosts) {
    console.warn("⚠️ Blog-Posts nicht gefunden");
    return;
  }

  const blogGrid = document.getElementById("blog-grid");
  if (!blogGrid) return;

  const posts = [...data.blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  blogGrid.innerHTML = posts.map(post => {
    const date = new Date(post.date).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    return `
      <div class="blog-card" style="cursor: pointer;" onclick="openBlogPost(${post.id})">
        <div style="display: flex; gap: 1rem;">
          ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">` : ""}
          <div style="flex: 1;">
            <h3 style="margin: 0 0 0.5rem 0; color: var(--text);">${post.title}</h3>
            <p style="margin: 0 0 0.75rem 0; color: var(--text-muted); font-size: 0.9rem;">📅 ${date}</p>
            <p style="margin: 0; color: var(--text-muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.excerpt}</p>
          </div>
        </div>
      </div>
    `;
  }).join("");

  console.log("✅ Blog Page geladen!");
}

/* ===== LIGHTBOX ===== */
function openLightbox(src, title) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="max-width: 90vw; max-height: 90vh; position: relative;">
      <img src="${src}" alt="${title}" style="width: 100%; height: auto; border-radius: 8px;">
      <button onclick="this.closest('[style*=z-index]').remove()" style="position: absolute; top: 1rem; right: 1rem; width: 40px; height: 40px; background: rgba(255,255,255,0.1); border: none; color: white; font-size: 1.5rem; cursor: pointer; border-radius: 50%; transition: all 0.3s;">×</button>
    </div>
  `;
  document.body.appendChild(modal);
}

/* ===== BLOG POST VIEW ===== */
async function openBlogPost(id) {
  const data = await loadSiteData();
  const post = data.blogPosts.find(p => p.id === id);
  if (!post) return;
  
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("aria-modal", "true");
  modal.style.cssText = "display: flex !important;";
  
  const blocks = JSON.parse(post.content || "[]");
  const blocksHtml = blocks.map(block => {
    if (block.type === "text") return `<p style="line-height: 1.8; color: var(--text-muted);">${block.content}</p>`;
    if (block.type === "heading") return `<h3 style="font-size: 1.5rem; margin: 2rem 0 1rem; color: var(--accent);">${block.content}</h3>`;
    if (block.type === "image") return `<img src="${block.url}" alt="Blog" style="width: 100%; max-width: 100%; border-radius: 8px; margin: 1.5rem 0;">`;
    return "";
  }).join("");
  
  modal.innerHTML = `
    <div class="modal__backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal__panel">
      <button class="modal__close" onclick="this.closest('.modal').remove()">×</button>
      <h2 class="modal__title">${post.title}</h2>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">📅 ${new Date(post.date).toLocaleDateString("de-DE")}</p>
      <div style="color: var(--text-muted); line-height: 1.8;">
        ${blocksHtml}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

/* ===== INIT ===== */
window.addEventListener("load", async () => {
  console.log("🚀 pages.js init...");
  initTheme();
  
  // Home page
  if (document.getElementById("modal-about-content")) {
    console.log("→ Home-Seite erkannt");
    await loadHomeModals();
  }
  
  // About page
  if (document.getElementById("page-content")) {
    console.log("→ About-Seite erkannt");
    await initAboutPage();
  }
  
  // Gallery page
  if (document.getElementById("gallery-grid")) {
    console.log("→ Gallery-Seite erkannt");
    await initGalleryPage();
  }
  
  // Blog page
  if (document.getElementById("blog-grid")) {
    console.log("→ Blog-Seite erkannt");
    await initBlogPage();
  }
});
