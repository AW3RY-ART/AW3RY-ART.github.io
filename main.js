/* ==========================================================================
   AW3RY — main.js
   Modular sections: loader, cursor, nav, scroll reveals, parallax, marquee
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initLoader();
  initCursor();
  initNav();
  initToTop();
  initScrollIris();
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    initHeroParallax();
    initReveals();
    initGalleryParallax();
  }
});

/* -------------------------------------------------------------------- */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* -------------------------------------------------------------------- */
/* Loader: animated iris + percentage counter + letter reveal            */
/* -------------------------------------------------------------------- */
function initLoader() {
  const loader = document.getElementById('loader');
  const pctEl = document.getElementById('loaderPct');
  const letters = document.querySelectorAll('.loader-letter');
  const blades = document.querySelectorAll('.blade');
  document.documentElement.classList.add('no-scroll');

  let pct = 0;
  const duration = 1400; // ms
  const start = performance.now();

  letters.forEach((l, i) => {
    l.style.transition = `opacity .5s ease ${i * 0.06}s, transform .5s ease ${i * 0.06}s`;
    requestAnimationFrame(() => {
      l.style.opacity = 1;
      l.style.transform = 'translateY(0)';
    });
  });

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    pct = Math.round(t * 100);
    if (pctEl) pctEl.textContent = pct;

    // close iris blades progressively (rotate inward)
    blades.forEach((b, i) => {
      const delay = i * 0.02;
      const localT = Math.min(1, Math.max(0, (t - delay) / (1 - delay)));
      b.style.transform = `rotate(${localT * 34}deg) scale(${1 - localT * 0.08})`;
    });

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      finishLoader();
    }
  }
  requestAnimationFrame(tick);

  function finishLoader() {
    setTimeout(() => {
      loader.style.transition = 'opacity .7s ease, visibility .7s ease';
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      document.documentElement.classList.remove('no-scroll');
      playHeroIntro();
      setTimeout(() => loader.remove(), 800);
    }, 250);
  }
}

/* -------------------------------------------------------------------- */
/* Hero entrance sequence                                                */
/* -------------------------------------------------------------------- */
function playHeroIntro() {
  const lines = document.querySelectorAll('.hero-title .line');
  const eyebrow = document.querySelector('.hero .eyebrow');
  const foot = document.querySelector('.hero-foot');

  if (!window.gsap) {
    lines.forEach(l => l.style.transform = 'none');
    return;
  }

  gsap.set(lines, { yPercent: 110 });
  gsap.set([eyebrow, foot], { opacity: 0, y: 16 });

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.7 })
    .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.09 }, '-=0.35')
    .to(foot, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5');
}

/* -------------------------------------------------------------------- */
/* Custom cursor                                                         */
/* -------------------------------------------------------------------- */
function initCursor() {
  const ring = document.querySelector('.cursor-ring');
  const dot = document.querySelector('.cursor-dot');
  const cursor = document.querySelector('.cursor');
  if (!ring || !dot || window.matchMedia('(max-width: 860px)').matches) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  function raf() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  const hoverables = document.querySelectorAll('a, button, .gallery-item, .work-item');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  });
}

/* -------------------------------------------------------------------- */
/* Nav: fullscreen menu toggle + smooth close on link click              */
/* -------------------------------------------------------------------- */
function initNav() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  const open = () => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('no-scroll');
  };
  const close = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('no-scroll');
  };

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? close() : open();
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* -------------------------------------------------------------------- */
/* Back to top                                                           */
/* -------------------------------------------------------------------- */
function initToTop() {
  const btn = document.getElementById('toTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* -------------------------------------------------------------------- */
/* Scroll progress iris (signature element, reused from loader)          */
/* -------------------------------------------------------------------- */
function initScrollIris() {
  const wrap = document.querySelector('.scroll-iris');
  const fill = document.querySelector('.scroll-iris-fill');
  if (!wrap || !fill) return;

  const circumference = 2 * Math.PI * 26;
  fill.style.strokeDasharray = circumference;
  fill.style.strokeDashoffset = circumference;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? scrollTop / max : 0;

    fill.style.strokeDashoffset = String(circumference * (1 - progress));
    wrap.classList.toggle('is-visible', scrollTop > window.innerHeight * 0.6);
  }, { passive: true });
}

/* -------------------------------------------------------------------- */
/* Hero parallax (image drifts slower than scroll)                       */
/* -------------------------------------------------------------------- */
function initHeroParallax() {
  const img = document.getElementById('heroImg');
  if (!img) return;

  gsap.to(img, {
    yPercent: 14,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  const cameraImg = document.querySelector('.camera-bg img');
  if (cameraImg) {
    gsap.to(cameraImg, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.camera',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}

/* -------------------------------------------------------------------- */
/* Scroll-triggered reveals for headings / copy / cards                  */
/* -------------------------------------------------------------------- */
function initReveals() {
  const targets = [
    '.section-eyebrow', '.section-title', '.section-sub',
    '.about-portrait', '.lede', '.about-copy p', '.about-stats',
    '.work-item', '.gallery-item',
    '.split-media', '.split-copy',
    '.camera-content > *',
    '.equipment-item',
    '.contact-inner > *'
  ];

  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.setAttribute('data-reveal', '');
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => el.classList.add('is-in'),
        once: true
      });
    });
  });
}

/* -------------------------------------------------------------------- */
/* Gallery: subtle staggered lift on scroll into view                    */
/* -------------------------------------------------------------------- */
function initGalleryParallax() {
  document.querySelectorAll('.gallery-item img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.12 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });
}
