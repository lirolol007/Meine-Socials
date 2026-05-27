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
async function initBlogPage() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  const data = await loadSiteData();
  const posts = data.blogPosts || [];

  if (posts.length === 0) {
    grid.innerHTML = '<div class="blog-empty"><p>Noch keine Blog-Posts vorhanden.</p></div>';
    return;
  }

  grid.innerHTML = posts
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

/* ===== Blog Modal ===== */
let currentBlogPosts = [];

function openBlogPost(id) {
  const post = currentBlogPosts.find(p => p.id === id);
  if (!post) return;

  document.getElementById("blog-modal-title").textContent = post.title;
  document.getElementById("blog-modal-date").textContent = new Date(post.date).toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const imgEl = document.getElementById("blog-modal-img");
  if (post.image) {
    imgEl.src = post.image;
    imgEl.style.display = "block";
  } else {
    imgEl.style.display = "none";
  }

  document.getElementById("blog-modal-content").innerHTML = post.content;
  document.getElementById("blog-modal").classList.add("is-open");
}

function closeBlogModal() {
  document.getElementById("blog-modal").classList.remove("is-open");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeBlogModal();
});

/* ===== Init ===== */
window.addEventListener("load", async () => {
  initTheme();
  const data = await loadSiteData();
  currentBlogPosts = data.blogPosts || [];
  
  if (document.getElementById("blog-grid")) {
    initBlogPage();
  }
});
