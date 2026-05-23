(function () {
  const glow = document.getElementById("cursor-glow");
  if (!glow) return;

  if (window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  document.addEventListener(
    "mousemove",
    function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      document.body.classList.add("is-cursor-active");
    },
    { passive: true }
  );

  document.addEventListener("mouseleave", function () {
    document.body.classList.remove("is-cursor-active");
  });

  function tick() {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;
    glow.style.transform = "translate(" + currentX + "px, " + currentY + "px)";
    requestAnimationFrame(tick);
  }

  tick();
})();
