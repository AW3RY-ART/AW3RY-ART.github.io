const AW3RY_PASSWORDS = ['AW3RY545746', 'aw3ry', 'AW3RY2026'];

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initGate();
});

function initGate() {
  const gate = document.getElementById('gate');
  const form = document.getElementById('gateForm');
  const input = document.getElementById('gatePw');
  const error = document.getElementById('gateError');

  let unlocked = false;
  try { unlocked = localStorage.getItem('aw3ry-unlocked') === 'true'; } catch (e) {}

  if (unlocked) {
    gate.classList.add('is-hidden');
    initSite();
    return;
  }

  document.documentElement.classList.add('no-scroll');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = input.value.trim();
    const isValid = AW3RY_PASSWORDS.some((password) => entered.toLowerCase() === password.toLowerCase());
    if (isValid) {
      try { localStorage.setItem('aw3ry-unlocked', 'true'); } catch (e) {}
      gate.style.transition = 'opacity .5s ease';
      gate.style.opacity = '0';
      setTimeout(() => {
        gate.classList.add('is-hidden');
        document.documentElement.classList.remove('no-scroll');
        initSite();
      }, 500);
    } else {
      error.classList.add('is-shown');
      input.focus();
      input.select();
    }
  });
}

function initSite() {
  initYear();
  initTheme();
  initLoader();
  initNav();
  initComingSoon();
  initScrollIris();
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    initHeroParallax();
    initReveals();
    initGalleryParallax();
  }
}

function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const apply = (dark) => {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    btn.textContent = dark ? '☀' : '☾';
  };
  apply(document.documentElement.getAttribute('data-theme') === 'dark');
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    apply(!isDark);
    try { localStorage.setItem('aw3ry-theme', !isDark ? 'dark' : 'light'); } catch (e) {}
  });
}

function initLoader() {
  const loader = document.getElementById('loader');
  const pctEl = document.getElementById('loaderPct');
  const letters = document.querySelectorAll('.loader-letter');
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

function initCursor() {
  const ring = document.querySelector('.cursor-ring');
  const dot = document.querySelector('.cursor-dot');
  const cursor = document.querySelector('.cursor');
  if (!ring || !dot || window.matchMedia('(max-width: 860px)').matches) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  function raf() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.querySelectorAll('a, button, .gallery-item, .work-item').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
  });
}

function initNav() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  const closeBtn = document.getElementById('navClose');
  const logoutBtn = document.getElementById('navLogout');
  if (!toggle || !nav) return;

  const open = () => { nav.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('no-scroll'); };
  const close = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('no-scroll'); };

  toggle.addEventListener('click', () => nav.classList.contains('is-open') ? close() : open());
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try { localStorage.removeItem('aw3ry-unlocked'); } catch (e) {}
      window.location.reload();
    });
  }
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function initComingSoon() {
  let toast;
  document.querySelectorAll('.js-soon').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const label = link.dataset.soon || 'This';
      if (toast) toast.remove();
      toast = document.createElement('div');
      toast.className = 'soon-toast';
      toast.textContent = `${label} — coming soon`;
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('is-in'));
      setTimeout(() => { toast.classList.remove('is-in'); setTimeout(() => toast.remove(), 400); }, 2200);
    });
  });
}

function initScrollIris() {
  const wrap = document.getElementById('scrollIris');
  const fill = document.querySelector('.scroll-iris-fill');
  const controls = document.querySelectorAll('.nav-logout, .scroll-iris');
  if (!wrap || !fill) return;
  const circumference = 2 * Math.PI * 26;
  fill.style.strokeDasharray = circumference;
  fill.style.strokeDashoffset = circumference;

  const updateFloatingControls = () => {
    const scrollTop = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? scrollTop / max : 0;
    const isNearBottom = progress >= 0.995;
    const raise = isNearBottom ? -72 : 0;

    controls.forEach((el) => {
      el.style.transform = `translateY(${raise}px)`;
    });

    fill.style.strokeDashoffset = String(circumference * (1 - progress));
    wrap.classList.toggle('is-visible', scrollTop > window.innerHeight * 0.6);
    wrap.classList.toggle('is-bottom', progress > 0.985);
  };

  updateFloatingControls();
  wrap.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', updateFloatingControls, { passive: true });
  window.addEventListener('resize', updateFloatingControls);
}

function initHeroParallax() {
  const img = document.getElementById('heroImg');
  if (!img) return;
  gsap.to(img, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
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
