(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const profile = window.PROFILE || {};
  const projects = window.PROJECTS || [];

  /* =========================================================
     1. Interactive hero background (dot field that reacts to mouse)
     ========================================================= */
  function initHeroCanvas() {
    const hero = $(".hero");
    const canvas = $("#hero-canvas");
    const ctx = canvas.getContext("2d");
    const GAP = 30;
    const RADIUS = 170;
    let w, h, dpr, dots = [];
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          dots.push({ ox: x, oy: y, x, y, vx: 0, vy: 0 });
        }
      }
    }

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      mouse.active = true;
      hero.style.setProperty("--mx", mouse.tx + "px");
      hero.style.setProperty("--my", mouse.ty + "px");
    });
    hero.addEventListener("pointerleave", () => { mouse.active = false; });

    let t = 0;
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

    function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      t += 0.012;

      // when idle, the "mouse" drifts on its own so the hero is never static
      if (!mouse.active) {
        mouse.tx = w / 2 + Math.cos(t * 0.7) * w * 0.28;
        mouse.ty = h / 2 + Math.sin(t * 1.1) * h * 0.22;
        hero.style.setProperty("--mx", mouse.x + "px");
        hero.style.setProperty("--my", mouse.y + "px");
      }
      if (mouse.x < -999) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.x += (mouse.tx - mouse.x) * 0.15;
      mouse.y += (mouse.ty - mouse.y) * 0.15;

      ctx.clearRect(0, 0, w, h);
      const near = [];

      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS) {
          const force = (1 - dist / RADIUS) ** 2 * 6;
          d.vx += (dx / (dist || 1)) * force;
          d.vy += (dy / (dist || 1)) * force;
        }
        // spring back to origin
        d.vx += (d.ox - d.x) * 0.06;
        d.vy += (d.oy - d.y) * 0.06;
        d.vx *= 0.82;
        d.vy *= 0.82;
        d.x += d.vx;
        d.y += d.vy;

        const p = Math.max(0, 1 - dist / (RADIUS * 1.4));
        const wave = 0.5 + 0.5 * Math.sin(d.ox * 0.01 + d.oy * 0.008 + t * 2);
        const size = 1 + p * 2.2;
        if (p > 0) {
          ctx.fillStyle = `rgba(${180 - p * 56 | 0}, ${255 - p * 163 | 0}, ${90 + p * 165 | 0}, ${0.25 + p * 0.75})`;
          if (p > 0.45) near.push(d);
        } else {
          ctx.fillStyle = `rgba(255,255,255,${0.06 + wave * 0.07})`;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // thin connection lines from the cursor to the closest dots
      ctx.lineWidth = 1;
      for (const d of near) {
        const a = 1 - Math.hypot(d.x - mouse.x, d.y - mouse.y) / RADIUS;
        ctx.strokeStyle = `rgba(180,255,90,${Math.max(0, a) * 0.35})`;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
    }

    resize();
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (reduceMotion) {
      // draw one static frame
      mouse.active = true; mouse.x = mouse.tx = w / 2; mouse.y = mouse.ty = h / 2;
      frame();
    } else {
      frame();
    }
  }

  /* =========================================================
     2. Rotating hero word
     ========================================================= */
  function initRotator() {
    const el = $(".rotator-word");
    const words = ["sell more.", "load fast.", "rank on Google.", "scale with ads.", "convert better."];
    let i = 0;
    if (reduceMotion) return;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("out");
        el.classList.add("in");
        void el.offsetWidth;
        el.classList.remove("in");
      }, 450);
    }, 2600);
  }

  /* =========================================================
     3. Pill navbar: sliding indicator, scroll-spy, hide on scroll
     ========================================================= */
  function initNav() {
    const nav = $(".pill-nav");
    const indicator = $(".nav-indicator");
    const links = $$(".nav-link");
    const toggle = $(".nav-toggle");

    function moveIndicator(link) {
      if (!link) return;
      indicator.style.width = link.offsetWidth + "px";
      indicator.style.transform = `translateX(${link.offsetLeft}px)`;
    }
    function setActive(id) {
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + id));
      moveIndicator($(".nav-link.active"));
    }

    links.forEach((l) => {
      l.addEventListener("mouseenter", () => moveIndicator(l));
      l.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    $(".nav-links").addEventListener("mouseleave", () => moveIndicator($(".nav-link.active")));
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    const sections = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));

    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      nav.classList.toggle("scrolled", y > 40);
      nav.classList.toggle("hidden", y > lastY && y > 400 && !nav.classList.contains("open"));
      lastY = y;
    }, { passive: true });

    addEventListener("resize", () => moveIndicator($(".nav-link.active")));
    document.fonts?.ready.then(() => moveIndicator($(".nav-link.active")));
    moveIndicator($(".nav-link.active"));
  }

  /* =========================================================
     4. Projects — automatic data fetching from the live URL
     ========================================================= */
  const CACHE_KEY = "pf-meta-v1";
  const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
  }
  function writeCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* storage unavailable */ }
  }

  const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
  const prettyName = (url) => {
    const d = domainOf(url).split(".")[0];
    return d.charAt(0).toUpperCase() + d.slice(1);
  };
  const screenshotUrl = (url) => `https://image.thum.io/get/width/1200/crop/1800/noanimate/${url}`;
  const faviconUrl = (url) => `https://www.google.com/s2/favicons?sz=64&domain=${domainOf(url)}`;
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Fetches title, description and og:image for a URL (free Microlink API, CORS-enabled)
  async function fetchMeta(url) {
    const cache = readCache();
    const hit = cache[url];
    if (hit && Date.now() - hit.t < CACHE_TTL) return hit.d;
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("meta fetch failed");
    const json = await res.json();
    if (json.status !== "success") throw new Error("meta fetch failed");
    const d = {
      title: json.data.title,
      desc: json.data.description,
      image: json.data.image?.url,
      logo: json.data.logo?.url,
    };
    cache[url] = { t: Date.now(), d };
    writeCache(cache);
    return d;
  }

  function cardTemplate(p, i) {
    const tags = (p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("");
    return `
      <article class="project reveal" data-category="${esc(p.category || "web")}" style="transition-delay:${(i % 3) * 80}ms">
        <a class="project-stretch" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(domainOf(p.url))}"></a>
        <div class="project-media skeleton">
          <span class="project-badge">${esc(p.category || "web")}</span>
          ${p.result ? `<span class="project-result">${esc(p.result)}</span>` : ""}
          <img alt="" loading="lazy" decoding="async" />
          <span class="project-link" aria-hidden="true">↗</span>
        </div>
        <div class="project-body">
          <div class="project-domain"><img src="${faviconUrl(p.url)}" alt="" loading="lazy" />${esc(domainOf(p.url))}</div>
          <h3 class="skeleton">${esc(p.title || "Loading project")}</h3>
          <p class="skeleton">${esc(p.desc || "Fetching project details from the live website…")}</p>
          ${tags ? `<ul class="chips">${tags}</ul>` : ""}
        </div>
      </article>`;
  }

  function setImage(card, sources, domain) {
    const media = $(".project-media", card);
    const img = $(".project-media > img", card);
    const list = sources.filter(Boolean);
    let n = 0;
    img.alt = `Screenshot of ${domain}`;
    img.onload = () => {
      // thum.io returns a tiny image while generating/when blocked — treat as failure
      if (img.naturalWidth < 50) return img.onerror();
      img.classList.add("loaded");
      media.classList.remove("skeleton");
    };
    img.onerror = () => {
      n++;
      if (n < list.length) img.src = list[n];
      else { // final fallback: branded gradient placeholder
        media.classList.remove("skeleton");
        img.remove();
        media.style.background = `linear-gradient(135deg, #7c5cff55, #b4ff5a33), #111`;
        media.insertAdjacentHTML("beforeend", `<div style="position:absolute;inset:0;display:grid;place-items:center;font:700 1.6rem 'Space Grotesk';">${esc(domain)}</div>`);
      }
    };
    img.src = list[0];
  }

  function fillText(card, title, desc) {
    const h = $("h3", card), p = $(".project-body p", card);
    h.textContent = title;
    p.textContent = desc;
    h.classList.remove("skeleton");
    p.classList.remove("skeleton");
  }

  async function hydrate(card, p) {
    const domain = domainOf(p.url);
    // Live screenshot is the main visual; og:image is the fallback
    let meta = {};
    const needMeta = !p.title || !p.desc || !p.image;
    if (needMeta) {
      try { meta = await fetchMeta(p.url); } catch { meta = {}; }
    }
    setImage(card, [p.image, screenshotUrl(p.url), meta.image], domain);
    fillText(
      card,
      p.title || (meta.title ? meta.title.split(/\s[|–—-]\s/)[0] : prettyName(p.url)),
      p.desc || meta.desc || `Project delivered for ${domain}.`
    );
  }

  function initProjects() {
    const grid = $("#projects-grid");
    if (!projects.length) {
      grid.innerHTML = `<p style="color:var(--muted);text-align:center;grid-column:1/-1">Add your project links in <code>projects.js</code>.</p>`;
      return;
    }
    grid.innerHTML = projects.map(cardTemplate).join("");
    const cards = $$(".project", grid);

    // fetch data only when the card scrolls near the viewport
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        hydrate(e.target, projects[cards.indexOf(e.target)]);
      });
    }, { rootMargin: "300px" });
    cards.forEach((c) => io.observe(c));
    cards.forEach(observeReveal);
  }

  /* =========================================================
     5. Filter pills with sliding indicator
     ========================================================= */
  function initFilters() {
    const wrap = $(".filter-pills");
    const ind = $(".filter-indicator");
    const btns = $$(".filter", wrap);
    const move = (b) => {
      ind.style.width = b.offsetWidth + "px";
      ind.style.transform = `translateX(${b.offsetLeft}px)`;
    };
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", String(x === b)); });
      move(b);
      const f = b.dataset.filter;
      $$(".project").forEach((card) => {
        card.classList.toggle("hide", f !== "all" && card.dataset.category !== f);
      });
    }));
    // hide filter pills for categories with no projects
    const used = new Set(projects.map((p) => p.category));
    btns.forEach((b) => { if (b.dataset.filter !== "all" && !used.has(b.dataset.filter)) b.remove(); });
    const sync = () => move($(".filter.active", wrap));
    addEventListener("resize", sync);
    document.fonts?.ready.then(sync);
    sync();
  }

  /* =========================================================
     6. Micro-interactions: reveal, tilt cards, magnetic buttons, cursor
     ========================================================= */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  function observeReveal(el) { revealIO.observe(el); }

  function initInteractions() {
    $$(".reveal").forEach(observeReveal);

    // counters
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const end = +e.target.dataset.count;
        const start = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - start) / 1400);
          e.target.textContent = Math.round(end * (1 - (1 - k) ** 3));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    });
    $$("[data-count]").forEach((el) => countIO.observe(el));

    if (!finePointer || reduceMotion) return;

    // 3D tilt + glow following the cursor
    $$(".tilt, .contact-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty("--cx", x + "px");
        card.style.setProperty("--cy", y + "px");
        if (card.classList.contains("tilt")) {
          const rx = ((y / r.height) - 0.5) * -6;
          const ry = ((x / r.width) - 0.5) * 6;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    // magnetic buttons
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        b.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });

    // custom cursor
    const dot = $(".cursor-dot"), ring = $(".cursor-ring");
    let rx = 0, ry = 0, mx = 0, my = 0;
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add("has-cursor");
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    document.addEventListener("pointerleave", () => document.body.classList.remove("has-cursor"));
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      ring.classList.toggle("hover", !!e.target.closest("a, button, .project"));
    });
  }

  /* =========================================================
     7. Contact links from PROFILE
     ========================================================= */
  function initContact() {
    if (profile.whatsapp) {
      const msg = encodeURIComponent("Hi Ahmad, I saw your portfolio and want to discuss a project.");
      $("#wa-link").href = `https://wa.me/${profile.whatsapp}?text=${msg}`;
    } else $("#wa-link").remove();
    if (profile.email) $("#mail-link").href = `mailto:${profile.email}`;
    const s = profile.socials || {};
    $("#socials").innerHTML = Object.entries(s)
      .filter(([, v]) => v)
      .map(([k, v]) => `<li><a href="${esc(v)}" target="_blank" rel="noopener">${esc(k.charAt(0).toUpperCase() + k.slice(1))}</a></li>`)
      .join("");
    $("#year").textContent = new Date().getFullYear();
    $("#location").textContent = profile.location || "Pakistan";
  }

  initHeroCanvas();
  initRotator();
  initNav();
  initProjects();
  initFilters();
  initInteractions();
  initContact();
})();
