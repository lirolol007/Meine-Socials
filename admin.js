// ===== CONFIG =====
const GITHUB_REPO = "Lirolol007/Meine-Socials";
const GITHUB_BRANCH = "main";
const PASSWORD = "admin123"; // ⚠️ ÄNDERN!

let authToken = "";

// ===== AUTH =====
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = document.getElementById("password").value;
  const token = document.getElementById("token").value;
  if (pass === PASSWORD && token.startsWith("ghp_")) {
    authToken = token;
    if (document.getElementById("rememberMe").checked) {
      localStorage.setItem("admin_token", token);
    }
    showAdmin();
  } else {
    alert("❌ Falsches Passwort oder ungültiger Token!");
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("admin_token");
  location.reload();
});

function showAdmin() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  loadAllData();
  initTabs();
  initAllButtons();
}

// ===== GITHUB: HTML laden =====
async function ghLoad(filename) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}?ref=${GITHUB_BRANCH}`,
    { headers: { Authorization: `token ${authToken}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`Laden von ${filename} fehlgeschlagen: ${res.status}`);
  const data = await res.json();
  return {
    content: decodeURIComponent(escape(atob(data.content.replace(/\n/g, "")))),
    sha: data.sha
  };
}

// ===== GITHUB: HTML pushen =====
async function ghPush(filename, content, sha) {
  const encoded = btoa(unescape(encodeURIComponent(content)));
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `✏️ Update ${filename} via Admin Panel`,
        content: encoded,
        sha,
        branch: GITHUB_BRANCH
      })
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Push fehlgeschlagen: ${err.message}`);
  }
  const data = await res.json();
  // Neue SHA direkt speichern damit nächster Push klappt!
  const key = filename.replace(".html", "");
  if (cachedFiles[key]) {
    cachedFiles[key].sha = data.content.sha;
    cachedFiles[key].content = content;
  }
  return data;
}

// ===== MARKER: Wert lesen =====
function readMarker(html, key) {
  const regex = new RegExp(`<!--LIRO:${key}-->([\\s\\S]*?)<!--\\/LIRO:${key}-->`, "m");
  const match = html.match(regex);
  return match ? match[1] : "";
}

// ===== MARKER: Wert ersetzen =====
function writeMarker(html, key, value) {
  const regex = new RegExp(`<!--LIRO:${key}-->[\\s\\S]*?<!--\\/LIRO:${key}-->`, "gm");
  return html.replace(regex, `<!--LIRO:${key}-->${value}<!--/LIRO:${key}-->`);
}

// ===== DATEN LADEN =====
let cachedFiles = {};

async function loadAllData() {
  showStatus("main-status", "⏳ Lade Daten von GitHub...", "loading");
  try {
    cachedFiles.index = await ghLoad("index.html");
    cachedFiles.about = await ghLoad("about.html");
    cachedFiles.gallery = await ghLoad("gallery.html");
    cachedFiles.blog = await ghLoad("blog.html");

    const html = cachedFiles.index.content;

    // Felder füllen
    setVal("ed-name", readMarker(html, "name"));
    setVal("ed-badge", readMarker(html, "badge"));
    setVal("ed-catchphrase", readMarker(html, "catchphrase"));
    setVal("ed-bio", readMarker(html, "bio"));

    // Tags: HTML Tags → kommagetrennte Namen
    const tagsHtml = readMarker(html, "tags");
    const tagNames = [...tagsHtml.matchAll(/class="tag">([^<]+)<\/span>/g)].map(m => m[1]);
    setVal("ed-tags", tagNames.join(", "));

    // Bio Modal
    setVal("ed-bio1", readMarker(html, "bio-modal"));

    // Link Labels & Hints
    ["tiktok","discord","twitch","youtube","telegram","vrchat","kofi"].forEach(key => {
      setVal(`ed-link-${key}-label`, readMarker(html, `link-${key}-label`));
      setVal(`ed-link-${key}-hint`, readMarker(html, `link-${key}-hint`));
    });

    // About
    const aboutHtml = cachedFiles.about.content;
    setVal("ed-about-title", readMarker(aboutHtml, "about-title"));
    setVal("ed-about-subtitle", readMarker(aboutHtml, "about-subtitle"));
    setVal("ed-about-content", readMarker(aboutHtml, "about-content"));
    setVal("ed-fact-name", readMarker(aboutHtml, "fact-name"));
    setVal("ed-fact-age", readMarker(aboutHtml, "fact-age"));
    setVal("ed-fact-height", readMarker(aboutHtml, "fact-height"));
    setVal("ed-fact-origin", readMarker(aboutHtml, "fact-origin"));

    // Kollegen parsen
    parseCollabs(readMarker(html, "collabs"));

    // Gallery parsen
    parseGallery(readMarker(cachedFiles.gallery.content, "gallery-items"));

    // Blog parsen
    parseBlogPosts(readMarker(cachedFiles.blog.content, "blog-posts"));

    showStatus("main-status", "✅ Alle Daten geladen!", "success");
  } catch (e) {
    showStatus("main-status", `❌ Fehler: ${e.message}`, "error");
    console.error(e);
  }
}

// ===== KOLLEGEN PARSEN =====
function collabHTML(name, url, tiktokUser) {
  return `<li><a href="${url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;"><img src="https://unavatar.io/tiktok/${tiktokUser}" alt="${name}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;" onerror="this.src='profile.jpg'"><span style="color:var(--accent);font-weight:600;font-size:0.9rem;">${name} ↗</span></a></li>`;
}

function parseCollabs(html) {
  const container = document.getElementById("collabs-container");
  container.innerHTML = "";
  const matches = [...html.matchAll(/href="([^"]+)"[^>]*>[\s\S]*?alt="([^"]+)"[\s\S]*?unavatar\.io\/tiktok\/([^"]+)"/g)];
  matches.forEach((m, idx) => {
    addCollabRow(m[2], m[1], m[3]);
  });
}

function addCollabRow(name = "", url = "", tiktok = "") {
  const container = document.getElementById("collabs-container");
  const idx = Date.now() + Math.random();
  const div = document.createElement("div");
  div.className = "form-section";
  div.dataset.collab = idx;
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
      <h4 style="margin:0;color:var(--accent);">Kolleg*in</h4>
      <button type="button" class="btn btn-small btn-secondary" onclick="this.closest('[data-collab]').remove()">🗑️</button>
    </div>
    <div class="form-grid">
      <div class="form-group"><label>Name</label><input type="text" class="collab-name" value="${name}" placeholder="z.B. Ryio"></div>
      <div class="form-group"><label>TikTok Username</label><input type="text" class="collab-tiktok" value="${tiktok}" placeholder="z.B. fluffy_ryio"></div>
      <div class="form-group form-full"><label>TikTok URL</label><input type="text" class="collab-url" value="${url}" placeholder="https://www.tiktok.com/@..."></div>
    </div>`;
  container.appendChild(div);
}

