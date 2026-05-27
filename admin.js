/* ===== Config ===== */
const GITHUB_USER = "Lirolol007";
const GITHUB_REPO = "Meine-Socials";
const ADMIN_PASSWORD = "liro2024"; // ÄNDERE DIES!

let githubToken = null;
let siteData = null;
let uploadedFiles = new Map();

/* ===== Base64 Encoding/Decoding ===== */
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str) {
  return decodeURIComponent(escape(atob(str)));
}

/* ===== Login ===== */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  const token = document.getElementById("token").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  if (password !== ADMIN_PASSWORD) {
    alert("❌ Passwort falsch! Standard: 'liro2024'");
    return;
  }

  if (!token || token.trim() === "") {
    alert("❌ Token darf nicht leer sein!");
    return;
  }

  if (!token.startsWith("ghp_")) {
    alert("❌ Token ungültig!\nMuss mit 'ghp_' starten.\n\nWie man einen Token erstellt:\n1. GitHub → Settings → Developer Settings\n2. Personal Access Tokens → Tokens (classic)\n3. Generate new token (classic)\n4. Permissions: repo + admin:repo_hook");
    return;
  }

  githubToken = token;
  
  // Test Token
  try {
    const testRes = await fetch(`https://api.github.com/user`, {
      headers: { Authorization: `token ${token}` }
    });
    
    if (!testRes.ok) {
      console.error("Token test failed:", testRes.status);
      alert("❌ Token ungültig oder abgelaufen!\nStatus: " + testRes.status);
      return;
    }

    const user = await testRes.json();
    console.log("✅ Token gültig für:", user.login);
  } catch (e) {
    console.error("Token test error:", e);
    alert("❌ Token-Validierung fehlgeschlagen:\n" + e.message);
    return;
  }

  if (rememberMe) {
    localStorage.setItem("liro_admin_v2", token);
  }

  // Login erfolgreich - zeige Admin Panel
  const loginScreen = document.getElementById("loginScreen");
  const adminPanel = document.getElementById("adminPanel");
  
  console.log("🔓 Login erfolgreich! Zeige Admin Panel...");
  
  loginScreen.style.display = "none";
  loginScreen.classList.remove("active");
  adminPanel.style.display = "block";

  await loadData();
});

/* ===== Auto-Login ===== */
window.addEventListener("load", async () => {
  const savedToken = localStorage.getItem("liro_admin_v2");
  if (savedToken) {
    console.log("🔑 Auto-Login mit gespeichertem Token...");
    githubToken = savedToken;
    
    const loginScreen = document.getElementById("loginScreen");
    const adminPanel = document.getElementById("adminPanel");
    
    loginScreen.style.display = "none";
    loginScreen.classList.remove("active");
    adminPanel.style.display = "block";
    
    await loadData();
  }
});

/* ===== Logout ===== */
document.getElementById("logoutBtn").addEventListener("click", () => {
  console.log("🚪 Logout...");
  githubToken = null;
  localStorage.removeItem("liro_admin_v2");
  
  const loginScreen = document.getElementById("loginScreen");
  const adminPanel = document.getElementById("adminPanel");
  
  loginScreen.style.display = "flex";
  loginScreen.classList.add("active");
  adminPanel.style.display = "none";
});

/* ===== Tab Navigation ===== */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;
    
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    
    btn.classList.add("active");
    document.getElementById(tabName + "-tab").classList.add("active");
  });
});

/* ===== Helper Functions ===== */
function showStatus(elementId, type, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = `status show ${type}`;
  if (type === "success") {
    setTimeout(() => el.classList.remove("show"), 3000);
  }
}

function v(id) {
  return document.getElementById(id)?.value || "";
}

