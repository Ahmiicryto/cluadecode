(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const projects = window.PROJECTS || [];
  const profile = window.PROFILE || {};
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ===================== Stats count-up ===================== */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function countUp(el, i) {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const render = (v) => (el.textContent = v.toFixed(decimals) + suffix);

    if (reduceMotion) return render(target);

    const duration = 1500 + i * 80;
    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        render(target * easeOutCubic(t));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 480 + i * 90);
  }

  const values = $$(".stat-value");
  const statsIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        statsIO.unobserve(entry.target);
        countUp(entry.target, values.indexOf(entry.target));
      });
    },
    { threshold: 0.25 }
  );
  values.forEach((el) => statsIO.observe(el));

  /* ===================== Scroll reveal ===================== */
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealIO.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  const observeReveal = (el) => revealIO.observe(el);
  $$(".reveal").forEach(observeReveal);

  /* ===================== Header: scroll-spy + hide on scroll ===================== */
  const header = $(".header");
  const navLinks = $$(".nav-link, .m-link");
  const sectionIds = ["home", "services", "work", "process", "contact"];

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((l) => {
          const on = l.getAttribute("href") === "#" + id;
          l.classList.toggle("active", on);
          if (on) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sectionIds.forEach((id) => {
    const s = document.getElementById(id);
    if (s) spy.observe(s);
  });

  let lastY = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const menuOpen = document.body.classList.contains("menu-open");
      header.classList.toggle("hide", !menuOpen && y > lastY && y > window.innerHeight * 0.6);
      lastY = y;
    },
    { passive: true }
  );

  /* ===================== Mobile menu ===================== */
  const burger = $(".burger");
  const menu = $("#mobile-menu");
  const overlay = $(".menu-overlay");

  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    overlay.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  }

  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  overlay.addEventListener("click", () => setMenu(false));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.hidden) {
      setMenu(false);
      burger.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && !menu.hidden) setMenu(false);
  });

  /* ===================== Card spotlight ===================== */
  $$(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--cx", e.clientX - r.left + "px");
      card.style.setProperty("--cy", e.clientY - r.top + "px");
    });
  });

  /* ===================== Projects (auto-fetched) ===================== */
  const CACHE_KEY = "ahmad-pf-meta-v1";
  const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function writeCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      /* storage unavailable — fine, we just refetch next time */
    }
  }

  const domainOf = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };
  const prettyName = (url) => {
    const d = domainOf(url).split(".")[0];
    return d.charAt(0).toUpperCase() + d.slice(1);
  };
  const screenshotUrl = (url) => `https://image.thum.io/get/width/1200/crop/1800/noanimate/${url}`;
  const faviconUrl = (url) => `https://www.google.com/s2/favicons?sz=64&domain=${domainOf(url)}`;

  // Title, description and og:image from the live site (free Microlink API, CORS-enabled)
  async function fetchMeta(url) {
    const cache = readCache();
    const hit = cache[url];
    if (hit && Date.now() - hit.t < CACHE_TTL) return hit.d;

    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error("meta fetch failed");
    const json = await res.json();
    if (json.status !== "success") throw new Error("meta fetch failed");

    const d = { title: json.data.title, desc: json.data.description, image: json.data.image && json.data.image.url };
    cache[url] = { t: Date.now(), d };
    writeCache(cache);
    return d;
  }

  function cardHTML(p, i) {
    const tags = (p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("");
    return `
      <article class="project reveal" data-category="${esc(p.category || "web")}" style="--d:${(i % 3) * 0.08}s">
        <a class="project-link" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Open ${esc(domainOf(p.url))}"></a>
        <div class="project-media skeleton">
          <span class="pill-dark">${esc(p.category || "web")}</span>
          ${p.result ? `<span class="pill-white">${esc(p.result)}</span>` : ""}
          <img alt="" loading="lazy" decoding="async" />
          <span class="project-arrow" aria-hidden="true">↗</span>
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

    const fallback = () => {
      media.classList.remove("skeleton");
      img.remove();
      media.insertAdjacentHTML("beforeend", `<div class="project-placeholder">${esc(domain)}</div>`);
    };

    if (!list.length) return fallback();
    img.alt = `Screenshot of ${domain}`;
    img.onload = () => {
      if (img.naturalWidth < 50) return img.onerror(); // blank/blocked screenshot
      img.classList.add("loaded");
      media.classList.remove("skeleton");
    };
    img.onerror = () => {
      n += 1;
      if (n < list.length) img.src = list[n];
      else fallback();
    };
    img.src = list[0];
  }

  async function hydrate(card, p) {
    const domain = domainOf(p.url);
    let meta = {};
    if (!p.title || !p.desc) {
      try {
        meta = await fetchMeta(p.url);
      } catch {
        meta = {};
      }
    }
    setImage(card, [p.image, screenshotUrl(p.url), meta.image], domain);

    const h = $("h3", card);
    const d = $(".project-body p", card);
    h.textContent = p.title || (meta.title ? meta.title.split(/\s[|–—-]\s/)[0] : prettyName(p.url));
    d.textContent = p.desc || meta.desc || `Project delivered for ${domain}.`;
    h.classList.remove("skeleton");
    d.classList.remove("skeleton");
  }

  function initProjects() {
    const grid = $("#projects-grid");
    if (!projects.length) {
      grid.innerHTML = `<p class="section-sub">Add your project links in <code>projects.js</code>.</p>`;
      return;
    }
    grid.innerHTML = projects.map(cardHTML).join("");
    const cards = $$(".project", grid);

    const loadIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadIO.unobserve(entry.target);
          hydrate(entry.target, projects[cards.indexOf(entry.target)]);
        });
      },
      { rootMargin: "400px" }
    );
    cards.forEach((c) => {
      loadIO.observe(c);
      observeReveal(c);
    });

    // filters
    const used = new Set(projects.map((p) => p.category));
    const filters = $$(".filter");
    filters.forEach((b) => {
      if (b.dataset.filter !== "all" && !used.has(b.dataset.filter)) {
        b.remove();
        return;
      }
      b.addEventListener("click", () => {
        filters.forEach((x) => {
          x.classList.toggle("active", x === b);
          x.setAttribute("aria-selected", String(x === b));
        });
        const f = b.dataset.filter;
        cards.forEach((c) => {
          const show = f === "all" || c.dataset.category === f;
          c.classList.toggle("hidden", !show);
          if (show) c.classList.add("in");
        });
      });
    });
  }
  initProjects();

  /* ===================== Contact ===================== */
  const wa = $("#wa-link");
  if (profile.whatsapp) {
    const msg = encodeURIComponent("Hi Ahmad, I saw your portfolio and want to discuss a project.");
    wa.href = `https://wa.me/${profile.whatsapp}?text=${msg}`;
  } else {
    wa.remove();
  }
  if (profile.email) $("#mail-link").href = `mailto:${profile.email}`;

  const icons = { linkedin: "fa-linkedin-in", github: "fa-github", upwork: "fa-upwork", fiverr: "fa-fiverr", instagram: "fa-instagram", x: "fa-x-twitter" };
  $("#socials").innerHTML = Object.entries(profile.socials || {})
    .filter(([, url]) => url)
    .map(
      ([k, url]) =>
        `<li><a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(k)}"><span><i class="fa-brands ${icons[k] || "fa-link"}"></i></span></a></li>`
    )
    .join("");
  $("#year").textContent = new Date().getFullYear();

  /* ===================== Background videos ===================== */
  $$(".bg-video").forEach((v) => {
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  });
})();
