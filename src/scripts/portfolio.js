// Portfolio interactions: scroll reveal, count-up stats, Aceternity 3D flip words,
// Aceternity timeline tracing beam, spotlight cards, and header elevation.
// Respects prefers-reduced-motion.

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

  // Immediately reveal elements that are already within the viewport on load
  const innerHeight =
    window.innerHeight || document.documentElement.clientHeight;
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) {
      el.classList.add("is-revealed");
    }
  });

  const remaining = document.querySelectorAll(
    "[data-reveal]:not(.is-revealed)",
  );
  if (!remaining.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.translate = "0";
          }, 800);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
  );

  remaining.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------- count-up stats */
function animateCount(el) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;

  if (prefersReducedMotion()) {
    el.textContent = String(target);
    return;
  }

  const duration = 1200;
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
    { threshold: 0.4 },
  );

  counters.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------- Aceternity Encrypted Text / Interactive Word Morph */
function initScrambleWord() {
  const container = document.querySelector("[data-scramble-word]");
  if (!container || container.dataset.scrambleBound) return;
  container.dataset.scrambleBound = "true";

  const textEl = container.querySelector("[data-scramble-text]");
  if (!textEl) return;

  let words = [];
  try {
    words = JSON.parse(container.dataset.words || "[]");
  } catch {
    words = [];
  }
  if (!words.length) {
    words = [
      container.dataset.scrambleWord || textEl.textContent.trim() || "elegant",
    ];
  }

  let currentIndex = 0;
  const chars = "!<>-_\\/[]{}~=+*^?#0123456789";
  let frame = 0;
  let rafId = null;
  let isRunning = false;

  const transitionToWord = (targetWord) => {
    if (prefersReducedMotion()) {
      textEl.textContent = targetWord;
      return;
    }
    isRunning = true;
    frame = 0;
    const totalFrames = 18;
    const fromWord = textEl.textContent.trim();
    const maxLen = Math.max(fromWord.length, targetWord.length);

    const update = () => {
      frame++;
      const progress = frame / totalFrames;
      let output = "";

      for (let i = 0; i < maxLen; i++) {
        if (i < targetWord.length && progress > (i + 1) / (targetWord.length + 1)) {
          output += targetWord[i];
        } else if (i < targetWord.length || i < fromWord.length) {
          output += chars[Math.floor(Math.random() * chars.length)];
        }
      }

      textEl.textContent = output;

      if (frame < totalFrames) {
        rafId = requestAnimationFrame(update);
      } else {
        textEl.textContent = targetWord;
        isRunning = false;
      }
    };

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  };

  const advance = () => {
    if (isRunning) return;
    currentIndex = (currentIndex + 1) % words.length;
    transitionToWord(words[currentIndex]);
  };

  container.addEventListener("mouseenter", advance);
  container.addEventListener("click", advance);
}

/* -------------------------------------------------- spotlight cards */
function initSpotlightCards() {
  const cards = document.querySelectorAll("[data-spotlight]");
  if (!cards.length) return;

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  if (!finePointer || prefersReducedMotion()) return;

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

/* -------------------------------------------------- copy button */
function initCopyButtons() {
  const buttons = document.querySelectorAll("[data-copy-text]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copyText;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.innerHTML;
        btn.innerHTML = `<span class="inline-flex items-center gap-1 text-emerald-500 font-semibold"><span>✓</span><span>Copied!</span></span>`;
        setTimeout(() => {
          btn.innerHTML = original;
        }, 2200);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    });
  });
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

  // cursor spotlight: ambient background tracks mouse gently
  if (orb && finePointer) {
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let rafId = null;

    const glide = () => {
      x += (targetX - x) * 0.05;
      y += (targetY - y) * 0.05;
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
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      hero.style.setProperty("--hero-mouse-x", `${mouseX}px`);
      hero.style.setProperty("--hero-mouse-y", `${mouseY}px`);
      orb.classList.add("is-tracked");
      targetX = (e.clientX - rect.width * 0.7) * 0.4;
      targetY = (e.clientY - rect.top - rect.height * 0.3) * 0.4;
      wake();
    });

    hero.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      wake();
    });
  }

  // scroll parallax: subtle fade
  if (inner) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const heroHeight = hero.offsetHeight || 1;
        const y = Math.min(window.scrollY, heroHeight);
        inner.style.opacity = String(Math.max(0, 1 - y / (heroHeight * 0.95)));
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
        const dx = (e.clientX - rect.left - rect.width / 2) * 0.18;
        const dy = (e.clientY - rect.top - rect.height / 2) * 0.28;
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
  initScrambleWord();
  initSpotlightCards();
  initCopyButtons();
  initHeroInteractions();
  initMobileMenu();
  initScrollspy();
  initHeader();
}

init();
document.addEventListener("astro:page-load", init);
