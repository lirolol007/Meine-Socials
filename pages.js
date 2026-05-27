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

/* ===== Blog Page ===== */
let allBlogPosts = [];

async function initBlogPage() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

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
  document.getElementById("blog-post-meta").innerHTML = `
    <span>📅 ${dateStr}</span>
  `;

  const bodyHtml = renderBlogBlocks(post.content);
  document.getElementById("blog-post-body").innerHTML = bodyHtml;
  
  document.getElementById("blog-modal").classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeBlogPost() {
  document.getElementById("blog-modal").classList.remove("is-open");
  document.body.style.overflow = "auto";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeBlogPost();
});

document.getElementById("blog-modal")?.addEventListener("click", (e) => {
  if (e.target.id === "blog-modal") closeBlogPost();
});

/* ===== Init ===== */
window.addEventListener("load", async () => {
  initTheme();
  
  if (document.getElementById("blog-grid")) {
    initBlogPage();
  }
});
