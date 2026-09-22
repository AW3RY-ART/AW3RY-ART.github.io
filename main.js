const resetPageScroll = () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

document.addEventListener('DOMContentLoaded', () => {
  resetPageScroll();
  initYear();
  initNav();
  initSmoothScrollActions();
  initDreamCarPopup();
  disableContextMenu();
});

function disableContextMenu() {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
}

window.addEventListener('load', () => {
  resetPageScroll();
  requestAnimationFrame(() => resetPageScroll());
});

function initDreamCarPopup() {
  const popup = document.querySelector('.dream-car-popup');
  const toggle = document.querySelector('.dream-car-collapsed');
  const panel = document.getElementById('dreamCarPanel');
  const closeButton = document.querySelector('.dream-car-close');

  if (!popup || !toggle || !panel) return;

  const openPopup = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.style.display = 'none';
  };

  const closePopup = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.style.display = 'flex';
  };

  const hero = document.querySelector('.page');

  const toggleVisibility = () => {
    const shouldShow = !!hero && !hero.getBoundingClientRect().top > 0 && !hero.getBoundingClientRect().bottom > window.innerHeight;
    popup.classList.toggle('is-visible', !shouldShow);
    if (shouldShow && !panel.hidden) {
      closePopup();
    }
  };

  toggle.addEventListener('click', () => {
    if (panel.hidden) {
      openPopup();
    } else {
      closePopup();
    }
  });

  closeButton?.addEventListener('click', closePopup);

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!panel.hidden && !popup.contains(target)) {
      closePopup();
    }
  });

  if ('IntersectionObserver' in window && hero) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          popup.classList.remove('is-visible');
        } else {
          popup.classList.add('is-visible');
        }
      });
    }, { threshold: 0.75 });
    observer.observe(hero);
  } else {
    window.addEventListener('scroll', toggleVisibility, { passive: true });
  }

  closePopup();
  toggleVisibility();
}

function initSmoothScrollActions() {
  const logo = document.querySelector('.logo');
  const contactLinks = document.querySelectorAll('a[href="#contact"], .intro-link, .envelope-button');

  const enableSmoothScroll = () => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.scrollBehavior = 'smooth';
    window.setTimeout(() => {
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    }, 500);
  };

  if (logo) {
    logo.addEventListener('click', (event) => {
      const href = logo.getAttribute('href');
      const isIndexPage = href === 'index.html' || href === './' || href === '';
      if (isIndexPage && (location.pathname.endsWith('/index.html') || location.pathname.endsWith('/'))) {
        event.preventDefault();
        enableSmoothScroll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  contactLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      enableSmoothScroll();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
}

function initNav() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;

  const isMobile = () => window.matchMedia('(max-width: 600px)').matches;

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    if (!isMobile()) {
      document.body.classList.remove('nav-open');
    }
  };

  const openNav = () => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    if (!isMobile()) {
      document.body.classList.add('nav-open');
    }
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = nav.classList.contains('is-open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  nav.addEventListener('click', (event) => {
    if (event.target === nav) {
      closeNav();
    }
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeNav();
    });
  });

  document.addEventListener('click', (event) => {
    const isOpen = nav.classList.contains('is-open');
    if (isOpen && !nav.contains(event.target) && !toggle.contains(event.target)) {
      closeNav();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNav();
    }
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      if (nav.classList.contains('is-open')) {
        document.body.classList.add('nav-open');
      } else {
        document.body.classList.remove('nav-open');
      }
    } else {
      document.body.classList.remove('nav-open');
    }
  });
}

