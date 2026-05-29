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

  const found = [];

  // Alle openLightbox Aufrufe finden (egal ob 2 oder 3 Parameter)
  const re = /openLightbox\s*\(\s*'([^']*)'\s*,\s*'([^']*)'\s*(?:,\s*'([^']*)'\s*)?\)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    found.push({ img: m[1], title: m[2], caption: m[3] || "" });
  }

  if (found.length === 0) {
    // Fallback: gallery1-12
    for (let i = 1; i <= 12; i++) addGalleryRow(`gallery${i}.png`, `Bild ${i}`, "");
  } else {
    found.forEach(f => addGalleryRow(f.img, f.title, f.caption));
  }
}

function addGalleryRow(image = "", title = "", desc = "") {
  const container = document.getElementById("gallery-container");
  const idx = (Date.now() + Math.random()).toString().replace(".", "");
  const div = document.createElement("div");
  div.className = "form-section";
  div.dataset.gallery = idx;
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
      <h4 style="margin:0;color:var(--accent);">Bild</h4>
      <button type="button" class="btn btn-small btn-secondary" onclick="this.closest('[data-gallery]').remove()">🗑️</button>
    </div>
    <div id="drop-gal-${idx}" style="border:2px dashed var(--border);border-radius:8px;padding:1.5rem;text-align:center;cursor:pointer;margin-bottom:1rem;transition:all 0.3s;color:var(--text-muted);font-size:0.9rem;">
      📁 Bild hierher ziehen oder klicken zum Hochladen
      ${image ? `<br><img src="${image}" style="max-height:80px;margin-top:0.5rem;border-radius:4px;">` : ""}
    </div>
    <div id="gal-status-${idx}" class="status"></div>
    <div class="form-grid">
      <div class="form-group form-full"><label>Bild-URL oder Dateiname</label><input type="text" class="gal-image" value="${image}" placeholder="z.B. gallery1.png oder https://..."></div>
      <div class="form-group"><label>Titel</label><input type="text" class="gal-title" value="${title}" placeholder="Titel..."></div>
      <div class="form-group"><label>Beschriftung</label><input type="text" class="gal-desc" value="${desc}" placeholder="Kurze Beschriftung..."></div>
    </div>`;
  container.appendChild(div);

  // Drop Zone initialisieren
  setTimeout(() => {
    initDropZone(`drop-gal-${idx}`, null, `gal-status-${idx}`, (filename) => {
      div.querySelector(".gal-image").value = filename;
      const zone = document.getElementById(`drop-gal-${idx}`);
      zone.innerHTML = `✅ ${filename} hochgeladen! <br><img src="${filename}" style="max-height:80px;margin-top:0.5rem;border-radius:4px;">`;
    });
  }, 100);
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
    return '<p style="text-align:center;color:var(--text-muted);padding:3rem 0;">Noch keine Blog-Posts vorhanden.</p>';
  }
  return blogPosts.map(post => {
    const blocksJson = JSON.stringify(post.blocks || []).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    return `<article data-postid="${post.id}" data-blocks="${blocksJson}"
      style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;
             overflow:hidden;margin-bottom:2rem;cursor:pointer;transition:transform 0.25s,box-shadow 0.25s;"
      onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.3)'"
      onmouseout="this.style.transform='';this.style.boxShadow=''"
      onclick="openBlogPost(this)">
      ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width:100%;max-height:280px;object-fit:cover;display:block;">` : ""}
      <div style="padding:1.5rem;">
        <h2 style="margin:0 0 0.5rem;color:var(--text);font-size:1.4rem;line-height:1.3;">${post.title}</h2>
        <p style="color:var(--accent);font-size:0.85rem;margin:0 0 0.75rem;">📅 ${post.date}</p>
        <p style="color:var(--text-muted);line-height:1.6;margin:0;">${post.excerpt}</p>
        <p style="color:var(--accent);font-size:0.85rem;margin-top:1rem;font-weight:600;">Weiterlesen →</p>
      </div>
    </article>`;
  }).join("");
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
    const dropId = "drop-blog-" + Date.now();
    const statusId = "status-blog-" + Date.now();
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">🖼️ Bild</span>
        <button type="button" class="blog-block__remove" onclick="this.closest('.blog-block').remove()">×</button>
      </div>
      <div id="${dropId}" style="border:2px dashed var(--border);border-radius:8px;padding:1.5rem;text-align:center;cursor:pointer;margin-bottom:0.75rem;transition:all 0.3s;color:var(--text-muted);font-size:0.9rem;">
        📁 Bild hierher ziehen oder klicken
      </div>
      <div id="${statusId}" class="status"></div>
      <input type="text" class="block-img-url" placeholder="Oder URL / Dateiname eingeben..." style="margin-bottom:0.5rem;">
      <input type="text" class="block-img-caption" placeholder="Bildunterschrift (optional)...">
    `;
    container.appendChild(div);
    setTimeout(() => {
      initDropZone(dropId, null, statusId, (filename) => {
        div.querySelector(".block-img-url").value = filename;
        document.getElementById(dropId).innerHTML = `✅ ${filename} hochgeladen!`;
      });
    }, 100);
    return;
  }
  container.appendChild(div);
}

