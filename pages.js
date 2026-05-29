/* ===== LOAD SITE DATA FROM GITHUB (optional) ===== */
async function loadSiteData() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/site-data.json?t=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("⚠️ GitHub nicht erreichbar:", e.message);
    return null;
  }
}

/* ===== HOME PAGE — optional update from GitHub ===== */
async function initHomePage() {
  const data = await loadSiteData();
  if (!data) return; // kein Laden = hardcoded Werte bleiben

  const el = (id) => document.getElementById(id);

  if (el("profile-name"))        el("profile-name").textContent        = data.name || "Liro";
  if (el("profile-badge"))       el("profile-badge").textContent       = data.badge || "";
  if (el("profile-catchphrase")) el("profile-catchphrase").textContent = data.catchphrase || "";
  if (el("profile-bio"))         el("profile-bio").textContent         = data.bio || "";

  if (el("profile-tags") && data.tags?.length) {
    el("profile-tags").innerHTML = data.tags.map(t => `<span class="tag">${t}</span>`).join("");
  }

  if (data.links) {
    Object.entries(data.links).forEach(([key, link]) => {
      const labelEl = el(`link-label-${key}`);
      const hintEl  = el(`link-hint-${key}`);
      if (labelEl) labelEl.textContent = link.label || "";
      if (hintEl)  hintEl.textContent  = link.hint  || "";
    });
  }

  if (el("modal-about-content")) {
    el("modal-about-content").innerHTML = data.bio1 && data.bio2
      ? `<p>${data.bio1}</p><p style="margin-top:1rem;">${data.bio2}</p>`
      : el("modal-about-content").innerHTML;
  }

  if (el("collab-list") && data.collabs?.length > 0) {
    el("collab-list").innerHTML = data.collabs.map(c => `
      <li style="text-align:center;list-style:none;padding:1rem;">
        <a href="${c.url}" target="_blank" rel="noopener noreferrer"
           style="text-decoration:none;color:inherit;display:flex;flex-direction:column;align-items:center;gap:0.75rem;">
          <img src="profile.jpg" alt="${c.name}"
               style="width:80px;height:80px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);object-fit:cover;">
          <span style="color:var(--accent);font-weight:600;">${c.name} ↗</span>
        </a>
      </li>`).join("");
  }
}

/* ===== ABOUT PAGE — optional update from GitHub ===== */
async function initAboutPage() {
  const data = await loadSiteData();
  if (!data) return; // kein Laden = hardcoded Inhalt bleibt

  const el = (id) => document.getElementById(id);

  const about = data.pages?.about || {};
  const pageContent = el("page-content");
  if (pageContent && about.content) {
    pageContent.querySelector("h2").textContent = about.title || "Über mich";
    const subtitle = pageContent.querySelector("p");
    if (subtitle) subtitle.textContent = about.subtitle || "";
  }

  if (el("fact-name"))   el("fact-name").textContent   = data.factName   || "Liro / Leon";
  if (el("fact-age"))    el("fact-age").textContent    = data.factAge    || "19";
  if (el("fact-height")) el("fact-height").textContent = data.factHeight || "1,78 m";
  if (el("fact-origin")) el("fact-origin").textContent = data.factOrigin || "🇩🇪 Deutschland";
}

/* ===== GALLERY PAGE — optional extra items from GitHub ===== */
async function initGalleryPage() {
  const data = await loadSiteData();
  if (!data?.pages?.gallery?.items?.length) return;

  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  // extra Items aus GitHub hinzufügen (die hardcoded gallery1-12 bleiben)
  data.pages.gallery.items.forEach(item => {
    const div = document.createElement("div");
    div.style.cursor = "pointer";
    div.onclick = () => openLightbox(item.image, item.title);
    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}"
           style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;transition:transform 0.3s;"
           onerror="this.closest('div').style.display='none'">
      <p style="margin-top:0.75rem;font-weight:600;color:var(--text);">${item.title}</p>
      <p style="color:var(--text-muted);font-size:0.9rem;">${item.description}</p>
    `;
    grid.appendChild(div);
  });
}

/* ===== BLOG PAGE — loads from GitHub ===== */
async function initBlogPage() {
  const data = await loadSiteData();
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  const posts = [...(data?.blogPosts || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (posts.length === 0) return; // hardcoded "Noch keine Posts" bleibt

  grid.innerHTML = posts.map(post => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;cursor:pointer;"
         onclick="openBlogPost(${post.id})">
      <div style="display:flex;gap:1rem;">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : ""}
        <div>
          <h3 style="margin:0 0 0.5rem;color:var(--text);">${post.title}</h3>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.5rem;">
            📅 ${new Date(post.date).toLocaleDateString("de-DE")}
          </p>
          <p style="color:var(--text-muted);line-height:1.6;">${post.excerpt}</p>
        </div>
      </div>
    </div>`).join("");
}