function sv(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

/* ===== API Calls ===== */
async function getFileSha(filename) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filename}?t=${Date.now()}`,
      { headers: { Authorization: `token ${githubToken}` } }
    );
    if (res.ok) {
      const d = await res.json();
      return d.sha;
    }
  } catch (e) {}
  return null;
}

async function loadSiteData() {
  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/site-data.json?t=${Date.now()}`;
    console.log("📡 Fetch:", url);
    
    const res = await fetch(url, {
      headers: { 
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });
    
    console.log("Response status:", res.status);
    
    if (res.status === 401) {
      throw new Error("GitHub Token ungültig oder abgelaufen (401)");
    }
    
    if (res.status === 404) {
      console.warn("site-data.json nicht gefunden (404), nutze Default...");
      return getDefaultData();
    }
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitHub API Fehler ${res.status}: ${errText}`);
    }
    
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    console.warn("Fehler beim Laden von site-data.json:", e.message);
    return getDefaultData();
  }
}

function getDefaultData() {
  return {
    name: "Liro",
    badge: "VRChat Creator",
    tags: ["🦊 Fox", "VR", "DE"],
    catchphrase: "Direkt, ehrlich & viel Quatsch :3",
    bio: "VRChat · Streams · Content",
    quote: "Direkt, ehrlich & viel Quatsch :3",
    factName: "Liro / Leon",
    factAge: "19",
    factHeight: "1,78 m",
    factOrigin: "🇩🇪 Deutschland",
    bio1: "Moin — ich bin Liro und mache vor allem VRChat-Content: streame, schneide Videos und viel Chaos mit der Community :3",
    bio2: "Ich bin eine direkte Person und freue mich immer über neue Bekanntschaften. Wenn du quatschen oder mitmachen willst, meld dich gern!",
    links: {
      tiktok: { label: "TikTok", hint: "Hauptplattform — @liro7160" },
      discord: { label: "Discord", hint: "Liro/Ryio Community Server" },
      twitch: { label: "Twitch", hint: "Streams & Just Chatting" },
      youtube: { label: "YouTube", hint: "" },
      telegram: { label: "Telegram", hint: "@Liro025" },
      vrchat: { label: "VRChat", hint: "Add mich — Liro0" },
      kofi: { label: "Ko-fi", hint: "Ko-fi Seite" }
    },
    collabs: [
      { name: "Ryio", url: "https://www.tiktok.com/@fluffy_ryio" },
      { name: "DragonPro", url: "https://www.tiktok.com/@dragonpro08" },
      { name: "Linxy", url: "https://www.tiktok.com/@lynxi.vrc" },
      { name: "Kieran", url: "https://www.tiktok.com/@kieran.catto" },
      { name: "Rakurim", url: "https://www.tiktok.com/@rakurimde" },
      { name: "Xarrax", url: "https://www.tiktok.com/@xarrax.official" }
    ],
    pages: {
      about: {
        title: "Über mich",
        subtitle: "VRChat Creator, Streamer & Chaos-Agent",
        content: "<p>Moin! Ich bin Liro...</p>"
      }
    },
    galleryTitles: {},
    blogPosts: [
      {
        id: 1,
        title: "Willkommen auf meinem Blog!",
        date: "2026-05-27",
        excerpt: "Das ist mein erster Blog-Post.",
        content: "<p>Hey! Das ist mein neuer Blog...</p>",
        image: "gallery1.png"
      }
    ]
  };
}

async function saveSiteData(data) {
  const sha = await getFileSha("site-data.json");
  const body = {
    message: "Admin: Daten aktualisiert",
    content: toBase64(JSON.stringify(data, null, 2))
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/site-data.json`,
    {
      method: "PUT",
      headers: { Authorization: `token ${githubToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || res.status);
  }
}

/* ===== Load Data ===== */
async function loadData() {
  try {
    console.log("📥 Lade site-data.json...");
    siteData = await loadSiteData();
    console.log("✅ site-data.json geladen:", siteData);
    
    loadProfilForm();
    loadLinksForm();
    loadModalsForm();
    loadAboutForm();
    loadBlogList();
    await loadGalleryList();
    
    showStatus("profil-status", "success", "✅ Daten geladen!");
  } catch (e) {
    console.error("❌ Fehler beim Laden:", e);
    alert("❌ Fehler beim Laden der Daten:\n" + e.message);
  }
}

/* ===== TAB 1: Profil ===== */
function loadProfilForm() {
  sv("ed-name", siteData.name);
  sv("ed-badge", siteData.badge);
  sv("ed-tags", (siteData.tags || []).join(", "));
  sv("ed-catchphrase", siteData.catchphrase);
  sv("ed-bio", siteData.bio);
  sv("ed-quote", siteData.quote);
  sv("ed-fact-name", siteData.factName);
  sv("ed-fact-age", siteData.factAge);
  sv("ed-fact-height", siteData.factHeight);
  sv("ed-fact-origin", siteData.factOrigin);
  sv("ed-bio1", siteData.bio1);
  sv("ed-bio2", siteData.bio2);
}

document.getElementById("save-profil-btn").addEventListener("click", async () => {
  showStatus("profil-status", "loading", "Wird gespeichert...");
  try {
    siteData.name = v("ed-name");
    siteData.badge = v("ed-badge");
    siteData.tags = v("ed-tags").split(",").map(t => t.trim()).filter(Boolean);
    siteData.catchphrase = v("ed-catchphrase");
    siteData.bio = v("ed-bio");
    siteData.quote = v("ed-quote");
    siteData.factName = v("ed-fact-name");
    siteData.factAge = v("ed-fact-age");
    siteData.factHeight = v("ed-fact-height");
    siteData.factOrigin = v("ed-fact-origin");
    siteData.bio1 = v("ed-bio1");
    siteData.bio2 = v("ed-bio2");

    await saveSiteData(siteData);
    showStatus("profil-status", "success", "✅ Profil gespeichert! Live in ~30 Sek.");
  } catch (e) {
    showStatus("profil-status", "error", `❌ Fehler: ${e.message}`);
  }
});

/* ===== TAB 2: Links & Kollegen ===== */
function loadLinksForm() {
  const container = document.getElementById("links-container");
  container.innerHTML = "";

  Object.keys(siteData.links || {}).forEach(brand => {
    const link = siteData.links[brand];
    const div = document.createElement("div");
    div.className = "form-grid";
    div.innerHTML = `
      <div class="form-group">
        <label>${brand.charAt(0).toUpperCase() + brand.slice(1)} - Label</label>
        <input type="text" value="${link.label}" data-link="${brand}" data-type="label">
      </div>
      <div class="form-group">
        <label>${brand.charAt(0).toUpperCase() + brand.slice(1)} - Hint</label>
        <input type="text" value="${link.hint}" data-link="${brand}" data-type="hint">
      </div>
    `;
    container.appendChild(div);
  });

  loadCollabsForm();
}

function loadCollabsForm() {
  const container = document.getElementById("collabs-container");
  container.innerHTML = "";

  (siteData.collabs || []).forEach((collab, i) => {
    const div = document.createElement("div");
    div.className = "form-grid";
    div.innerHTML = `
      <div class="form-group">
        <label>Name</label>
        <input type="text" value="${collab.name}" class="collab-name" data-index="${i}">
      </div>
      <div class="form-group">
        <label>URL</label>
        <input type="text" value="${collab.url}" class="collab-url" data-index="${i}">
      </div>
    `;
    container.appendChild(div);
  });
}

document.getElementById("add-collab-btn").addEventListener("click", () => {
  if (!siteData.collabs) siteData.collabs = [];
  siteData.collabs.push({ name: "", url: "" });
  loadCollabsForm();
});

document.getElementById("save-links-btn").addEventListener("click", async () => {
  showStatus("links-status", "loading", "Wird gespeichert...");
  try {
    document.querySelectorAll("[data-link]").forEach(el => {
      const brand = el.dataset.link;
      const type = el.dataset.type;
      if (!siteData.links[brand]) siteData.links[brand] = {};
      siteData.links[brand][type] = el.value;
    });

    siteData.collabs = [];
    document.querySelectorAll(".collab-name").forEach(el => {
      const i = el.dataset.index;
      const name = el.value.trim();
      const url = document.querySelector(`.collab-url[data-index="${i}"]`).value.trim();
      if (name && url) {
        siteData.collabs.push({ name, url });
      }
    });

    await saveSiteData(siteData);
    showStatus("links-status", "success", "✅ Links gespeichert! Live in ~30 Sek.");
  } catch (e) {
    showStatus("links-status", "error", `❌ Fehler: ${e.message}`);
  }
});

/* ===== TAB 3: Modals ===== */
function loadModalsForm() {
  const about = siteData.pages?.about || {};
  sv("ed-about-title", about.title || "Über mich");
  sv("ed-about-subtitle", about.subtitle || "");
  sv("ed-about-content", about.content || "");
  sv("ed-contact-text", siteData.contactText || "");
}

document.getElementById("save-modals-btn").addEventListener("click", async () => {
  showStatus("modals-status", "loading", "Wird gespeichert...");
  try {
    if (!siteData.pages) siteData.pages = {};
    siteData.pages.about = {
      title: v("ed-about-title"),
      subtitle: v("ed-about-subtitle"),
      content: v("ed-about-content")
    };
    siteData.contactText = v("ed-contact-text");

    await saveSiteData(siteData);
    showStatus("modals-status", "success", "✅ Modals gespeichert! Live in ~30 Sek.");
  } catch (e) {
    showStatus("modals-status", "error", `❌ Fehler: ${e.message}`);
  }
});

/* ===== TAB 4: About-Seite ===== */
function loadAboutForm() {
  const about = siteData.pages?.about || {};
  sv("ed-about-page-title", about.title || "Über mich");
  sv("ed-about-page-subtitle", about.subtitle || "");
  sv("ed-about-page-content", about.content || "");
}

document.getElementById("save-about-btn").addEventListener("click", async () => {
  showStatus("about-status", "loading", "Wird gespeichert...");
  try {
    if (!siteData.pages) siteData.pages = {};
    siteData.pages.about = {
      title: v("ed-about-page-title"),
      subtitle: v("ed-about-page-subtitle"),
      content: v("ed-about-page-content")
    };

    await saveSiteData(siteData);
    showStatus("about-status", "success", "✅ About-Seite gespeichert! Live in ~30 Sek.");
  } catch (e) {
    showStatus("about-status", "error", `❌ Fehler: ${e.message}`);
  }
});

/* ===== TAB 5: Galerie ===== */
const uploadZone = document.getElementById("uploadZone");
const imageInput = document.getElementById("imageInput");

uploadZone.addEventListener("click", () => imageInput.click());

uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("active");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("active");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("active");
  handleFiles(e.dataTransfer.files);
});

imageInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  uploadedFiles.clear();
  const preview = document.getElementById("previewGrid");
  preview.innerHTML = "";

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFiles.set(file.name, { data: e.target.result, file });
      
      const item = document.createElement("div");
      item.className = "preview-item";
      item.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
      preview.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

async function loadGalleryList() {
  const list = document.getElementById("gallery-list");
  list.innerHTML = "<p>Lädt...</p>";

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/?t=${Date.now()}`,
      { headers: { Authorization: `token ${githubToken}` } }
    );
    const files = await res.json();
    const images = files.filter(f => /^gallery\d+\./i.test(f.name));
    images.sort((a, b) => {
      const na = parseInt(a.name.match(/\d+/)[0]);
      const nb = parseInt(b.name.match(/\d+/)[0]);
      return na - nb;
    });

    list.innerHTML = "";
    images.forEach(f => {
      const captions = siteData.galleryTitles || {};
      const cap = captions[f.name] || {};

      const card = document.createElement("div");
      card.className = "gallery-card";
      card.innerHTML = `
        <img src="${f.download_url}" alt="${f.name}">
        <input type="text" placeholder="Titel" value="${cap.title || ''}" data-file="${f.name}" data-type="title">
        <textarea placeholder="Beschreibung" data-file="${f.name}" data-type="text">${cap.text || ''}</textarea>
      `;
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = `<p style="color: #ff6b6b;">❌ Fehler beim Laden der Galerie: ${e.message}</p>`;
  }
}

document.getElementById("save-gallery-btn").addEventListener("click", async () => {
  showStatus("gallery-status", "loading", "Wird gespeichert...");
  try {
    // Captions speichern
    siteData.galleryTitles = {};
    document.querySelectorAll("[data-file]").forEach(el => {
      const file = el.dataset.file;
      const type = el.dataset.type;
      if (!siteData.galleryTitles[file]) siteData.galleryTitles[file] = {};
      siteData.galleryTitles[file][type] = el.value;
    });

    await saveSiteData(siteData);

    // Bilder hochladen
    for (const [name, { data, file }] of uploadedFiles) {
      const base64 = data.split(",")[1];
      const sha = await getFileSha(name);
      const body = {
        message: `Admin: Bild ${name} hochgeladen`,
        content: base64
      };
      if (sha) body.sha = sha;

      await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${name}`,
        {
          method: "PUT",
          headers: { Authorization: `token ${githubToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );
    }

    uploadedFiles.clear();
    await loadGalleryList();
    showStatus("gallery-status", "success", "✅ Galerie gespeichert! Live in ~30 Sek.");
  } catch (e) {
    showStatus("gallery-status", "error", `❌ Fehler: ${e.message}`);
  }
});

/* ===== TAB 6: Blog ===== */
function loadBlogList() {
  const list = document.getElementById("blog-list");
  list.innerHTML = "";

  (siteData.blogPosts || []).forEach(post => {
    const card = document.createElement("div");
    card.className = "blog-card";
    card.innerHTML = `
      <h4>${post.title}</h4>
      <p>${post.date}</p>
      <p>${post.excerpt.substring(0, 80)}...</p>
      <div class="btn-group">
        <button class="btn btn-small btn-secondary" onclick="editBlogPost(${post.id})">✏️ Bearbeiten</button>
        <button class="btn btn-small btn-secondary" style="color: #ff6b6b; border-color: #ff6b6b;" onclick="deleteBlogPost(${post.id})">🗑️ Löschen</button>
      </div>
    `;
    list.appendChild(card);
  });
}

document.getElementById("create-blog-btn").addEventListener("click", async () => {
  const title = v("new-blog-title");
  const date = v("new-blog-date");
  const excerpt = v("new-blog-excerpt");
  const content = v("new-blog-content");
  const image = v("new-blog-image");

  if (!title || !date || !excerpt || !content) {
    alert("❌ Bitte alle Felder ausfüllen!");
    return;
  }

  showStatus("blog-status", "loading", "Wird erstellt...");
  try {
    if (!siteData.blogPosts) siteData.blogPosts = [];
    const newId = Math.max(...siteData.blogPosts.map(p => p.id || 0)) + 1;

    siteData.blogPosts.unshift({
      id: newId,
      title,
      date,
      excerpt,
      content,
      image
    });

    await saveSiteData(siteData);
    
    document.getElementById("new-blog-title").value = "";
    document.getElementById("new-blog-date").value = "";
    document.getElementById("new-blog-excerpt").value = "";
    document.getElementById("new-blog-content").value = "";
    document.getElementById("new-blog-image").value = "";

    loadBlogList();
    showStatus("blog-status", "success", "✅ Blog-Post erstellt! Live in ~30 Sek.");
  } catch (e) {
    showStatus("blog-status", "error", `❌ Fehler: ${e.message}`);
  }
});

function editBlogPost(id) {
  const post = siteData.blogPosts.find(p => p.id === id);
  if (!post) return;

  sv("new-blog-title", post.title);
  sv("new-blog-date", post.date);
  sv("new-blog-excerpt", post.excerpt);
  sv("new-blog-content", post.content);
  sv("new-blog-image", post.image || "");

  document.querySelector('[data-tab="blog"]').click();
}

async function deleteBlogPost(id) {
  if (!confirm("❌ Wirklich löschen?")) return;

  try {
    siteData.blogPosts = siteData.blogPosts.filter(p => p.id !== id);
    await saveSiteData(siteData);
    loadBlogList();
    showStatus("blog-status", "success", "✅ Blog-Post gelöscht!");
  } catch (e) {
    showStatus("blog-status", "error", `❌ Fehler: ${e.message}`);
  }
}
