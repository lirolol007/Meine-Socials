/* ===== LOAD SITE DATA FROM GITHUB ===== */
async function loadSiteData() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/Lirolol007/Meine-Socials/main/site-data.json?t=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("✅ site-data.json geladen:", data);
    return data;
  } catch (e) {
    console.warn("⚠️ GitHub nicht erreichbar, nutze Fallback:", e.message);
    return null;
  }
}

/* ===== HOME PAGE ===== */
async function initHomePage() {
  const data = await loadSiteData();
  if (!data) return;

  // Profil
  const el = (id) => document.getElementById(id);

  if (el("profile-name")) el("profile-name").textContent = data.name || "Liro";
  if (el("profile-badge")) el("profile-badge").textContent = data.badge || "";
  if (el("profile-catchphrase")) el("profile-catchphrase").textContent = data.catchphrase || "";
  if (el("profile-bio")) el("profile-bio").textContent = data.bio || "";

  if (el("profile-tags") && data.tags) {
    el("profile-tags").innerHTML = data.tags.map(t => `<span class="tag">${t}</span>`).join("");
  }

  // Link Labels & Hints
  if (data.links) {
    Object.entries(data.links).forEach(([key, link]) => {
      const labelEl = el(`link-label-${key}`);
      const hintEl = el(`link-hint-${key}`);
      if (labelEl) labelEl.textContent = link.label || "";
      if (hintEl) hintEl.textContent = link.hint || "";
    });
  }

  // Modal: Über mich
  if (el("modal-about-content")) {
    el("modal-about-content").innerHTML = data.bio1 && data.bio2
      ? `<p>${data.bio1}</p><p style="margin-top:1rem;">${data.bio2}</p>`
      : "<p>Keine Inhalte</p>";
  }

  // Modal: Kollegen
  if (el("collab-list") && data.collabs?.length > 0) {
    el("collab-list").innerHTML = data.collabs.map(c => `
      <li style="text-align:center;list-style:none;padding:1rem;">
        <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;align-items:center;gap:0.75rem;">
          <img src="profile.jpg" alt="${c.name}" style="width:80px;height:80px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);object-fit:cover;">
          <span style="color:var(--accent);font-weight:600;">${c.name} ↗</span>
        </a>
      </li>
    `).join("");
  }
}

/* ===== ABOUT PAGE ===== */
async function initAboutPage() {
  const data = await loadSiteData();
  const pageContent = document.getElementById("page-content");
  if (!pageContent) return;

  if (!data) {
    pageContent.innerHTML = `<h2 style="color:var(--text);">Über mich</h2><p style="color:var(--text-muted);">VRChat Creator, Streamer & Chaos-Agent</p>`;
    return;
  }

  const about = data.pages?.about || {};
  pageContent.innerHTML = `
    <h2 style="font-size:2rem;margin-bottom:0.5rem;color:var(--text);">${about.title || "Über mich"}</h2>
    <p style="color:var(--text-muted);margin-bottom:2rem;">${about.subtitle || ""}</p>
    <div style="color:var(--text-muted);line-height:1.8;">${about.content || ""}</div>
    <div style="margin-top:3rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.5rem;">
      ${[
        ["👤", "Name", data.factName],
        ["🎂", "Alter", data.factAge],
        ["📏", "Größe", data.factHeight],
        ["🌍", "Herkunft", data.factOrigin]
      ].map(([icon, label, value]) => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;">
          <span style="font-size:2rem;display:block;margin-bottom:0.5rem;">${icon}</span>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.5rem;">${label}</p>
          <p style="font-weight:600;color:var(--text);">${value || "-"}</p>
        </div>
      `).join("")}
    </div>
  `;
}

/* ===== GALLERY PAGE ===== */
async function initGalleryPage() {
  const data = await loadSiteData();
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  const items = data?.pages?.gallery?.items || [];
  if (items.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Noch keine Bilder hinzugefügt.</p>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div style="cursor:pointer;" onclick="openLightbox('${item.image.replace(/'/g,"\\'")}','${item.title.replace(/'/g,"\\'")}')">
      <img src="${item.image}" alt="${item.title}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;transition:transform 0.3s;">
      <p style="margin-top:0.75rem;font-weight:600;color:var(--text);">${item.title}</p>
      <p style="color:var(--text-muted);font-size:0.9rem;">${item.description}</p>
    </div>
  `).join("");
}

/* ===== BLOG PAGE ===== */
async function initBlogPage() {
  const data = await loadSiteData();
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  const posts = [...(data?.blogPosts || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (posts.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Noch keine Blog-Posts vorhanden.</p>';
    return;
  }

  grid.innerHTML = posts.map(post => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;cursor:pointer;" onclick="openBlogPost(${post.id})">
      <div style="display:flex;gap:1rem;">
        ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : ""}
        <div>
          <h3 style="margin:0 0 0.5rem;color:var(--text);">${post.title}</h3>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:0.5rem;">📅 ${new Date(post.date).toLocaleDateString("de-DE")}</p>
          <p style="color:var(--text-muted);line-height:1.6;">${post.excerpt}</p>
        </div>
      </div>
    </div>
  `).join("");
}

/* ===== LIGHTBOX ===== */
function openLightbox(src, title) {
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;";
  el.onclick = (e) => { if (e.target === el) el.remove(); };
  el.innerHTML = `
    <div style="max-width:90vw;max-height:90vh;position:relative;">
      <img src="${src}" alt="${title}" style="width:100%;height:auto;border-radius:8px;">
      <button onclick="this.closest('div').parentElement.remove()" style="position:absolute;top:1rem;right:1rem;width:40px;height:40px;background:rgba(255,255,255,0.1);border:none;color:white;font-size:1.5rem;cursor:pointer;border-radius:50%;">×</button>
    </div>`;
  document.body.appendChild(el);
}

/* ===== BLOG POST MODAL ===== */
async function openBlogPost(id) {
  const data = await loadSiteData();
  const post = (data?.blogPosts || []).find(p => p.id === id);
  if (!post) return;

  const blocks = JSON.parse(post.content || "[]");
  const blocksHtml = blocks.map(b => {
    if (b.type === "text") return `<p style="line-height:1.8;color:var(--text-muted);margin-bottom:1rem;">${b.content}</p>`;
    if (b.type === "heading") return `<h3 style="font-size:1.5rem;margin:2rem 0 1rem;color:var(--accent);">${b.content}</h3>`;
    if (b.type === "image") return `<img src="${b.url}" style="width:100%;border-radius:8px;margin:1.5rem 0;">`;
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
window.addEventListener("load", async () => {
  initTheme();

  if (document.getElementById("profile-name"))    await initHomePage();
  if (document.getElementById("page-content"))    await initAboutPage();
  if (document.getElementById("gallery-grid"))    await initGalleryPage();
  if (document.getElementById("blog-grid"))       await initBlogPage();
});
