// ===== CONFIG =====
const GITHUB_REPO = "Lirolol007/Meine-Socials";
const GITHUB_BRANCH = "main";
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const PASSWORD = "admin123"; // ⚠️ ÄNDERE DAS!

let authToken = "";
let siteData = null;

console.log("✅ admin.js loaded");

// ===== AUTH =====
function initAuth() {
  const stored = localStorage.getItem("admin_token");
  if (stored) {
    authToken = stored;
    loginSuccess();
  } else {
    document.getElementById("loginScreen").classList.remove("hidden");
  }
}

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pass = document.getElementById("password").value;
  const token = document.getElementById("token").value;
  const remember = document.getElementById("rememberMe").checked;
  
  if (pass === PASSWORD && token.startsWith("ghp_")) {
    authToken = token;
    if (remember) localStorage.setItem("admin_token", token);
    await loginSuccess();
  } else {
    alert("❌ Falsches Passwort oder ungültiger Token!");
  }
});

async function loginSuccess() {
  console.log("✅ Login erfolgreich!");
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  await loadSiteData();
  initTabs();
  initAllEventListeners();
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("admin_token");
  location.reload();
});

// ===== LOAD DATA FROM GITHUB =====
async function loadSiteData() {
  try {
    showStatus("main-status", "⏳ Lade Daten...", "loading");
    
    const res = await fetch(`${GITHUB_RAW}/site-data.json?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
    
    siteData = await res.json();
    console.log("✅ site-data.json geladen:", siteData);
    
    populateAllFields();
    showStatus("main-status", "✅ Daten geladen!", "success");
  } catch (e) {
    alert(`❌ Fehler beim Laden: ${e.message}`);
    console.error(e);
  }
}

// ===== POPULATE ALL FIELDS =====
function populateAllFields() {
  console.log("🔄 Fülle alle Felder...");
  
  if (!siteData) {
    console.error("❌ siteData ist null!");
    return;
  }
  
  // HAUPTSEITE
  try {
    document.getElementById("ed-name").value = siteData.name || "";
    document.getElementById("ed-badge").value = siteData.badge || "";
    document.getElementById("ed-tags").value = (siteData.tags || []).join(", ");
    document.getElementById("ed-catchphrase").value = siteData.catchphrase || "";
    document.getElementById("ed-bio").value = siteData.bio || "";
    document.getElementById("ed-bio1").value = siteData.bio1 || "";
    document.getElementById("ed-bio2").value = siteData.bio2 || "";
    
    document.getElementById("ed-factName").value = siteData.factName || "";
    document.getElementById("ed-factAge").value = siteData.factAge || "";
    document.getElementById("ed-factHeight").value = siteData.factHeight || "";
    document.getElementById("ed-factOrigin").value = siteData.factOrigin || "";
    
    console.log("✅ Hauptseite-Felder gefüllt");
  } catch (e) {
    console.error("❌ Fehler beim Füllen Hauptseite:", e);
  }
  
  // LINKS & KOLLEGEN
  populateLinksTab();
  
  // ABOUT
  try {
    const about = siteData.pages?.about || {};
    document.getElementById("ed-about-title").value = about.title || "";
    document.getElementById("ed-about-subtitle").value = about.subtitle || "";
    document.getElementById("ed-about-content").value = about.content || "";
    console.log("✅ About-Felder gefüllt");
  } catch (e) {
    console.error("❌ Fehler beim Füllen About:", e);
  }
  
  // GALLERY
  populateGalleryTab();
  
  // BLOG
  populateBlogList();
  
  // MODALS
  try {
    document.getElementById("ed-contact-text").value = siteData.contactText || "";
    console.log("✅ Modals-Felder gefüllt");
  } catch (e) {
    console.error("❌ Fehler beim Füllen Modals:", e);
  }
}

// ===== LINKS TAB =====
function populateLinksTab() {
  const container = document.getElementById("links-container");
  container.innerHTML = "";
  
  if (siteData.links) {
    Object.entries(siteData.links).forEach(([key, link]) => {
      const div = document.createElement("div");
      div.className = "link-section";
      div.innerHTML = `
        <h4>${key.toUpperCase()}</h4>
        <div class="form-grid">
          <div class="form-group">
            <label>Label</label>
            <input type="text" class="link-label" data-key="${key}" value="${link.label || ""}">
          </div>
          <div class="form-group">
            <label>Hint</label>
            <input type="text" class="link-hint" data-key="${key}" value="${link.hint || ""}">
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }
  
  populateCollabs();
  console.log("✅ Links-Tab gefüllt");
}

function populateCollabs() {
  const container = document.getElementById("collabs-container");
  container.innerHTML = "";
  
  if (siteData.collabs && siteData.collabs.length > 0) {
    siteData.collabs.forEach((collab, idx) => {
      const div = document.createElement("div");
      div.className = "form-section";
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4>${collab.name || "Kolleg*in " + (idx+1)}</h4>
          <button class="btn btn-small btn-secondary" type="button" onclick="removeCollab(${idx})">🗑️</button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Name</label>
            <input type="text" class="collab-name" data-idx="${idx}" value="${collab.name || ""}">
          </div>
          <div class="form-group">
            <label>URL (TikTok)</label>
            <input type="text" class="collab-url" data-idx="${idx}" value="${collab.url || ""}">
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }
}

function removeCollab(idx) {
  if (confirm("Kolleg*in löschen?")) {
    siteData.collabs.splice(idx, 1);
    populateCollabs();
  }
}

document.getElementById("add-collab-btn")?.addEventListener("click", () => {
  if (!siteData.collabs) siteData.collabs = [];
  siteData.collabs.push({ name: "", url: "" });
  populateCollabs();
});

// ===== GALLERY =====
function populateGalleryTab() {
  const container = document.getElementById("gallery-container");
  container.innerHTML = "";
  
  if (!siteData.pages) siteData.pages = {};
  if (!siteData.pages.gallery) siteData.pages.gallery = { items: [] };
  
  const items = siteData.pages.gallery.items || [];
  
  items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "form-section";
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h4>Item ${idx + 1}</h4>
        <button class="btn btn-small btn-secondary" type="button" onclick="removeGalleryItem(${idx})">🗑️</button>
      </div>
      <div class="form-grid">
        <div class="form-group form-full">
          <label>Bild (URL oder Dateiname)</label>
          <input type="text" class="gallery-image" data-idx="${idx}" value="${item.image || ""}" placeholder="z.B. gallery1.png oder https://...">
        </div>
        <div class="form-group">
          <label>Titel</label>
          <input type="text" class="gallery-title" data-idx="${idx}" value="${item.title || ""}">
        </div>
        <div class="form-group">
          <label>Beschreibung</label>
          <input type="text" class="gallery-desc" data-idx="${idx}" value="${item.description || ""}">
        </div>
      </div>
    `;
    container.appendChild(div);
  });
  
  console.log("✅ Gallery-Tab gefüllt");
}

function removeGalleryItem(idx) {
  if (confirm("Gallery-Item löschen?")) {
    siteData.pages.gallery.items.splice(idx, 1);
    populateGalleryTab();
  }
}

document.getElementById("add-gallery-btn")?.addEventListener("click", () => {
  if (!siteData.pages) siteData.pages = {};
  if (!siteData.pages.gallery) siteData.pages.gallery = { items: [] };
  siteData.pages.gallery.items.push({ image: "", title: "", description: "" });
  populateGalleryTab();
});

// ===== BLOG =====
function populateBlogList() {
  const list = document.getElementById("blog-list");
  list.innerHTML = "";
  
  if (siteData.blogPosts && siteData.blogPosts.length > 0) {
    siteData.blogPosts.forEach(post => {
      const date = new Date(post.date).toLocaleDateString("de-DE");
      const div = document.createElement("div");
      div.className = "blog-card";
      div.innerHTML = `
        <h4>${post.title}</h4>
        <p>📅 ${date}</p>
        <p style="color: var(--text-muted); font-size: 0.85rem; max-height: 3em; overflow: hidden;">${post.excerpt}</p>
        <div class="btn-group">
          <button class="btn btn-small btn-secondary" type="button" onclick="deleteBlogPost(${post.id})">🗑️ Löschen</button>
        </div>
      `;
      list.appendChild(div);
    });
  } else {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Noch keine Posts</p>';
  }
  
  console.log("✅ Blog-List gefüllt");
}

function addBlogBlock(type) {
  const container = document.getElementById("blog-blocks-container");
  const div = document.createElement("div");
  div.className = "blog-block";
  div.dataset.type = type;
  
  if (type === "text") {
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">📝 Text</span>
        <button class="blog-block__remove" type="button" onclick="this.closest('.blog-block').remove()">×</button>
      </div>
      <textarea placeholder="Text eingeben..."></textarea>
    `;
  } else if (type === "heading") {
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">📌 Überschrift</span>
        <button class="blog-block__remove" type="button" onclick="this.closest('.blog-block').remove()">×</button>
      </div>
      <input type="text" placeholder="Überschrift...">
    `;
  } else if (type === "image") {
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">🖼️ Bild</span>
        <button class="blog-block__remove" type="button" onclick="this.closest('.blog-block').remove()">×</button>
      </div>
      <input type="text" class="image-url" placeholder="Bild-URL...">
      <select class="image-position" style="width: 100%; padding: 0.8rem; margin-top: 0.5rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text); border-radius: 8px;">
        <option value="left">📐 Links</option>
        <option value="right">📐 Rechts</option>
        <option value="full">📐 Vollbreite</option>
      </select>
      <input type="number" class="image-width" placeholder="Breite %" min="10" max="100" style="width: 100%; padding: 0.8rem; margin-top: 0.5rem; background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text); border-radius: 8px;">
    `;
  }
  
  container.appendChild(div);
}

function deleteBlogPost(id) {
  if (confirm("Post wirklich löschen?")) {
    siteData.blogPosts = (siteData.blogPosts || []).filter(p => p.id !== id);
    saveToGitHub("blog-status").then(() => {
      populateBlogList();
      showStatus("blog-status", "✅ Post gelöscht!", "success");
    });
  }
}

// ===== SAVE TO GITHUB =====
async function saveToGitHub(statusId) {
  try {
    console.log("💾 Speichere zu GitHub...", siteData);
    showStatus(statusId, "⏳ Speichert zu GitHub...", "loading");
    
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(siteData, null, 2))));
    
    const shaRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/site-data.json`,
      { headers: { Authorization: `token ${authToken}` } }
    );
    
    if (!shaRes.ok) throw new Error("SHA abrufen fehlgeschlagen");
    const shaData = await shaRes.json();
    
    const updateRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/site-data.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Update via Admin Panel",
          content,
          sha: shaData.sha
        })
      }
    );
    
    if (!updateRes.ok) throw new Error("GitHub Update fehlgeschlagen");
    
    showStatus(statusId, "✅ Gespeichert! Seite wird neugeladen...", "success");
    console.log("✅ Zu GitHub gepusht!");
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (e) {
    showStatus(statusId, `❌ Fehler: ${e.message}`, "error");
    console.error(e);
  }
}

// ===== ALL EVENT LISTENERS =====
function initAllEventListeners() {
  console.log("🔌 Initialisiere alle Event Listener...");
  
  // HAUPTSEITE SAVE
  const saveMainBtn = document.getElementById("save-main-btn");
  if (saveMainBtn) {
    saveMainBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("💾 Speichere Hauptseite...");
      
      siteData.name = document.getElementById("ed-name").value;
      siteData.badge = document.getElementById("ed-badge").value;
      siteData.tags = document.getElementById("ed-tags").value.split(",").map(t => t.trim()).filter(t => t);
      siteData.catchphrase = document.getElementById("ed-catchphrase").value;
      siteData.bio = document.getElementById("ed-bio").value;
      siteData.bio1 = document.getElementById("ed-bio1").value;
      siteData.bio2 = document.getElementById("ed-bio2").value;
      
      siteData.factName = document.getElementById("ed-factName").value;
      siteData.factAge = document.getElementById("ed-factAge").value;
      siteData.factHeight = document.getElementById("ed-factHeight").value;
      siteData.factOrigin = document.getElementById("ed-factOrigin").value;
      
      console.log("✅ Werte aktualisiert:", siteData);
      saveToGitHub("main-status");
    });
  } else {
    console.warn("⚠️ save-main-btn nicht gefunden!");
  }
  
  // LINKS SAVE
  const saveLinksBtn = document.getElementById("save-links-btn");
  if (saveLinksBtn) {
    saveLinksBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("💾 Speichere Links...");
      
      document.querySelectorAll(".link-label").forEach(input => {
        const key = input.dataset.key;
        if (siteData.links[key]) siteData.links[key].label = input.value;
      });
      
      document.querySelectorAll(".link-hint").forEach(input => {
        const key = input.dataset.key;
        if (siteData.links[key]) siteData.links[key].hint = input.value;
      });
      
      siteData.collabs = [];
      document.querySelectorAll(".collab-name").forEach(input => {
        const idx = input.dataset.idx;
        const name = input.value;
        const url = document.querySelector(`.collab-url[data-idx="${idx}"]`)?.value || "";
        if (name || url) siteData.collabs.push({ name, url });
      });
      
      console.log("✅ Links aktualisiert:", siteData);
      saveToGitHub("links-status");
    });
  }
  
  // ABOUT SAVE
  const saveAboutBtn = document.getElementById("save-about-btn");
  if (saveAboutBtn) {
    saveAboutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("💾 Speichere About...");
      
      if (!siteData.pages) siteData.pages = {};
      if (!siteData.pages.about) siteData.pages.about = {};
      
      siteData.pages.about.title = document.getElementById("ed-about-title").value;
      siteData.pages.about.subtitle = document.getElementById("ed-about-subtitle").value;
      siteData.pages.about.content = document.getElementById("ed-about-content").value;
      
      console.log("✅ About aktualisiert:", siteData);
      saveToGitHub("about-status");
    });
  }
  
  // GALLERY SAVE
  const saveGalleryBtn = document.getElementById("save-gallery-btn");
  if (saveGalleryBtn) {
    saveGalleryBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("💾 Speichere Gallery...");
      
      if (!siteData.pages) siteData.pages = {};
      if (!siteData.pages.gallery) siteData.pages.gallery = { items: [] };
      
      siteData.pages.gallery.items = [];
      document.querySelectorAll(".gallery-image").forEach(input => {
        const idx = input.dataset.idx;
        const image = input.value;
        const title = document.querySelector(`.gallery-title[data-idx="${idx}"]`)?.value || "";
        const description = document.querySelector(`.gallery-desc[data-idx="${idx}"]`)?.value || "";
        
        if (image) {
          siteData.pages.gallery.items.push({ image, title, description });
        }
      });
      
      console.log("✅ Gallery aktualisiert:", siteData);
      saveToGitHub("gallery-status");
    });
  }
  
  // MODALS SAVE
  const saveModalsBtn = document.getElementById("save-modals-btn");
  if (saveModalsBtn) {
    saveModalsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("💾 Speichere Modals...");
      
      siteData.contactText = document.getElementById("ed-contact-text").value;
      
      console.log("✅ Modals aktualisiert:", siteData);
      saveToGitHub("modals-status");
    });
  }
  
  // BLOG BUTTONS
  document.getElementById("add-text-block-btn")?.addEventListener("click", () => addBlogBlock("text"));
  document.getElementById("add-heading-block-btn")?.addEventListener("click", () => addBlogBlock("heading"));
  document.getElementById("add-image-block-btn")?.addEventListener("click", () => addBlogBlock("image"));
  
  document.getElementById("create-blog-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("✍️ Erstelle Blog Post...");
    
    const title = document.getElementById("new-blog-title").value;
    const date = document.getElementById("new-blog-date").value;
    const excerpt = document.getElementById("new-blog-excerpt").value;
    const image = document.getElementById("new-blog-image").value;
    
    if (!title || !date || !excerpt) {
      showStatus("blog-status", "❌ Bitte Titel, Datum und Excerpt ausfüllen!", "error");
      return;
    }
    
    const blocks = [];
    document.querySelectorAll(".blog-block").forEach(block => {
      const type = block.dataset.type;
      
      if (type === "text") {
        const content = block.querySelector("textarea").value;
        if (content) blocks.push({ type: "text", content });
      } else if (type === "heading") {
        const content = block.querySelector("input").value;
        if (content) blocks.push({ type: "heading", content });
      } else if (type === "image") {
        const url = block.querySelector(".image-url").value;
        if (url) {
          blocks.push({
            type: "image",
            url,
            position: block.querySelector(".image-position").value || "left",
            width: block.querySelector(".image-width").value || "50"
          });
        }
      }
    });
    
    const post = {
      id: Date.now(),
      title,
      date,
      excerpt,
      image: image || "",
      content: JSON.stringify(blocks)
    };
    
    if (!siteData.blogPosts) siteData.blogPosts = [];
    siteData.blogPosts.push(post);
    
    console.log("✅ Blog Post erstellt:", post);
    
    saveToGitHub("blog-status").then(() => {
      document.getElementById("new-blog-title").value = "";
      document.getElementById("new-blog-date").value = "";
      document.getElementById("new-blog-excerpt").value = "";
      document.getElementById("new-blog-image").value = "";
      document.getElementById("blog-blocks-container").innerHTML = "";
      
      populateBlogList();
    });
  });
  
  console.log("✅ Alle Event Listener initialisiert!");
}

// ===== HELPER =====
function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`⚠️ Status-Element #${id} nicht gefunden!`);
    return;
  }
  el.textContent = msg;
  el.className = `status show ${type}`;
  console.log(`📢 Status: ${msg}`);
  setTimeout(() => el.classList.remove("show"), 6000);
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      const tabName = btn.dataset.tab;
      const tabContent = document.getElementById(`${tabName}-tab`);
      if (tabContent) {
        tabContent.classList.add("active");
        console.log(`📑 Tab gewechselt: ${tabName}`);
      }
    });
  });
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 admin.js initializing...");
  initAuth();
});
