// Portfolio interactions: scroll reveal, count-up stats, cycling hero word,
// scrollspy and header elevation. Respects prefers-reduced-motion.

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------- scroll reveal */
function initReveal() {
  const elements = document.querySelectorAll("[data-reveal]:not(.is-revealed)");
  if (!elements.length) return;

  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
          // if the animation timeline is throttled (background/hidden tab),
          // the transition may never run — stamp the final state as a fallback.
          // translate-y-* compiles to the standalone `translate` property in
          // Tailwind v4, so that's what has to be reset here, not `transform`.
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.translate = "0";
          }, 2000);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  elements.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------- count-up stats */
function animateCount(el) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;

  if (prefersReducedMotion()) {
    el.textContent = String(target);
    return;
  }

  const duration = 1400;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(2, -10 * progress); // easeOutExpo
    el.textContent = String(Math.round(target * (progress === 1 ? 1 : eased)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const counters = document.querySelectorAll(
    "[data-count]:not([data-counted])",
  );
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-counted", "true");
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  counters.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------- cycling hero word */
// swaps the accent word with a highlighter-style ink sweep behind it and a
// soft blur crossfade — plain inline text throughout, so nothing ever clips
// descenders the way a fixed-height vertical roll would.
function initWordCycle() {
  const cycle = document.querySelector("[data-word-cycle]");
  if (!cycle || cycle.dataset.cycling) return;

  let words = [];
  try {
    words = JSON.parse(cycle.dataset.words || "[]");
  } catch {
    words = [];
  }
  if (words.length < 2) return;

  const textEl = cycle.querySelector("[data-word-text]");
  const bar = cycle.querySelector("[data-word-highlight]");
  if (!textEl || !bar) return;

  cycle.dataset.cycling = "true";
  let index = 0;

  const setWidth = () => {
    cycle.style.width = `${textEl.scrollWidth}px`;
  };

  const ready = document.fonts?.ready ?? Promise.resolve();
  ready.then(setWidth);
  window.addEventListener("resize", setWidth);

  if (prefersReducedMotion()) {
    const timer = setInterval(() => {
      index = (index + 1) % words.length;
      textEl.textContent = words[index];
      setWidth();
    }, 2600);
    document.addEventListener(
      "astro:before-swap",
      () => clearInterval(timer),
      { once: true },
    );
    return;
  }

  const swap = () => {
    textEl.classList.replace("opacity-100", "opacity-0");
    textEl.classList.replace("blur-none", "blur-[6px]");
    bar.classList.replace("scale-x-100", "scale-x-0");

    setTimeout(() => {
      index = (index + 1) % words.length;
      textEl.textContent = words[index];
      setWidth();

      // next frame so the browser registers the new text before transitioning in
      requestAnimationFrame(() => {
        textEl.classList.replace("opacity-0", "opacity-100");
        textEl.classList.replace("blur-[6px]", "blur-none");
        requestAnimationFrame(() => {
          bar.classList.replace("scale-x-0", "scale-x-100");
        });
      });
    }, 260);
  };

  const timer = setInterval(swap, 2800);

  document.addEventListener(
    "astro:before-swap",
    () => {
      clearInterval(timer);
      window.removeEventListener("resize", setWidth);
    },
    { once: true },
  );
}

/* -------------------------------------------------- hero interactivity */
function initHeroInteractions() {
  const hero = document.querySelector(".hero");
  if (!hero || hero.dataset.interactive || prefersReducedMotion()) return;
  hero.dataset.interactive = "true";

  const orb = hero.querySelector(".hero-orb");
  const inner = hero.querySelector(".hero-inner");
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;

  // cursor spotlight: the orb lazily follows the mouse
  if (orb && finePointer) {
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let rafId = null;

    const glide = () => {
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      orb.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.5) {
        rafId = requestAnimationFrame(glide);
      } else {
        rafId = null;
      }
    };

    const wake = () => {
      if (rafId === null) rafId = requestAnimationFrame(glide);
    };

    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      orb.classList.add("is-tracked");
      targetX = (e.clientX - rect.width * 0.72) * 0.55;
      targetY = (e.clientY - rect.top - rect.height * 0.35) * 0.55;
      wake();
    });

    hero.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      wake();
    });
  }

  // scroll parallax: hero content drifts down and fades as you scroll away
  if (inner) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const heroHeight = hero.offsetHeight || 1;
        const y = Math.min(window.scrollY, heroHeight);
        inner.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        inner.style.opacity = String(Math.max(0, 1 - y / (heroHeight * 0.85)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // magnetic hero buttons
  if (finePointer) {
    hero.querySelectorAll(".hero-cta .btn").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) * 0.22;
        const dy = (e.clientY - rect.top - rect.height / 2) * 0.38;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }
}

/* -------------------------------------------------- scrollspy */
function initScrollspy() {
  const links = [...document.querySelectorAll(".navbar-nav .nav-link")].filter(
    (link) => (link.getAttribute("href") ?? "").startsWith("/#"),
  );
  if (!links.length) return;

  const sections = links
    .map((link) => {
      const id = link.getAttribute("href").slice(2);
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = () => {
    const fromTop = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    sections.forEach(({ link, section }) => {
      if (section.offsetTop <= fromTop) current = link;
    });
    sections.forEach(({ link }) => {
      link.classList.toggle("active", link === current);
    });
  };

  setActive();
  window.addEventListener("scroll", setActive, { passive: true });
}

/* -------------------------------------------------- header elevation */
function initHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* -------------------------------------------------- mobile menu */
function initMobileMenu() {
  const toggle = document.getElementById("nav-toggle");
  const panel = document.getElementById("mobile-menu");
  if (!toggle || !panel || panel.dataset.bound) return;
  panel.dataset.bound = "true";

  const setOpen = (open) => {
    panel.classList.toggle("is-open", open);
    panel.toggleAttribute("inert", !open);
    document.body.classList.toggle("overflow-hidden", open);
  };

  toggle.addEventListener("change", () => setOpen(toggle.checked));

  panel.querySelectorAll("[data-mobile-link]").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.checked = false;
      setOpen(false);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.checked) {
      toggle.checked = false;
      setOpen(false);
    }
  });

  setOpen(false);
}

/* -------------------------------------------------- boot */
function init() {
  initReveal();
  initCounters();
  initWordCycle();
  initHeroInteractions();
  initMobileMenu();
  initScrollspy();
  initHeader();
}

init();
document.addEventListener("astro:page-load", init);
