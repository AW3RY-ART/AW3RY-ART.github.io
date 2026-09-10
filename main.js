document.addEventListener('DOMContentLoaded', () => {
  initSite();
});

function initSite() {
  initYear();
  initLoader();
  initNav();
  initSectionDots();
  initBrandBar();

  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    initReveals();
    initGalleryParallax();
  }
}

function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

function initLoader() {
  const loader = document.getElementById('loader');
  const pctEl = document.getElementById('loaderPct');
  const letters = document.querySelectorAll('.loader-letter');

  if (!loader) {
    document.documentElement.classList.remove('no-scroll');
    return;
  }

  document.documentElement.classList.add('no-scroll');

  const duration = 1200;
  const start = performance.now();

  letters.forEach((l, i) => {
    l.style.transition = `opacity .5s ease ${i * 0.06}s, transform .5s ease ${i * 0.06}s`;
    requestAnimationFrame(() => { l.style.opacity = 1; l.style.transform = 'translateY(0)'; });
  });

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    if (pctEl) pctEl.textContent = Math.round(t * 100);
    if (t < 1) requestAnimationFrame(tick);
    else finish();
  }
  requestAnimationFrame(tick);

  function finish() {
    setTimeout(() => {
      loader.style.transition = 'opacity .6s ease, visibility .6s ease';
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      document.documentElement.classList.remove('no-scroll');
      playHeroIntro();
      setTimeout(() => loader.remove(), 700);
    }, 200);
  }
}

function playHeroIntro() {
  const lines = document.querySelectorAll('.hero-title .line');
  const eyebrow = document.querySelector('.hero .eyebrow');
  const foot = document.querySelector('.hero-foot');
  if (!window.gsap) { lines.forEach(l => l.style.transform = 'none'); return; }

  gsap.set(lines, { yPercent: 110 });
  gsap.set([eyebrow, foot], { opacity: 0, y: 16 });
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6 })
    .to(lines, { yPercent: 0, duration: 1, stagger: 0.08 }, '-=0.3')
    .to(foot, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4');
}

function initNav() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  const closeBtn = document.getElementById('navClose');
  if (!toggle || !nav) return;

  const open = () => { nav.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('no-scroll'); };
  const close = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('no-scroll'); };

  toggle.addEventListener('click', () => nav.classList.contains('is-open') ? close() : open());
  if (closeBtn) closeBtn.addEventListener('click', close);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function initSectionDots() {
  const dots = [...document.querySelectorAll('.section-dots a')];
  const sections = dots.map(dot => document.getElementById(dot.dataset.section)).filter(Boolean);
  if (!dots.length || !sections.length) return;
  let frame = 0;

  const setActive = (id) => {
    dots.forEach(dot => {
      const isActive = dot.dataset.section === id;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'location' : 'false');
    });
  };

  const updateActive = () => {
    const marker = window.innerHeight * 0.42;
    const current = sections.reduce((active, section) => {
      return section.getBoundingClientRect().top <= marker ? section : active;
    }, sections[0]);
    setActive(current.id);
  };

  updateActive();
  const requestUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      updateActive();
    });
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
}

function initBrandBar() {
  const hero = document.getElementById('hero');
  const bar = document.getElementById('brandBar');
  const header = document.querySelector('.site-header');
  const mark = bar ? bar.querySelector('.marquee-track span') : null;
  if (!hero || !bar || !header || !mark) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    if (window.scrollY <= 0) {
      bar.style.height = '0px';
      bar.style.opacity = '0';
      bar.classList.remove('is-expanded');
      header.classList.remove('is-bar-touching');
      return;
    }
    const rawProgress = Math.max(0, Math.min(1, (window.scrollY / hero.offsetHeight - 0.12) / 0.88));
    const easedProgress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    const maxHeight = Math.max(0, hero.offsetHeight - header.offsetHeight);
    const height = maxHeight * easedProgress;
    bar.style.height = `${height}px`;
    bar.style.opacity = easedProgress > 0.01 ? '1' : '0';
    bar.classList.toggle('is-expanded', height > 120);
    const targetMarkBottom = hero.getBoundingClientRect().bottom - height / 2 + mark.offsetHeight / 2;
    header.classList.toggle('is-bar-touching', targetMarkBottom <= header.getBoundingClientRect().bottom + 1);
  };
  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.addEventListener('pageshow', requestUpdate);
  window.setTimeout(requestUpdate, 0);
  window.setTimeout(requestUpdate, 250);
}

function initReveals() {
  const targets = [
    '.section-eyebrow', '.section-title', '.section-sub',
    '.about-portrait', '.lede', '.about-copy p', '.about-stats',
    '.work-item', '.gallery-item', '.pull-quote-inner',
    '.equipment-item', '.contact-inner > *'
  ];
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el) => {
      el.setAttribute('data-reveal', '');
      ScrollTrigger.create({ trigger: el, start: 'top 88%', onEnter: () => el.classList.add('is-in'), once: true });
    });
  });
}

function initGalleryParallax() {
  document.querySelectorAll('.gallery-item img').forEach((img) => {
    gsap.fromTo(img, { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
