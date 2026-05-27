// ===== CONFIG =====
const GITHUB_REPO = "Lirolol007/Meine-Socials";
const GITHUB_BRANCH = "main";
const GITHUB_RAW = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const PASSWORD_HASH = "admin123"; // Change this!

let authToken = "";
let siteData = null;

// ===== AUTH =====
function initAuth() {
  const stored = localStorage.getItem("admin_token");
  const storedPass = localStorage.getItem("admin_pass");
  
  if (stored && storedPass) {
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
  
  if (pass === PASSWORD_HASH && token.startsWith("ghp_")) {
    authToken = token;
    if (remember) {
      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_pass", pass);
    }
    await loginSuccess();
  } else {
    alert("❌ Falsches Passwort oder ungültiger Token!");
  }
});

async function loginSuccess() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");
  await loadSiteData();
  initTabs();
  initEventListeners();
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_pass");
  location.reload();
});

// ===== LOAD SITE DATA =====
async function loadSiteData() {
  try {
    const res = await fetch(`${GITHUB_RAW}/site-data.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    siteData = await res.json();
    console.log("✅ site-data.json geladen");
    
    populateFields();
  } catch (e) {
    showStatus("profil-status", `❌ Fehler beim Laden: ${e.message}`, "error");
  }
}

function populateFields() {
  if (!siteData) return;
  
  // Profil Tab
  document.getElementById("ed-name").value = siteData.name || "";
  document.getElementById("ed-badge").value = siteData.badge || "";
  document.getElementById("ed-tags").value = (siteData.tags || []).join(", ");
  document.getElementById("ed-catchphrase").value = siteData.catchphrase || "";
  document.getElementById("ed-bio").value = siteData.bio || "";
  document.getElementById("ed-quote").value = siteData.quote || "";
  
  // Facts
  document.getElementById("ed-fact-name").value = siteData.factName || "";
  document.getElementById("ed-fact-age").value = siteData.factAge || "";
  document.getElementById("ed-fact-height").value = siteData.factHeight || "";
  document.getElementById("ed-fact-origin").value = siteData.factOrigin || "";
  
  // Bio
  document.getElementById("ed-bio1").value = siteData.bio1 || "";
  document.getElementById("ed-bio2").value = siteData.bio2 || "";
  
  // Links & Modals
  populateLinks();
  populateModals();
  populateBlog();
}

function populateLinks() {
  const linksContainer = document.getElementById("links-container");
  linksContainer.innerHTML = "";
  
  if (siteData.links) {
    Object.entries(siteData.links).forEach(([key, link]) => {
      const div = document.createElement("div");
      div.className = "form-section";
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
      linksContainer.appendChild(div);
    });
  }
  
  // Collabs
  const collabsContainer = document.getElementById("collabs-container");
  collabsContainer.innerHTML = "";
  
  if (siteData.collabs) {
    siteData.collabs.forEach((collab, idx) => {
      const div = document.createElement("div");
      div.className = "form-section";
      div.innerHTML = `
        <div class="form-grid">
          <div class="form-group">
            <label>Name</label>
            <input type="text" class="collab-name" data-idx="${idx}" value="${collab.name || ""}">
          </div>
          <div class="form-group">
            <label>URL</label>
            <input type="text" class="collab-url" data-idx="${idx}" value="${collab.url || ""}">
          </div>
        </div>
      `;
      collabsContainer.appendChild(div);
    });
  }
}

function populateModals() {
  const about = siteData.pages?.about || {};
  document.getElementById("ed-about-title").value = about.title || "";
  document.getElementById("ed-about-subtitle").value = about.subtitle || "";
  document.getElementById("ed-about-content").value = about.content || "";
  
  document.getElementById("ed-contact-text").value = siteData.contactText || "";
  
  // About page
  const aboutPage = siteData.pages?.about || {};
  document.getElementById("ed-about-page-title").value = aboutPage.title || "";
  document.getElementById("ed-about-page-subtitle").value = aboutPage.subtitle || "";
  document.getElementById("ed-about-page-content").value = aboutPage.content || "";
}

function populateBlog() {
  const listDiv = document.getElementById("blog-list");
  listDiv.innerHTML = "";
  
  if (siteData.blogPosts && siteData.blogPosts.length > 0) {
    siteData.blogPosts.forEach(post => {
      const div = document.createElement("div");
      div.className = "blog-card";
      const date = new Date(post.date).toLocaleDateString("de-DE");
      div.innerHTML = `
        <h4>${post.title}</h4>
        <p>📅 ${date}</p>
        <p>${post.excerpt}</p>
        <div class="btn-group">
          <button class="btn btn-small btn-secondary" onclick="editBlogPost(${post.id})">✏️ Bearbeiten</button>
          <button class="btn btn-small btn-secondary" onclick="deleteBlogPost(${post.id})">🗑️ Löschen</button>
        </div>
      `;
      listDiv.appendChild(div);
    });
  } else {
    listDiv.innerHTML = '<p style="color: var(--text-muted);">Noch keine Blog-Posts vorhanden</p>';
  }
}

// ===== SAVE FUNCTIONS =====
document.getElementById("save-profil-btn")?.addEventListener("click", async () => {
  siteData.name = document.getElementById("ed-name").value;
  siteData.badge = document.getElementById("ed-badge").value;
  siteData.tags = document.getElementById("ed-tags").value.split(",").map(t => t.trim());
  siteData.catchphrase = document.getElementById("ed-catchphrase").value;
  siteData.bio = document.getElementById("ed-bio").value;
  siteData.quote = document.getElementById("ed-quote").value;
  
  siteData.factName = document.getElementById("ed-fact-name").value;
  siteData.factAge = document.getElementById("ed-fact-age").value;
  siteData.factHeight = document.getElementById("ed-fact-height").value;
  siteData.factOrigin = document.getElementById("ed-fact-origin").value;
  
  siteData.bio1 = document.getElementById("ed-bio1").value;
  siteData.bio2 = document.getElementById("ed-bio2").value;
  
  await saveSiteData("profil-status");
});

document.getElementById("save-links-btn")?.addEventListener("click", async () => {
  // Links
  document.querySelectorAll(".link-label").forEach(input => {
    const key = input.dataset.key;
    siteData.links[key].label = input.value;
  });
  
  document.querySelectorAll(".link-hint").forEach(input => {
    const key = input.dataset.key;
    siteData.links[key].hint = input.value;
  });
  
  // Collabs
  siteData.collabs = [];
  document.querySelectorAll(".collab-name").forEach(input => {
    const idx = input.dataset.idx;
    const name = input.value;
    const url = document.querySelector(`.collab-url[data-idx="${idx}"]`).value;
    if (name && url) {
      siteData.collabs.push({ name, url });
    }
  });
  
  await saveSiteData("links-status");
});

document.getElementById("save-modals-btn")?.addEventListener("click", async () => {
  if (!siteData.pages) siteData.pages = {};
  if (!siteData.pages.about) siteData.pages.about = {};
  
  siteData.pages.about.title = document.getElementById("ed-about-title").value;
  siteData.pages.about.subtitle = document.getElementById("ed-about-subtitle").value;
  siteData.pages.about.content = document.getElementById("ed-about-content").value;
  
  siteData.contactText = document.getElementById("ed-contact-text").value;
  
  await saveSiteData("modals-status");
});

document.getElementById("save-about-btn")?.addEventListener("click", async () => {
  if (!siteData.pages) siteData.pages = {};
  if (!siteData.pages.about) siteData.pages.about = {};
  
  siteData.pages.about.title = document.getElementById("ed-about-page-title").value;
  siteData.pages.about.subtitle = document.getElementById("ed-about-page-subtitle").value;
  siteData.pages.about.content = document.getElementById("ed-about-page-content").value;
  
  await saveSiteData("about-status");
});

document.getElementById("create-blog-btn")?.addEventListener("click", async () => {
  const title = document.getElementById("new-blog-title").value;
  const date = document.getElementById("new-blog-date").value;
  const excerpt = document.getElementById("new-blog-excerpt").value;
  const image = document.getElementById("new-blog-image").value;
  
  if (!title || !date || !excerpt) {
    showStatus("blog-status", "❌ Bitte alle Felder ausfüllen!", "error");
    return;
  }
  
  // Collect blocks
  const blocks = [];
  document.querySelectorAll(".blog-block").forEach(block => {
    const type = block.dataset.type;
    
    if (type === "text") {
      blocks.push({
        type: "text",
        content: block.querySelector("textarea").value
      });
    } else if (type === "heading") {
      blocks.push({
        type: "heading",
        content: block.querySelector("input").value
      });
    } else if (type === "image") {
      blocks.push({
        type: "image",
        url: block.querySelector(".image-url").value,
        position: block.querySelector(".image-position").value,
        width: block.querySelector(".image-width").value || "50"
      });
    }
  });
  
  const post = {
    id: Date.now(),
    title,
    date,
    excerpt,
    image,
    content: JSON.stringify(blocks)
  };
  
  if (!siteData.blogPosts) siteData.blogPosts = [];
  siteData.blogPosts.push(post);
  
  await saveSiteData("blog-status");
  
  // Clear form
  document.getElementById("new-blog-title").value = "";
  document.getElementById("new-blog-date").value = "";
  document.getElementById("new-blog-excerpt").value = "";
  document.getElementById("new-blog-image").value = "";
  document.getElementById("blog-blocks-container").innerHTML = "";
  
  populateBlog();
});

// ===== SAVE TO GITHUB =====
async function saveSiteData(statusId) {
  try {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(siteData, null, 2))));
    
    // Get current SHA
    const shaRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/site-data.json`,
      { headers: { Authorization: `token ${authToken}` } }
    );
    
    if (!shaRes.ok) throw new Error("Konnte SHA nicht abrufen");
    const shaData = await shaRes.json();
    
    // Update file
    const updateRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/site-data.json`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Update site-data.json",
          content,
          sha: shaData.sha
        })
      }
    );
    
    if (!updateRes.ok) throw new Error("GitHub Update fehlgeschlagen");
    
    showStatus(statusId, "✅ Erfolgreich gespeichert!", "success");
    console.log("✅ site-data.json aktualisiert");
  } catch (e) {
    showStatus(statusId, `❌ Fehler: ${e.message}`, "error");
    console.error(e);
  }
}

// ===== HELPER FUNCTIONS =====
function showStatus(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `status show ${type}`;
  setTimeout(() => el.classList.remove("show"), 5000);
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById(`${tab}-tab`).classList.add("active");
    });
  });
}

function initEventListeners() {
  document.getElementById("add-collab-btn")?.addEventListener("click", () => {
    if (!siteData.collabs) siteData.collabs = [];
    siteData.collabs.push({ name: "", url: "" });
    populateLinks();
  });
  
  document.getElementById("add-text-block-btn")?.addEventListener("click", () => {
    addBlogBlock("text");
  });
  
  document.getElementById("add-heading-block-btn")?.addEventListener("click", () => {
    addBlogBlock("heading");
  });
  
  document.getElementById("add-image-block-btn")?.addEventListener("click", () => {
    addBlogBlock("image");
  });
}

function addBlogBlock(type) {
  const container = document.getElementById("blog-blocks-container");
  const div = document.createElement("div");
  div.className = "blog-block";
  div.dataset.type = type;
  
  if (type === "text") {
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">📝 Text-Block</span>
        <button class="blog-block__remove" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <textarea placeholder="Dein Text hier..."></textarea>
    `;
  } else if (type === "heading") {
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">📌 Überschrift</span>
        <button class="blog-block__remove" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <input type="text" placeholder="Überschrift eingeben...">
    `;
  } else if (type === "image") {
    div.innerHTML = `
      <div class="blog-block__header">
        <span class="blog-block__type">🖼️ Bild-Block</span>
        <button class="blog-block__remove" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <input type="text" class="image-url" placeholder="Bild-URL oder Dateiname...">
      <select class="image-position">
        <option value="left">Links</option>
        <option value="right">Rechts</option>
        <option value="full">Vollbreite</option>
      </select>
      <input type="number" class="image-width" placeholder="Breite %" min="10" max="100">
    `;
  }
  
  container.appendChild(div);
}

function editBlogPost(id) {
  alert("✏️ Bearbeitung kommt bald!");
}

function deleteBlogPost(id) {
  if (confirm("🗑️ Wirklich löschen?")) {
    siteData.blogPosts = siteData.blogPosts.filter(p => p.id !== id);
    saveSiteData("blog-status");
    populateBlog();
  }
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", initAuth);