/* ===== LIGHTBOX ===== */
function openLightbox(src, title, caption) {
  // Overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:1.5rem;
    backdrop-filter:blur(8px);opacity:0;transition:opacity 0.25s ease;
  `;
  overlay.onclick = (e) => { if (e.target === overlay) closeLightbox(overlay); };

  // Box
  const box = document.createElement("div");
  box.style.cssText = `
    max-width:600px;width:100%;background:rgba(20,20,20,0.95);
    border:1px solid rgba(255,255,255,0.1);border-radius:16px;
    overflow:hidden;transform:scale(0.85);transition:transform 0.25s ease;
    box-shadow:0 32px 64px rgba(0,0,0,0.6);
  `;

  box.innerHTML = `
    <div style="position:relative;">
      <img src="${src}" alt="${title||''}" style="width:100%;max-height:65vh;object-fit:contain;display:block;background:#111;">
      <button onclick="closeLightbox(this.closest('[style*=z-index]'))"
        style="position:absolute;top:0.75rem;right:0.75rem;width:36px;height:36px;
               background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);
               color:white;font-size:1.2rem;cursor:pointer;border-radius:50%;
               display:flex;align-items:center;justify-content:center;
               transition:background 0.2s;">×</button>
    </div>
    ${(title||caption) ? `
    <div style="padding:1rem 1.25rem;">
      ${title ? `<p style="font-weight:700;color:#f4f4f5;margin:0 0 0.25rem;">${title}</p>` : ""}
      ${caption ? `<p style="color:#9ca3af;font-size:0.875rem;margin:0;">${caption}</p>` : ""}
    </div>` : ""}
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    box.style.transform = "scale(1)";
  });

  // ESC key
  const onKey = (e) => { if (e.key === "Escape") { closeLightbox(overlay); document.removeEventListener("keydown", onKey); } };
  document.addEventListener("keydown", onKey);
}

function closeLightbox(el) {
  const overlay = el.closest ? el.closest("[style*=z-index]") : el;
  if (!overlay) return;
  const box = overlay.querySelector("div");
  overlay.style.opacity = "0";
  if (box) box.style.transform = "scale(0.85)";
  setTimeout(() => overlay.remove(), 250);
}

/* ===== BLOG POST MODAL ===== */
async function openBlogPost(id) {
  const data = await loadSiteData();
  const post = (data?.blogPosts || []).find(p => p.id === id);
  if (!post) return;

  const blocks = JSON.parse(post.content || "[]");
  const blocksHtml = blocks.map(b => {
    if (b.type === "text")    return `<p style="line-height:1.8;color:var(--text-muted);margin-bottom:1rem;">${b.content}</p>`;
    if (b.type === "heading") return `<h3 style="font-size:1.5rem;margin:2rem 0 1rem;color:var(--accent);">${b.content}</h3>`;
    if (b.type === "image")   return `<img src="${b.url}" style="width:100%;border-radius:8px;margin:1.5rem 0;">`;
    return "";
  }).join("");

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("aria-modal", "true");
  modal.style.cssText = "display:flex!important;";
  modal.innerHTML = `
    <div class="modal__backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal__panel">
      <button class="modal__close" onclick="this.closest('.modal').remove()">×</button>
      <h2 class="modal__title">${post.title}</h2>
      <p style="color:var(--text-muted);margin-bottom:2rem;">📅 ${new Date(post.date).toLocaleDateString("de-DE")}</p>
      ${blocksHtml}
    </div>`;
  document.body.appendChild(modal);
}

/* ===== INIT ===== */
window.addEventListener("load", () => {
  initTheme();
  if (document.getElementById("profile-name"))  initHomePage();
  if (document.getElementById("page-content"))  initAboutPage();
  if (document.getElementById("gallery-grid"))  initGalleryPage();
  if (document.getElementById("blog-grid"))     initBlogPage();
});