function buildCollabsHTML() {
  let html = "";
  document.querySelectorAll("[data-collab]").forEach(div => {
    const name = div.querySelector(".collab-name").value;
    const url = div.querySelector(".collab-url").value;
    const tiktok = div.querySelector(".collab-tiktok").value;
    if (name && url) html += collabHTML(name, url, tiktok);
  });
  return html;
}

// ===== GALLERY PARSEN =====
function galleryItemHTML(image, title, desc) {
  const safeImg = image.replace(/'/g, "\\'");
  const safeTitle = title.replace(/'/g, "\\'");
  return `<div style="cursor:pointer;" onclick="openLightbox('${safeImg}','${safeTitle}')"><img src="${image}" alt="${title}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;" onerror="this.closest('div').style.display='none'"><p style="margin-top:0.75rem;font-weight:600;color:var(--text);">${title}</p><p style="color:var(--text-muted);font-size:0.9rem;">${desc}</p></div>`;
}

function parseGallery(html) {
  const container = document.getElementById("gallery-container");
  container.innerHTML = "";
  const matches = [...html.matchAll(/src='([^']+)'[^>]*onclick[^>]*openLightbox\('[^']*','([^']*)'\)[\s\S]*?color:var\(--text\);">([^<]*)<\/p><p[^>]*>([^<]*)<\/p><\/div>/g)];
  if (matches.length === 0) {
    // Fallback: einfach leere Items anzeigen
    addGalleryRow("", "", "");
  } else {
    matches.forEach(m => addGalleryRow(m[1], m[2], m[4]));
  }
}

function addGalleryRow(image = "", title = "", desc = "") {
  const container = document.getElementById("gallery-container");
  const idx = Date.now() + Math.random();
  const div = document.createElement("div");
  div.className = "form-section";
  div.dataset.gallery = idx;
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
      <h4 style="margin:0;color:var(--accent);">Bild</h4>
      <button type="button" class="btn btn-small btn-secondary" onclick="this.closest('[data-gallery]').remove()">🗑️</button>
    </div>
    <div class="form-grid">
      <div class="form-group form-full"><label>Bild-URL oder Dateiname</label><input type="text" class="gal-image" value="${image}" placeholder="z.B. gallery1.png oder https://..."></div>
      <div class="form-group"><label>Titel</label><input type="text" class="gal-title" value="${title}" placeholder="Titel..."></div>
      <div class="form-group"><label>Beschreibung</label><input type="text" class="gal-desc" value="${desc}" placeholder="Beschreibung..."></div>
    </div>`;
  container.appendChild(div);
}

function buildGalleryHTML() {
  let html = "";
  document.querySelectorAll("[data-gallery]").forEach(div => {
    const image = div.querySelector(".gal-image").value;
    const title = div.querySelector(".gal-title").value;
    const desc = div.querySelector(".gal-desc").value;
    if (image) html += galleryItemHTML(image, title, desc);
  });
  return html;
}

// ===== BLOG PARSEN =====
let blogPosts = [];

function parseBlogPosts(html) {
  blogPosts = [];
  const matches = [...html.matchAll(/data-postid="([^"]+)"[\s\S]*?<strong>([^<]+)<\/strong>[\s\S]*?<em>([^<]+)<\/em>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g)];
  matches.forEach(m => {
    blogPosts.push({ id: m[1], title: m[2], date: m[3], excerpt: m[4] });
  });
  renderBlogList();
}

function renderBlogList() {
  const list = document.getElementById("blog-list");
  if (blogPosts.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Noch keine Posts</p>';
    return;
  }
  list.innerHTML = blogPosts.map(post => `
    <div class="blog-card">
      <h4>${post.title}</h4>
      <p style="color:var(--text-muted);font-size:0.85rem;">📅 ${post.date}</p>
      <p style="color:var(--text-muted);font-size:0.85rem;">${post.excerpt}</p>
      <button class="btn btn-small btn-secondary" onclick="deleteBlogPost('${post.id}')">🗑️ Löschen</button>
    </div>`).join("");
}

function deleteBlogPost(id) {
  if (!confirm("Post löschen?")) return;
  blogPosts = blogPosts.filter(p => p.id !== id);
  renderBlogList();
}

function buildBlogHTML() {
  if (blogPosts.length === 0) {
    return '<p style="text-align:center;color:var(--text-muted);">Noch keine Blog-Posts vorhanden.</p>';
  }
  return blogPosts.map(post => `
    <div data-postid="${post.id}" style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;cursor:pointer;" onclick="openBlogModal('${post.id}')">
      ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-bottom:1rem;">` : ""}
      <strong>${post.title}</strong>
      <em style="display:block;color:var(--text-muted);font-size:0.85rem;margin:0.25rem 0;">📅 ${post.date}</em>
      <p style="color:var(--text-muted);line-height:1.6;margin-top:0.5rem;">${post.excerpt}</p>
      <div data-blocks='${JSON.stringify(post.blocks || []).replace(/'/g, "&#39;")}'></div>
    </div>`).join("");
}

// ===== BLOG BLOCKS =====
let blogBlocks = [];

function addBlock(type) {
  const container = document.getElementById("blog-blocks-container");
  const id = Date.now();
  const div = document.createElement("div");
  div.className = "blog-block";
  div.dataset.blockId = id;
  div.dataset.type = type;

  if (type === "text") {
    div.innerHTML = `<div class="blog-block__header"><span class="blog-block__type">📝 Text</span><button type="button" class="blog-block__remove" onclick="this.closest('.blog-block').remove()">×</button></div><textarea placeholder="Text eingeben..."></textarea>`;
  } else if (type === "heading") {
    div.innerHTML = `<div class="blog-block__header"><span class="blog-block__type">📌 Überschrift</span><button type="button" class="blog-block__remove" onclick="this.closest('.blog-block').remove()">×</button></div><input type="text" placeholder="Überschrift...">`;
  } else if (type === "image") {
    div.innerHTML = `<div class="blog-block__header"><span class="blog-block__type">🖼️ Bild</span><button type="button" class="blog-block__remove" onclick="this.closest('.blog-block').remove()">×</button></div><input type="text" class="block-img-url" placeholder="Bild-URL oder Dateiname..."><input type="text" class="block-img-caption" placeholder="Bildunterschrift (optional)..." style="margin-top:0.5rem;">`;
  }
  container.appendChild(div);
}

function collectBlocks() {
  const blocks = [];
  document.querySelectorAll(".blog-block").forEach(div => {
    const type = div.dataset.type;
    if (type === "text") {
      const val = div.querySelector("textarea").value;
      if (val) blocks.push({ type, content: val });
    } else if (type === "heading") {
      const val = div.querySelector("input").value;
      if (val) blocks.push({ type, content: val });
    } else if (type === "image") {
      const url = div.querySelector(".block-img-url").value;
      const caption = div.querySelector(".block-img-caption").value;
      if (url) blocks.push({ type, url, caption });
    }
  });
  return blocks;
}

function renderBlocksHTML(blocks) {
  return blocks.map(b => {
    if (b.type === "text") return `<p style="color:var(--text-muted);line-height:1.8;margin-bottom:1rem;">${b.content}</p>`;
    if (b.type === "heading") return `<h3 style="font-size:1.4rem;color:var(--accent);margin:1.5rem 0 0.75rem;">${b.content}</h3>`;
    if (b.type === "image") return `<figure style="margin:1.5rem 0;"><img src="${b.url}" style="width:100%;border-radius:8px;">${b.caption ? `<figcaption style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem;">${b.caption}</figcaption>` : ""}</figure>`;
    return "";
  }).join("");
}

// ===== SAVE FUNKTIONEN =====
async function saveFile(filename, newContent, sha, statusId) {
  showStatus(statusId, "⏳ Wird gespeichert...", "loading");
  try {
    await ghPush(filename, newContent, sha);
    showStatus(statusId, "✅ Gespeichert! GitHub aktualisiert.", "success");
    return true;
  } catch (e) {
    showStatus(statusId, `❌ Fehler: ${e.message}`, "error");
    console.error(e);
    return false;
  }
}

// ===== ALLE BUTTONS INITIALISIEREN =====
function initAllButtons() {

  // ── HAUPTSEITE ──
  document.getElementById("save-main-btn")?.addEventListener("click", async () => {
    showStatus("main-status", "⏳ Speichere...", "loading");
    try {
      // index.html updaten
      let html = cachedFiles.index.content;
      html = writeMarker(html, "name", getVal("ed-name"));
      html = writeMarker(html, "badge", getVal("ed-badge"));
      html = writeMarker(html, "catchphrase", getVal("ed-catchphrase"));
      html = writeMarker(html, "bio", getVal("ed-bio"));
      const tags = getVal("ed-tags").split(",").map(t => t.trim()).filter(Boolean)
        .map(t => `<span class="tag">${t}</span>`).join("");
      html = writeMarker(html, "tags", tags);
      html = writeMarker(html, "bio-modal", getVal("ed-bio1"));
      await ghPush("index.html", html, cachedFiles.index.sha);

      // about.html Bio Modal updaten
      let aHtml = writeMarker(cachedFiles.about.content, "bio-modal", getVal("ed-bio1"));
      await ghPush("about.html", aHtml, cachedFiles.about.sha);

      // gallery.html Bio Modal updaten
      let gHtml = writeMarker(cachedFiles.gallery.content, "bio-modal", getVal("ed-bio1"));
      await ghPush("gallery.html", gHtml, cachedFiles.gallery.sha);

      // blog.html Bio Modal updaten
      let bHtml = writeMarker(cachedFiles.blog.content, "bio-modal", getVal("ed-bio1"));
      await ghPush("blog.html", bHtml, cachedFiles.blog.sha);

      showStatus("main-status", "✅ Alles gespeichert!", "success");
    } catch(e) {
      showStatus("main-status", `❌ Fehler: ${e.message}`, "error");
    }
  });

  // ── LINKS ──
  document.getElementById("save-links-btn")?.addEventListener("click", async () => {
    let html = cachedFiles.index.content;
    ["tiktok","discord","twitch","youtube","telegram","vrchat","kofi"].forEach(key => {
      html = writeMarker(html, `link-${key}-label`, getVal(`ed-link-${key}-label`));
      html = writeMarker(html, `link-${key}-hint`, getVal(`ed-link-${key}-hint`));
    });
    await saveFile("index.html", html, cachedFiles.index.sha, "links-status");
    cachedFiles.index.content = html;
  });

  // ── KOLLEGEN ──
  document.getElementById("add-collab-btn")?.addEventListener("click", () => addCollabRow());

  document.getElementById("save-collabs-btn")?.addEventListener("click", async () => {
    showStatus("collabs-status", "⏳ Speichere Kollegen auf allen Seiten...", "loading");
    try {
      const collabsHTML = buildCollabsHTML();
      await ghPush("index.html", writeMarker(cachedFiles.index.content, "collabs", collabsHTML), cachedFiles.index.sha);
      await ghPush("about.html", writeMarker(cachedFiles.about.content, "collabs", collabsHTML), cachedFiles.about.sha);
      await ghPush("gallery.html", writeMarker(cachedFiles.gallery.content, "collabs", collabsHTML), cachedFiles.gallery.sha);
      await ghPush("blog.html", writeMarker(cachedFiles.blog.content, "collabs", collabsHTML), cachedFiles.blog.sha);
      showStatus("collabs-status", "✅ Kollegen auf allen Seiten gespeichert!", "success");
    } catch(e) {
      showStatus("collabs-status", `❌ Fehler: ${e.message}`, "error");
    }
  });

  // ── ABOUT ──
  document.getElementById("save-about-btn")?.addEventListener("click", async () => {
    let html = cachedFiles.about.content;
    html = writeMarker(html, "about-title", getVal("ed-about-title"));
    html = writeMarker(html, "about-subtitle", getVal("ed-about-subtitle"));
    html = writeMarker(html, "about-content", getVal("ed-about-content"));
    html = writeMarker(html, "fact-name", getVal("ed-fact-name"));
    html = writeMarker(html, "fact-age", getVal("ed-fact-age"));
    html = writeMarker(html, "fact-height", getVal("ed-fact-height"));
    html = writeMarker(html, "fact-origin", getVal("ed-fact-origin"));
    await saveFile("about.html", html, cachedFiles.about.sha, "about-status");
    cachedFiles.about.content = html;
  });

  // ── GALLERY ──
  document.getElementById("add-gallery-btn")?.addEventListener("click", () => addGalleryRow());

  document.getElementById("save-gallery-btn")?.addEventListener("click", async () => {
    const galleryHTML = buildGalleryHTML();
    let html = writeMarker(cachedFiles.gallery.content, "gallery-items", galleryHTML);
    await saveFile("gallery.html", html, cachedFiles.gallery.sha, "gallery-status");
    cachedFiles.gallery.content = html;
  });

  // ── BLOG: BLOCKS ──
  document.getElementById("add-text-btn")?.addEventListener("click", () => addBlock("text"));
  document.getElementById("add-heading-btn")?.addEventListener("click", () => addBlock("heading"));
  document.getElementById("add-image-btn")?.addEventListener("click", () => addBlock("image"));

  // ── BLOG: POST ERSTELLEN ──
  document.getElementById("create-post-btn")?.addEventListener("click", async () => {
    const title = getVal("new-post-title");
    const date = getVal("new-post-date");
    const excerpt = getVal("new-post-excerpt");
    const image = getVal("new-post-image");

    if (!title || !date || !excerpt) {
      showStatus("blog-status", "❌ Titel, Datum und Excerpt sind Pflicht!", "error");
      return;
    }

    const blocks = collectBlocks();
    const id = Date.now().toString();

    blogPosts.unshift({ id, title, date, excerpt, image, blocks });
    renderBlogList();

    const blogHTML = buildBlogHTML();
    let html = writeMarker(cachedFiles.blog.content, "blog-posts", blogHTML);
    const ok = await saveFile("blog.html", html, cachedFiles.blog.sha, "blog-status");
    if (ok) {
      cachedFiles.blog.content = html;
      setVal("new-post-title", "");
      setVal("new-post-date", "");
      setVal("new-post-excerpt", "");
      setVal("new-post-image", "");
      document.getElementById("blog-blocks-container").innerHTML = "";
    }
  });

  // ── BLOG: POSTS SPEICHERN (nach Löschen) ──
  document.getElementById("save-blog-btn")?.addEventListener("click", async () => {
    const blogHTML = buildBlogHTML();
    let html = writeMarker(cachedFiles.blog.content, "blog-posts", blogHTML);
    const ok = await saveFile("blog.html", html, cachedFiles.blog.sha, "blog-status");
    if (ok) cachedFiles.blog.content = html;
  });
}

// ── BLOG: POST ÖFFNEN (auf der Seite) ──
window.openBlogModal = function(id) {
  const post = blogPosts.find(p => p.id === id);
  if (!post) return;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("aria-modal","true");
  modal.style.cssText = "display:flex!important;";
  modal.innerHTML = `
    <div class="modal__backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal__panel">
      <button class="modal__close" onclick="this.closest('.modal').remove()">×</button>
      <h2 class="modal__title">${post.title}</h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;">📅 ${post.date}</p>
      ${renderBlocksHTML(post.blocks || [])}
    </div>`;
  document.body.appendChild(modal);
};

// ===== TABS =====
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`${btn.dataset.tab}-tab`)?.classList.add("active");
    });
  });
}

// ===== HELPER =====
function getVal(id) { return document.getElementById(id)?.value || ""; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `status show ${type}`;
  if (type !== "loading") setTimeout(() => el.classList.remove("show"), 6000);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("admin_token");
  if (stored) {
    authToken = stored;
    showAdmin();
  } else {
    document.getElementById("loginScreen").classList.remove("hidden");
  }
});
