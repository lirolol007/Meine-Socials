(function() {
  /* ===== Dark/Light Mode ===== */
  var themeBtn = document.getElementById('theme-toggle');
  var savedTheme = localStorage.getItem('theme') || 'dark';
  
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  
  setTheme(savedTheme);
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ===== Nav Toggle Mobile ===== */
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.querySelector('.nav__links');
  if (navToggle) {
    navToggle.addEventListener('click', function() {
      navLinks.classList.toggle('active');
    });
  }

  /* ===== Load Data ===== */
  var siteData = null;
  fetch('site-data.json?t=' + Date.now())
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d) return;
      siteData = d;
      loadPageData();
    })
    .catch(e => console.log('site-data.json nicht geladen'));

  function loadPageData() {
    var path = window.location.pathname;
    
    if (path.includes('about')) {
      loadAbout();
    } else if (path.includes('gallery')) {
      loadGallery();
    } else if (path.includes('blog')) {
      loadBlog();
    }
  }

  /* ===== About Page ===== */
  function loadAbout() {
    if (!siteData.pages.about) return;
    var page = siteData.pages.about;
    
    var titleEl = document.getElementById('page-title');
    var subtitleEl = document.getElementById('page-subtitle');
    var contentEl = document.getElementById('page-content');
    
    if (titleEl) titleEl.textContent = page.title;
    if (subtitleEl) subtitleEl.textContent = page.subtitle;
    if (contentEl) contentEl.innerHTML = page.content;
    
    // Fakten
    var facts = ['factName', 'factAge', 'factHeight', 'factOrigin'];
    facts.forEach((fact, i) => {
      var el = document.getElementById('fact-' + ['name', 'age', 'height', 'origin'][i]);
      if (el) el.textContent = siteData[fact] || '—';
    });
  }

  /* ===== Gallery Page ===== */
  function loadGallery() {
    var grid = document.getElementById('gallery-grid');
    if (!grid) return;
    
    fetch('https://api.github.com/repos/Lirolol007/Meine-Socials/contents/')
      .then(r => r.json())
      .then(files => {
        var images = files.filter(f => /^gallery\d+\./i.test(f.name));
        images.sort((a, b) => {
          var na = parseInt(a.name.match(/\d+/)[0]);
          var nb = parseInt(b.name.match(/\d+/)[0]);
          return na - nb;
        });
        
        if (!images.length) {
          grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Keine Bilder vorhanden</p>';
          return;
        }
        
        grid.innerHTML = '';
        images.forEach(f => {
          var captions = siteData.galleryTitles || {};
          var cap = captions[f.name] || {};
          
          var item = document.createElement('div');
          item.className = 'gallery-item';
          item.innerHTML = `<img src="${f.download_url}" alt="${f.name}" loading="lazy">
            <div class="gallery-item__caption">
              ${cap.title ? '<div class="gallery-item__title">' + cap.title + '</div>' : ''}
            </div>`;
          item.addEventListener('click', () => openLightbox(f.download_url, cap.title || '', cap.text || ''));
          grid.appendChild(item);
        });
      })
      .catch(e => {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff6b6b;">Fehler beim Laden</p>';
      });
  }

  function openLightbox(src, title, text) {
    var lightbox = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    var titleEl = document.getElementById('lightbox-title');
    var textEl = document.getElementById('lightbox-text');
    
    if (img) img.src = src;
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (lightbox) {
      lightbox.removeAttribute('hidden');
      lightbox.classList.add('is-open');
    }
  }

  var lightboxClose = document.getElementById('lightbox-close');
  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      var lightbox = document.getElementById('lightbox');
      if (lightbox) {
        lightbox.classList.remove('is-open');
        setTimeout(() => lightbox.setAttribute('hidden', ''), 300);
      }
    });
  }

  /* ===== Blog Page ===== */
  function loadBlog() {
    var grid = document.getElementById('blog-grid');
    if (!grid || !siteData.blogPosts) return;
    
    grid.innerHTML = '';
    
    if (!siteData.blogPosts.length) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Keine Blog-Posts vorhanden</p>';
      return;
    }
    
    siteData.blogPosts.forEach(post => {
      var card = document.createElement('a');
      card.href = '/blog/' + post.id + '.html';
      card.className = 'blog-card';
      card.innerHTML = `
        ${post.image ? '<img class="blog-card__img" src="' + post.image + '" alt="' + post.title + '" loading="lazy">' : ''}
        <div class="blog-card__content">
          <div class="blog-card__date">${new Date(post.date).toLocaleDateString('de-DE')}</div>
          <h3 class="blog-card__title">${post.title}</h3>
          <p class="blog-card__excerpt">${post.excerpt}</p>
          <a href="/blog/${post.id}.html" class="blog-card__btn">Lesen →</a>
        </div>`;
      grid.appendChild(card);
    });
  }
})();