function collectBlocks() {
  const blocks = [];
  document.querySelectorAll(".blog-block").forEach(div => {
    const type = div.dataset.type;
    if (type === "text") {
      const val = div.querySelector(".block-text")?.value;
      const align = getOpt(div, [...div.querySelectorAll("[data-group]")].find(b=>b.dataset.group.startsWith("align"))?.dataset.group, "left");
      if (val) blocks.push({ type, content: val, align });
    } else if (type === "heading") {
      const val = div.querySelector(".block-heading")?.value;
      const size = getOpt(div, [...div.querySelectorAll("[data-group]")].find(b=>b.dataset.group.startsWith("hsize"))?.dataset.group, "h2");
      if (val) blocks.push({ type, content: val, size });
    } else if (type === "image") {
      const url     = div.querySelector(".block-img-url")?.value;
      const caption = div.querySelector(".block-img-caption")?.value || "";
      const posGroup   = [...div.querySelectorAll("[data-group]")].find(b=>b.dataset.group.startsWith("pos"))?.dataset.group;
      const widthGroup = [...div.querySelectorAll("[data-group]")].find(b=>b.dataset.group.startsWith("width"))?.dataset.group;
      const position = getOpt(div, posGroup, "full");
      const width    = getOpt(div, widthGroup, "100");
      if (url) blocks.push({ type, url, caption, position, width });
    } else if (type === "divider") {
      blocks.push({ type });
    }
  });
  return blocks;
}

function renderBlocksHTML(blocks) {
  return blocks.map(b => {
    if (b.type === "text") {
      const align = b.align || "left";
      const alignStyle = align === "center" ? "text-align:center;" : align === "right" ? "text-align:right;" : "";
      return `<p style="color:var(--text-muted);line-height:1.9;margin-bottom:1.25rem;font-size:1rem;${alignStyle}">${b.content}</p>`;
    }
    if (b.type === "heading") {
      const size = b.size || "h2";
      const sizes = { h1: "2rem", h2: "1.6rem", h3: "1.3rem" };
      return `<${size} style="font-size:${sizes[size]||"1.5rem"};color:var(--text);font-weight:700;margin:2rem 0 0.75rem;line-height:1.3;">${b.content}</${size}>`;
    }
    if (b.type === "image") {
      const pos = b.position || "full";
      const width = b.width || "100";
      let style = "";
      if (pos === "left")  style = `float:left;width:${width}%;margin:0 1.5rem 1rem 0;`;
      else if (pos === "right") style = `float:right;width:${width}%;margin:0 0 1rem 1.5rem;`;
      else style = `width:${width}%;margin:0 auto;display:block;`;
      return `<figure style="margin:1.5rem 0;${pos==="full"?"clear:both;":""}">
        <img src="${b.url}" style="${style}border-radius:10px;max-width:100%;">
        ${b.caption ? `<figcaption style="text-align:center;color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem;clear:both;">${b.caption}</figcaption>` : ""}
      </figure>`;
    }
    if (b.type === "divider") return `<hr style="border:none;border-top:1px solid var(--border);margin:2rem 0;clear:both;">`;
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


// ===== BILD UPLOAD ZU GITHUB =====
async function uploadImageToGitHub(file, statusId) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(",")[1];
        const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        showStatus(statusId, `⏳ Lade ${filename} hoch...`, "loading");

        // Prüfen ob Datei schon existiert (SHA holen)
        let sha = undefined;
        try {
          const check = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
            { headers: { Authorization: `token ${authToken}` } }
          );
          if (check.ok) {
            const checkData = await check.json();
            sha = checkData.sha;
          }
        } catch {}

        const body = { message: `📷 Upload ${filename} via Admin Panel`, content: base64, branch: GITHUB_BRANCH };
        if (sha) body.sha = sha;

        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${filename}`,
          {
            method: "PUT",
            headers: { Authorization: `token ${authToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message);
        }

        showStatus(statusId, `✅ ${filename} hochgeladen!`, "success");
        resolve(filename);
      } catch (e) {
        showStatus(statusId, `❌ Upload fehlgeschlagen: ${e.message}`, "error");
        reject(e);
      }
    };
    reader.readAsDataURL(file);
  });
}

// ===== DRAG & DROP INITIALISIEREN =====
function initDropZone(zoneId, previewId, statusId, onUploaded) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.style.borderColor = "var(--accent)";
    zone.style.background = "rgba(239,68,68,0.08)";
  });
  zone.addEventListener("dragleave", () => {
    zone.style.borderColor = "";
    zone.style.background = "";
  });
  zone.addEventListener("drop", async (e) => {
    e.preventDefault();
    zone.style.borderColor = "";
    zone.style.background = "";
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
      showStatus(statusId, "❌ Nur Bilder erlaubt!", "error");
      return;
    }
    const filename = await uploadImageToGitHub(file, statusId);
    if (filename && onUploaded) onUploaded(filename);
  });
  zone.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const filename = await uploadImageToGitHub(file, statusId);
      if (filename && onUploaded) onUploaded(filename);
    };
    input.click();
  });
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
  document.getElementById("add-divider-btn")?.addEventListener("click", () => addBlock("divider"));

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

// ── BLOG: POST ÖFFNEN (Admin Panel) ──
window.openBlogPost = function(el) {
  const id = el.dataset.postid;
  const post = blogPosts.find(p => p.id == id);
  if (!post) return;
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("aria-modal","true");
  modal.style.cssText = "display:flex!important;";
  modal.innerHTML = `
    <div class="modal__backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal__panel" style="max-width:700px;">
      <button class="modal__close" onclick="this.closest('.modal').remove()">×</button>
      ${post.image ? `<img src="${post.image}" style="width:100%;border-radius:8px;margin-bottom:1.5rem;">` : ""}
      <h2 class="modal__title" style="font-size:1.75rem;">${post.title}</h2>
      <p style="color:var(--accent);margin-bottom:1.5rem;font-size:0.9rem;">📅 ${post.date}</p>
      <div style="line-height:1.9;">${renderBlocksHTML(post.blocks || [])}</div>
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
