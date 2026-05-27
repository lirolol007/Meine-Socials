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

  /* ===== Cursor Glow ===== */
  if (window.matchMedia("(pointer: fine)").matches) {
    var cursorGlow = document.createElement('div');
    cursorGlow.className = 'cursor-glow';
    document.body.appendChild(cursorGlow);
    
    var cx = 0, cy = 0, tx = 0, ty = 0;
    
    document.addEventListener('mousemove', function(e) {
      tx = e.clientX;
      ty = e.clientY;
      cursorGlow.classList.add('active');
    });
    
    document.addEventListener('mouseleave', function() {
      cursorGlow.classList.remove('active');
    });
    
    function updateGlow() {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursorGlow.style.transform = 'translate(' + (cx - 20) + 'px, ' + (cy - 20) + 'px)';
      requestAnimationFrame(updateGlow);
    }
    updateGlow();
  }

  /* ===== Particles ===== */
  var canvas = document.getElementById('particles');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    var particles = [];
    
    function Particle() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.speedY = Math.random() * 0.5 - 0.25;
      this.opacity = Math.random() * 0.5 + 0.2;
    }
    
    Particle.prototype.draw = function() {
      ctx.fillStyle = 'rgba(239, 68, 68, ' + this.opacity + ')';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    };
    
    Particle.prototype.update = function() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    };
    
    for (var i = 0; i < 50; i++) {
      particles.push(new Particle());
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (var i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
    animate();
  }

  /* ===== E-Mail obfuskieren ===== */
  var emailLink = document.getElementById('contact-email');
  if (emailLink) {
    var user = 'Liro.lol007';
    var domain = 'gmail.com';
    var address = user + '@' + domain;
    emailLink.href = 'mailto:' + address;
    emailLink.textContent = address;
  }

  /* ===== Load Data ===== */
  var siteData = null;
  fetch('site-data.json?t=' + Date.now())
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d) return;
      siteData = d;
      loadHomeData();
    })
    .catch(e => console.log('site-data.json nicht geladen'));

  function loadHomeData() {
    // Profile
    var nameEl = document.querySelector('.name');
    if (nameEl) nameEl.textContent = siteData.name || '';

    var badgeEl = document.querySelector('.badge');
    if (badgeEl) badgeEl.textContent = siteData.badge || '';

    var tagsEl = document.querySelector('.tags');
    if (tagsEl && siteData.tags && siteData.tags.length) {
      tagsEl.innerHTML = siteData.tags.map(t => '<span class="tag">' + t + '</span>').join('');
    }

    var cpEl = document.querySelector('.catchphrase');
    if (cpEl) cpEl.textContent = siteData.catchphrase || '';

    var bioEl = document.querySelector('.bio');
    if (bioEl) bioEl.innerHTML = (siteData.bio || '') + '<br>Willkommen :3';

    // Links
    if (siteData.links) {
      Object.keys(siteData.links).forEach(brand => {
        var link = siteData.links[brand];
        var el = document.querySelector('[data-brand="' + brand + '"]');
        if (!el) return;
        var labelEl = el.querySelector('.link__label');
        if (labelEl) labelEl.textContent = link.label || '';
        var hintEl = el.querySelector('.link__hint');
        if (hintEl) {
          if (link.hint) { hintEl.textContent = link.hint; hintEl.style.display = ''; }
          else hintEl.style.display = 'none';
        }
      });
    }

    // Modals
    loadAboutModal();
    loadCollabsModal();
  }

  function loadAboutModal() {
    var contentEl = document.getElementById('modal-about-content');
    if (!contentEl || !siteData.pages.about) return;
    contentEl.innerHTML = siteData.pages.about.content;
  }

  function loadCollabsModal() {
    var list = document.getElementById('collab-list');
    if (!list || !siteData.collabs) return;
    
    list.innerHTML = '';
    siteData.collabs.forEach(c => {
      var initial = c.name.charAt(0).toUpperCase();
      var tiktokHandle = c.url.includes('@') ? c.url.split('@')[1].split('?')[0] : '';
      var li = document.createElement('li');
      li.className = 'collab-card';
      li.innerHTML = `
        <div class="collab-card__avatar-wrap">
          <img class="collab-card__avatar" src="collabs/${c.name.toLowerCase()}.jpg" 
               data-fallback="https://unavatar.io/tiktok/${tiktokHandle}" 
               alt="${c.name}" width="44" height="44">
          <span class="collab-card__initials" aria-hidden="true">${initial}</span>
        </div>
        <div class="collab-card__info">
          <span class="collab-card__name">${c.name}</span>
          <a class="collab-card__btn" href="${c.url}" target="_blank" rel="noopener noreferrer">Zum Kanal</a>
        </div>`;
      list.appendChild(li);
    });

    // Avatar Fallback
    list.querySelectorAll('.collab-card__avatar[data-fallback]').forEach(img => {
      img.addEventListener('error', function() {
        if (img.dataset.tried) { img.classList.add('is-broken'); return; }
        img.dataset.tried = '1';
        img.src = img.getAttribute('data-fallback');
      });
    });
  }

  /* ===== Modals ===== */
  var modals = document.querySelectorAll('.modal');
  var openButtons = document.querySelectorAll('[data-modal-open]');
  var closeButtons = document.querySelectorAll('[data-modal-close]');

  openButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      var id = btn.getAttribute('data-modal-open');
      var modal = document.getElementById('modal-' + id);
      if (!modal) return;
      modal.removeAttribute('hidden');
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeAllModals() {
    modals.forEach(m => {
      m.classList.remove('is-open');
      setTimeout(() => m.setAttribute('hidden', ''), 300);
    });
    document.body.style.overflow = '';
  }

  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  modals.forEach(m => {
    m.querySelector('.modal__backdrop').addEventListener('click', closeAllModals);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
})();
