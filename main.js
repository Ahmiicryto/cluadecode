(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===================== Stats count-up ===================== */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function format(value, decimals, suffix) {
    return value.toFixed(decimals) + suffix;
  }

  function countUp(el, i) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const suffix = el.dataset.suffix || "";

    if (reduceMotion) {
      el.textContent = format(target, decimals, suffix);
      return;
    }

    const duration = 1500 + i * 80;
    const startDelay = 480 + i * 90;

    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = format(target * easeOutCubic(t), decimals, suffix);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
  }

  const values = Array.from(document.querySelectorAll(".stat-value"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        countUp(entry.target, values.indexOf(entry.target));
      });
    },
    { threshold: 0.25 }
  );
  values.forEach((el) => io.observe(el));

  /* ===================== Mobile menu ===================== */
  const burger = document.querySelector(".burger");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.querySelector(".menu-overlay");

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    overlay.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }

  burger.addEventListener("click", () => {
    setMenu(burger.getAttribute("aria-expanded") !== "true");
  });

  overlay.addEventListener("click", () => setMenu(false));

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setMenu(false);
      burger.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && !menu.hidden) setMenu(false);
  });

  /* ===================== Background video ===================== */
  // Some mobile browsers ignore the autoplay attribute until play() is called.
  const video = document.querySelector(".bg-video");
  if (video) {
    const play = video.play();
    if (play && typeof play.catch === "function") play.catch(() => {});
  }
})();
