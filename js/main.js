const resetPageScroll = () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const hash = window.location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target) {
      return;
    }
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

function initHashNavigation() {
  const hash = window.location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  resetPageScroll();
  initHashNavigation();
  initYear();
  initNav();
  initSmoothScrollActions();
  initWheelSmoothing();
  initAboutTextReveal();
  initAboutTitleScrollReveal();
  initAboutCopyScrollReveal();
  initFutureTransition();
  initGalleryProjectLoop();
  initCursorGlow();
  initGoalCardMagnets();
  disableContextMenu();
});

function disableContextMenu() {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
}

function initGalleryProjectLoop() {
  const showcase = document.querySelector('.project-showcase');
  const stickyContent = showcase?.querySelector('.project-showcase-sticky');
  const listWindow = showcase?.querySelector('.project-list-window');
  const track = showcase?.querySelector('.project-title-track');
  const accessibleList = showcase?.querySelector('.visually-hidden');
  const albums = window.galleryData?.albums;
  if (!showcase || !stickyContent || !listWindow || !track || !accessibleList) return;
  if (!Array.isArray(albums) || albums.length === 0) {
    console.error('Gallery project list could not load: gallery data has no albums.');
    return;
  }

  const titles = albums
    .map((album) => album.title || album.name)
    .filter((title) => typeof title === 'string' && title.trim());
  if (!titles.includes('Bring The Nine')) titles.push('Bring The Nine');
  if (titles.length === 0) {
    console.error('Gallery project list could not load: albums have no titles.');
    return;
  }
  track.replaceChildren();
  accessibleList.replaceChildren();

  titles.forEach((title) => {
    const item = document.createElement('li');
    item.textContent = title;
    accessibleList.append(item);
  });

  const firstGroup = document.createElement('div');
  firstGroup.className = 'project-title-group';
  titles.forEach((title) => {
    const item = document.createElement('span');
    item.className = 'project-title';
    item.textContent = title;
    firstGroup.append(item);
  });
  track.append(firstGroup);

  let initialTrackOffset = 0;
  let rowHeight = 1;
  let maxTrackOffset = 0;
  let sectionDocumentTop = showcase.getBoundingClientRect().top + window.scrollY;
  let animationFrame = null;

  const getScrollDistance = () => Math.max(1, showcase.offsetHeight - stickyContent.offsetHeight);
  const buildTrack = () => {
    const sourceGroup = track.firstElementChild;
    const groupHeight = sourceGroup?.getBoundingClientRect().height;
    const firstTitle = sourceGroup?.querySelector('.project-title');
    if (!sourceGroup || !groupHeight || !firstTitle) return false;

    rowHeight = Number.parseFloat(getComputedStyle(firstTitle).lineHeight) || firstTitle.getBoundingClientRect().height || 1;
    const leadingGroupCount = Math.ceil(listWindow.offsetHeight / groupHeight) + 1;
    initialTrackOffset = leadingGroupCount * groupHeight + rowHeight / 2 - listWindow.offsetHeight / 2;
    for (let index = 0; index < leadingGroupCount; index += 1) {
      track.prepend(sourceGroup.cloneNode(true));
    }

    const requiredHeight = initialTrackOffset + getScrollDistance() + listWindow.offsetHeight;
    while (track.scrollHeight < requiredHeight) {
      track.append(sourceGroup.cloneNode(true));
    }
    maxTrackOffset = Math.min(getScrollDistance(), track.scrollHeight - listWindow.clientHeight - initialTrackOffset);
    return true;
  };

  const updateList = () => {
    animationFrame = null;
    const progress = Math.min(1, Math.max(0, (window.scrollY - sectionDocumentTop) / getScrollDistance()));
    const trackOffset = initialTrackOffset + maxTrackOffset * progress;
    const windowBounds = listWindow.getBoundingClientRect();
    const centerY = windowBounds.top + windowBounds.height / 2;

    track.style.transform = `translate3d(0, ${-trackOffset.toFixed(2)}px, 0)`;
    track.querySelectorAll('.project-title').forEach((title) => {
      const bounds = title.getBoundingClientRect();
      const distance = Math.abs(bounds.top + bounds.height / 2 - centerY);
      const weight = Math.max(0, Math.min(1, 1 - distance / rowHeight));
      const edgeRatio = Math.min(1, distance / (windowBounds.height * .5));
      const scaleProgress = Math.log1p(9 * edgeRatio) / Math.log(10);
      const scale = 1 - scaleProgress * .1;
      const blur = Math.max(0, (edgeRatio - .55) / .45) * 4;
      title.style.setProperty('--project-title-weight', `${(weight * 100).toFixed(1)}%`);
      title.style.setProperty('--project-title-scale', scale.toFixed(3));
      title.style.setProperty('--project-title-blur', `${blur.toFixed(2)}px`);
    });
  };

  const openGalleryFilter = (title) => {
    const album = albums.find((item) => (item.title || item.name) === title);
    const filter = album
      ? String(album.name || album.title).toLowerCase().trim().replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '')
      : title.toLowerCase().trim().replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '');
    window.location.href = `gallery.html?filter=${encodeURIComponent(filter)}`;
  };

  track.addEventListener('click', (event) => {
    const title = event.target.closest('.project-title');
    if (title) openGalleryFilter(title.textContent.trim());
  });

  const scheduleUpdate = () => {
    if (animationFrame === null) animationFrame = window.requestAnimationFrame(updateList);
  };

  const rebuildTrack = () => {
    const sourceGroup = track.firstElementChild.cloneNode(true);
    sourceGroup.querySelectorAll('.project-title').forEach((title) => {
      title.classList.remove('is-active');
      title.style.removeProperty('--project-title-weight');
      title.style.removeProperty('--project-title-scale');
      title.style.removeProperty('--project-title-blur');
    });
    track.replaceChildren(sourceGroup);
    buildTrack();
    scheduleUpdate();
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', () => {
    const sectionTop = showcase.getBoundingClientRect().top + window.scrollY;
    sectionDocumentTop = sectionTop;
    rebuildTrack();
  });
  buildTrack();
  scheduleUpdate();
}

