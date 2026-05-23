(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var canvas = document.getElementById("particles");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var particles = [];
  var count = 16;
  var w = 0;
  var h = 0;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }

  function drawPaw(x, y, size, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = "rgba(255, 255, 255, " + opacity + ")";

    var s = size;

    ctx.beginPath();
    ctx.ellipse(0, s * 0.22, s * 0.38, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    var toes = [-0.24, -0.08, 0.08, 0.24];
    for (var t = 0; t < toes.length; t++) {
      ctx.beginPath();
      ctx.arc(toes[t] * s, -s * 0.18, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function createParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 3 + 5,
      rotation: Math.random() * Math.PI * 2,
      speedY: Math.random() * 0.18 + 0.05,
      speedX: (Math.random() - 0.5) * 0.08,
      drift: (Math.random() - 0.5) * 0.002,
      opacity: Math.random() * 0.1 + 0.04,
    };
  }

  function init() {
    resize();
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y -= p.speedY;
      p.x += p.speedX;
      p.rotation += p.drift;

      if (p.y < -20) {
        p.y = h + 20;
        p.x = Math.random() * w;
        p.rotation = Math.random() * Math.PI * 2;
      }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;

      drawPaw(p.x, p.y, p.size, p.rotation, p.opacity);
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", resize);
  init();
  tick();
})();