function initAboutTextReveal() {
  const about = document.querySelector('#about.about');
  if (!about) return;

  const textItems = about.querySelectorAll('.about-portrait img');
  if (!textItems.length) return;

  about.classList.add('has-about-text-reveal');
  textItems.forEach((item, index) => {
    item.classList.add('about-text-reveal');
    item.style.setProperty('--about-reveal-delay', `${index * 180}ms`);
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    textItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  textItems.forEach((item) => observer.observe(item));
}

function initAboutTitleScrollReveal() {
  const about = document.querySelector('#about.about');
  const title = about?.querySelector('.section-title');
  const titleLines = title?.querySelectorAll('.about-title-line');
  if (!about || !title || !titleLines?.length) return;

  about.classList.add('has-about-title-scroll-reveal');
  const words = [];
  titleLines.forEach((line) => {
    const lineWords = line.textContent.trim().split(/\s+/);
    line.replaceChildren();
    lineWords.forEach((word, index) => {
      const mask = document.createElement('span');
      const inner = document.createElement('span');
      mask.className = 'about-title-word';
      inner.className = 'about-title-word-inner';
      inner.textContent = word;
      mask.append(inner);
      line.append(mask);
      if (index < lineWords.length - 1) line.append(document.createTextNode(' '));
      words.push(inner);
    });
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    words.forEach((word) => word.style.setProperty('--about-title-progress', '0%'));
    return;
  }

  let animationFrame = null;
  const updateReveal = () => {
    const viewportHeight = window.innerHeight;
    const titleTop = title.getBoundingClientRect().top;
    const revealStart = viewportHeight * 0.92;
    const revealEnd = viewportHeight * 0.2;
    const overallProgress = Math.min(1, Math.max(0, (revealStart - titleTop) / (revealStart - revealEnd)));
    const overlap = 3.4;
    const wordStep = 1 / Math.max(1, words.length - 1 + overlap);
    const wordDuration = wordStep * overlap;

    words.forEach((word, index) => {
      const progress = Math.min(1, Math.max(0, (overallProgress - index * wordStep) / wordDuration));
      word.style.setProperty('--about-title-progress', `${(1 - progress) * -110}%`);
    });
    animationFrame = null;
  };

  const scheduleUpdate = () => {
    if (animationFrame !== null) return;
    animationFrame = window.requestAnimationFrame(updateReveal);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
}

function initAboutCopyScrollReveal() {
  const about = document.querySelector('#about.about');
  const copy = about?.querySelector('.about-copy-scroll');
  if (!about || !copy) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    copy.style.setProperty('--about-copy-scroll-y', '0px');
    return;
  }

  let animationFrame = null;
  const updateReveal = () => {
    const viewportHeight = window.innerHeight;
    const copyTop = copy.getBoundingClientRect().top;
    const revealStart = viewportHeight * 1.12;
    const revealEnd = viewportHeight * 0.48;
    const progress = Math.max(0, (revealStart - copyTop) / (revealStart - revealEnd));
    copy.style.setProperty('--about-copy-scroll-y', `${(1 - progress) * 100}px`);
    animationFrame = null;
  };

  const scheduleUpdate = () => {
    if (animationFrame !== null) return;
    animationFrame = window.requestAnimationFrame(updateReveal);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
}

window.addEventListener('load', () => {
  resetPageScroll();
  initHashNavigation();
  requestAnimationFrame(() => resetPageScroll());
  requestAnimationFrame(() => initHashNavigation());
});

function initSmoothScrollActions() {
  const logo = document.querySelector('.logo');
  const contactLinks = document.querySelectorAll('a[href="#contact"], a[href="#about"], .intro-link, .envelope-button, .header-mini-button, .header-about-button');

  const enableSmoothScroll = () => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.scrollBehavior = 'smooth';
    window.setTimeout(() => {
      document.documentElement.style.scrollBehavior = '';
      document.body.style.scrollBehavior = '';
    }, 700);
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

function initWheelSmoothing() {
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (hasReducedMotion || !hasFinePointer) return;

  const easingDuration = 150;
  let targetScrollY = window.scrollY;
  let animationFrame = null;
  let previousFrameTime = 0;

  const animateScroll = (frameTime) => {
    const currentScrollY = window.scrollY;
    const distance = targetScrollY - currentScrollY;

    if (Math.abs(distance) < 0.5) {
      window.scrollTo({ top: targetScrollY, behavior: 'instant' });
      animationFrame = null;
      previousFrameTime = 0;
      return;
    }

    const frameDuration = previousFrameTime ? frameTime - previousFrameTime : 16;
    const easing = 1 - Math.exp(-frameDuration / easingDuration);
    window.scrollTo({
      top: currentScrollY + distance * easing,
      behavior: 'instant'
    });
    previousFrameTime = frameTime;
    animationFrame = window.requestAnimationFrame(animateScroll);
  };

  window.addEventListener('scroll', () => {
    if (animationFrame === null) targetScrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('wheel', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? event.deltaY * 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? event.deltaY * window.innerHeight
        : event.deltaY;
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    const nextTarget = Math.min(maxScrollY, Math.max(0, targetScrollY + delta));
    if (nextTarget === targetScrollY) return;

    event.preventDefault();
    targetScrollY = nextTarget;
    if (animationFrame === null) {
      previousFrameTime = 0;
      animationFrame = window.requestAnimationFrame(animateScroll);
    }
  }, { passive: false });
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

function initFutureTransition() {
  const transitions = document.querySelectorAll('.future-transition');
  if (!transitions.length) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  transitions.forEach((transition) => {
    const blocks = transition.querySelectorAll('.future-transition-block');
    if (!blocks.length) return;
    let animationFrame = null;

    const updateBlocks = () => {
      animationFrame = null;
      const bounds = transition.getBoundingClientRect();
      const transitionHeight = transition.offsetHeight;
      const startOffset = window.innerHeight * 1.25;
      const scrollRange = startOffset + transitionHeight;
      const rawProgress = Math.min(1, Math.max(0, (startOffset - bounds.top) / scrollRange));
      const delay = transition.classList.contains('future-transition--light') ? .3 : 0;
      const progress = prefersReducedMotion
        ? 1
        : Math.min(1, Math.max(0, (rawProgress - delay) / (1 - delay)));

      blocks.forEach((block) => {
        const styles = getComputedStyle(block);
        const duration = Number.parseFloat(styles.getPropertyValue('--block-speed'));
        const delay = Number.parseFloat(styles.getPropertyValue('--block-delay')) || 0;
        const blockProgress = transition.classList.contains('future-transition--light')
          ? Math.min(1, Math.max(0, (progress - delay) / (1 - delay)))
          : Math.min(1, Math.max(0, (progress - (1 - duration)) / duration));
        const growth = -.2 * blockProgress ** 3 - .5 * blockProgress ** 2 + 1.7 * blockProgress;
        const scale = .12 + .88 * growth;
        block.style.setProperty('--block-scale', scale.toFixed(4));
      });
    };

    const scheduleUpdate = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(updateBlocks);
      }
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
  });
}

function initCursorGlow() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const glowTargets = document.querySelectorAll([
    '.intro-link',
    '.driver-license-support',
    '.future-goal-card',
    '.about-read-more'
  ].join(','));

  glowTargets.forEach((target) => {
    target.classList.add('cursor-glow-target');

    let targetX = 50;
    let targetY = 50;
    let currentX = 50;
    let currentY = 50;
    let animationFrame = null;

    const animateGlow = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
        currentX = targetX;
        currentY = targetY;
        animationFrame = null;
      } else {
        animationFrame = window.requestAnimationFrame(animateGlow);
      }

      target.style.setProperty('--glow-x', `${currentX.toFixed(2)}%`);
      target.style.setProperty('--glow-y', `${currentY.toFixed(2)}%`);
    };

    target.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;

      const bounds = target.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width) * 100;
      targetY = ((event.clientY - bounds.top) / bounds.height) * 100;
      target.classList.add('is-glowing');

      if (prefersReducedMotion) {
        currentX = targetX;
        currentY = targetY;
        target.style.setProperty('--glow-x', `${currentX.toFixed(2)}%`);
        target.style.setProperty('--glow-y', `${currentY.toFixed(2)}%`);
      } else if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(animateGlow);
      }
    });

    const clearGlow = () => {
      target.classList.remove('is-glowing');
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };
    target.addEventListener('pointerleave', clearGlow);
    target.addEventListener('pointercancel', clearGlow);
  });
}

function initGoalCardMagnets() {
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (hasReducedMotion || !hasFinePointer) return;

  document.querySelectorAll('.future-goal-card, .about-read-more').forEach((card) => {
    const returnToRest = () => {
      card.style.setProperty('--magnet-x', '0px');
      card.style.setProperty('--magnet-y', '0px');
      card.classList.remove('is-magnetized');
      card.classList.remove('is-glowing');
    };

    card.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;

      const bounds = card.getBoundingClientRect();
      const strength = 6;
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * strength * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * strength * 2;

      card.style.setProperty('--magnet-x', `${x.toFixed(2)}px`);
      card.style.setProperty('--magnet-y', `${y.toFixed(2)}px`);
      card.classList.add('is-magnetized');
    });

    card.addEventListener('pointerleave', returnToRest);
    card.addEventListener('pointercancel', returnToRest);
  });
}
