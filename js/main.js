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
  initMusicPlayer();
  initSiteSettings();
  initSmoothScrollActions();
  initWheelSmoothing();
  initAboutTextReveal();
  initAboutTitleScrollReveal();
  initGalleryCurrentFilterReveal();
  initContactTitleReveal();
  initContactSocialHeadingReveal();
  initAboutCopyScrollReveal();
  initAboutParallax();
  initInstagramParallax();
  initSectionParallaxGlows();
  initFutureGoalReveal();
  initFutureMarquee();
  initServicesComingSoon();
  initDriverLicenseToast();
  initFutureTransition();
  initGalleryProjectLoop();
  initCursorGlow();
  initGoalCardMagnets();
  disableContextMenu();
});

function initSiteSettings() {
  const controls = document.querySelectorAll('[data-preference]');
  const preferenceStore = window.aw3ryPreferences;
  if (!controls.length || !preferenceStore) return;

  const syncControls = (preferences = preferenceStore.get()) => {
    controls.forEach((control) => {
      const key = control.dataset.preference;
      if (control.type === 'checkbox') {
        control.checked = Boolean(preferences[key]);
      } else if (control.type === 'range') {
        control.value = String(preferences[key]);
        control.setAttribute('aria-valuetext', `${Math.round(Number(control.value) * 100)}%`);
      }
    });
  };

  controls.forEach((control) => {
    const eventName = control.type === 'range' ? 'input' : 'change';
    control.addEventListener(eventName, () => {
      const value = control.type === 'checkbox' ? control.checked : Number(control.value);
      preferenceStore.save({ [control.dataset.preference]: value });
    });
  });

  const updatePopup = (enabled) => {
    const toast = document.querySelector('#driverLicenseToast');
    const toggle = toast?.querySelector('.driver-license-toggle');
    const details = toast?.querySelector('.driver-license-toast-details');
    if (!toast || !toggle || !details) return;
    toast.hidden = !enabled;
    if (!enabled && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
      details.setAttribute('aria-hidden', 'true');
      details.inert = true;
      toast.classList.remove('is-expanded');
    }
  };

  document.addEventListener('aw3ry:preferences-changed', (event) => {
    syncControls(event.detail);
    if (event.detail.changed.includes('popupEnabled')) {
      updatePopup(event.detail.popupEnabled);
    }
  });
  syncControls();
  updatePopup(preferenceStore.get().popupEnabled);
}

function initMusicPlayer() {
  const player = document.querySelector('.music-player');
  if (!player) return;

  const audio = player?.querySelector('.music-player-audio');
  const visualizer = document.querySelector('.music-visualizer');
  const playButton = player?.querySelector('.music-player-toggle');
  const previousButton = player?.querySelector('.music-player-previous');
  const nextButton = player?.querySelector('.music-player-next');
  const muteButton = player?.querySelector('.music-player-mute');
  const heroPlayButton = document.querySelector('.play-button');
  const heroMuteButton = document.querySelector('.sound-button');
  const expandButton = player?.querySelector('.music-player-expand-toggle');
  const details = player?.querySelector('.music-player-details');
  const volumeSlider = player?.querySelector('.music-player-volume-slider');
  const authorLink = player?.querySelector('.music-player-author');
  const status = player?.querySelector('.music-player-status');
  const preferenceStore = window.aw3ryPreferences;
  const canvasContext = visualizer?.getContext('2d');
  if (!preferenceStore) {
    console.error('Music player could not initialize because preference storage is unavailable.');
    return;
  }
  if (
    !audio || !visualizer || !canvasContext || !playButton || !previousButton || !nextButton ||
    !muteButton || !expandButton || !details || !volumeSlider || !authorLink || !status
  ) {
    console.error('Music player could not initialize because a required control is missing.');
    return;
  }

  const tracks = [
    {
      src: 'assets/music/SONG1.mp3',
      author: 'https://pixabay.com/pl/music/pu%C5%82apka-elit-motion-trap-motion-619695/'
    },
    {
      src: 'assets/music/SONG2.mp3',
      author: 'https://pixabay.com/pl/music/orkiestrowy-dark-luxury-trap-beat-elegant-modern-amp-cinematic-612697/'
    }
  ];
  const savedPreferences = preferenceStore.get();
  let currentTrack = savedPreferences.track;
  let audioContext;
  let analyser;
  let outputGain;
  let frequencyData;
  let visualizationFrame = null;
  let fadeInOnNextPlayback = true;
  audio.volume = savedPreferences.volume;
  audio.muted = savedPreferences.muted;
  audio.src = tracks[currentTrack].src;
  authorLink.href = tracks[currentTrack].author;
  let previousVolume = audio.volume > 0 ? audio.volume : 0.1;

  const updatePlaybackControls = () => {
    const isPlaying = !audio.paused;
    playButton.setAttribute('aria-pressed', String(isPlaying));
    playButton.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    player.classList.toggle('is-playing', isPlaying);
  };

  const updateVolumeControls = () => {
    const isMuted = audio.muted || audio.volume === 0;
    muteButton.setAttribute('aria-pressed', String(isMuted));
    muteButton.setAttribute('aria-label', isMuted ? 'Unmute music' : 'Mute music');
    if (heroMuteButton) {
      heroMuteButton.setAttribute('aria-pressed', String(isMuted));
      heroMuteButton.setAttribute('aria-label', isMuted ? 'Unmute music' : 'Mute music');
      heroMuteButton.classList.toggle('is-muted', isMuted);
    }
    volumeSlider.value = String(audio.volume);
    volumeSlider.setAttribute('aria-valuetext', `${Math.round(audio.volume * 100)}%`);
  };

  const resizeVisualizer = () => {
    const bounds = visualizer.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    visualizer.width = Math.round(bounds.width * pixelRatio);
    visualizer.height = Math.round(bounds.height * pixelRatio);
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const setExpanded = (isExpanded) => {
    expandButton.setAttribute('aria-expanded', String(isExpanded));
    expandButton.setAttribute('aria-label', isExpanded ? 'Close music player' : 'Open music player');
    details.setAttribute('aria-hidden', String(!isExpanded));
    details.inert = !isExpanded;
    player.classList.toggle('is-expanded', isExpanded);
  };
  expandButton.addEventListener('click', () => {
    setExpanded(expandButton.getAttribute('aria-expanded') !== 'true');
  });
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const revealDistance = 44;
    const expandedDistance = 16;
    const distanceToBounds = (bounds, x, y) => {
      const distanceX = Math.max(bounds.left - x, 0, x - bounds.right);
      const distanceY = Math.max(bounds.top - y, 0, y - bounds.bottom);
      return Math.hypot(distanceX, distanceY);
    };
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse' || !player.classList.contains('is-visible')) return;
      const buttonDistance = distanceToBounds(expandButton.getBoundingClientRect(), event.clientX, event.clientY);
      const isExpanded = expandButton.getAttribute('aria-expanded') === 'true';
      const detailsDistance = isExpanded
        ? distanceToBounds(details.getBoundingClientRect(), event.clientX, event.clientY)
        : Infinity;
      const isNearExpandedPlayer = Math.min(buttonDistance, detailsDistance) <= expandedDistance;
      if (isExpanded && !isNearExpandedPlayer) {
        setExpanded(false);
        if (document.activeElement instanceof HTMLElement && player.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }
      player.classList.toggle(
        'is-approaching',
        buttonDistance <= revealDistance || (isExpanded && isNearExpandedPlayer)
      );
    }, { passive: true });
    window.addEventListener('pointerleave', () => {
      player.classList.remove('is-approaching');
      if (expandButton.getAttribute('aria-expanded') === 'true') setExpanded(false);
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && expandButton.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
      expandButton.focus();
    }
  });

  const hero = document.querySelector('.page');
  if (hero) {
    const updateMusicVisibility = () => {
      const hasLeftHero = hero.getBoundingClientRect().bottom <= 0;
      player.classList.toggle('is-visible', hasLeftHero);
      visualizer.classList.toggle('is-visible', hasLeftHero);
      if (!hasLeftHero) setExpanded(false);
    };
    let visibilityFrame = null;
    const scheduleVisibilityUpdate = () => {
      if (visibilityFrame !== null) return;
      visibilityFrame = window.requestAnimationFrame(() => {
        visibilityFrame = null;
        updateMusicVisibility();
      });
    };

    updateMusicVisibility();
    window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
    window.addEventListener('resize', scheduleVisibilityUpdate);
  }

  const stopVisualizer = () => {
    if (visualizationFrame !== null) {
      window.cancelAnimationFrame(visualizationFrame);
      visualizationFrame = null;
    }
    const bounds = visualizer.getBoundingClientRect();
    canvasContext.clearRect(0, 0, bounds.width, bounds.height);
  };

  const drawVisualizer = () => {
    visualizationFrame = null;
    if (audio.paused || !analyser || !frequencyData) return;
    analyser.getByteFrequencyData(frequencyData);

    const { width, height } = visualizer.getBoundingClientRect();
    const barCount = 40;
    const centerX = width / 2;
    const halfWidth = centerX;
    const gap = Math.max(1, halfWidth * 0.006);
    const barWidth = Math.max(2, (halfWidth - gap * (barCount - 1)) / barCount);
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.fillStyle = '#fff';
    for (let index = 0; index < barCount; index += 1) {
      const frequencyIndex = Math.min(
        frequencyData.length - 1,
        Math.floor((index / barCount) ** 2 * frequencyData.length)
      );
      const value = frequencyData[frequencyIndex] / 255;
      const barHeight = Math.max(2, value * height * 0.82);
      const x = centerX + index * (barWidth + gap);
      const y = height - barHeight;
      canvasContext.fillRect(x, y, barWidth, barHeight);
      canvasContext.fillRect(centerX - (index + 1) * barWidth - index * gap, y, barWidth, barHeight);
    }
    visualizationFrame = window.requestAnimationFrame(drawVisualizer);
  };

  const startVisualizer = () => {
    if (
      visualizationFrame === null &&
      analyser &&
      preferenceStore.get().visualizerEnabled
    ) {
      visualizationFrame = window.requestAnimationFrame(drawVisualizer);
    }
  };

  const startPlayback = async () => {
    status.textContent = '';
    try {
      if (!audioContext) {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        outputGain = audioContext.createGain();
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(outputGain);
        outputGain.connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (fadeInOnNextPlayback) {
        outputGain.gain.cancelScheduledValues(audioContext.currentTime);
        outputGain.gain.setValueAtTime(0, audioContext.currentTime);
      }
      await audio.play();
      if (fadeInOnNextPlayback) {
        const fadeStart = audioContext.currentTime;
        outputGain.gain.setValueAtTime(0, fadeStart);
        outputGain.gain.linearRampToValueAtTime(1, fadeStart + 3);
        fadeInOnNextPlayback = false;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        status.textContent = 'Press play to start music.';
        updatePlaybackControls();
        return;
      }
      console.error('Music playback could not start.', error);
      status.textContent = 'Music could not be played.';
      updatePlaybackControls();
    }
  };

  const selectTrack = (index, resumePlayback = !audio.paused) => {
    currentTrack = (index + tracks.length) % tracks.length;
    audio.src = tracks[currentTrack].src;
    authorLink.href = tracks[currentTrack].author;
    preferenceStore.save({ track: currentTrack });
    if (resumePlayback) startPlayback();
  };

  const togglePlayback = () => {
    preferenceStore.save({ musicEnabled: audio.paused });
  };
  playButton.addEventListener('click', togglePlayback);
  heroPlayButton?.addEventListener('click', togglePlayback);
  previousButton.addEventListener('click', () => {
    selectTrack(audio.currentTime > 3 ? currentTrack : currentTrack - 1);
  });
  nextButton.addEventListener('click', () => selectTrack(currentTrack + 1));
  const toggleMute = () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      if (audio.volume === 0) audio.volume = previousVolume;
    } else {
      previousVolume = audio.volume;
      audio.muted = true;
    }
    preferenceStore.save({ muted: audio.muted });
    updateVolumeControls();
  };
  muteButton.addEventListener('click', toggleMute);
  heroMuteButton?.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('input', () => {
    audio.volume = Number(volumeSlider.value);
    if (audio.volume > 0) {
      previousVolume = audio.volume;
      audio.muted = false;
    }
    preferenceStore.save({ volume: audio.volume, muted: audio.muted });
    updateVolumeControls();
  });
  document.addEventListener('aw3ry:preferences-changed', (event) => {
    if (event.detail.changed.includes('musicEnabled')) {
      if (event.detail.musicEnabled) {
        startPlayback();
      } else {
        audio.pause();
      }
    }
    if (event.detail.changed.includes('visualizerEnabled')) {
      if (event.detail.visualizerEnabled && !audio.paused) {
        startVisualizer();
      } else if (!event.detail.visualizerEnabled) {
        stopVisualizer();
      }
    }
    if (event.detail.changed.includes('volume')) {
      audio.volume = event.detail.volume;
      updateVolumeControls();
    }
  });
  audio.addEventListener('play', () => {
    updatePlaybackControls();
    startVisualizer();
  });
  audio.addEventListener('pause', () => {
    updatePlaybackControls();
    stopVisualizer();
  });
  audio.addEventListener('ended', () => selectTrack(currentTrack + 1, true));
  audio.addEventListener('error', () => {
    console.error(`Music track could not be loaded: ${tracks[currentTrack].src}`);
    status.textContent = 'Music track could not be loaded.';
    updatePlaybackControls();
  });
  window.addEventListener('resize', resizeVisualizer);

  resizeVisualizer();
  updateVolumeControls();
  updatePlaybackControls();
  if (savedPreferences.musicEnabled) startPlayback();
}

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
  const disableScrollBlur = window.matchMedia('(max-width: 760px) and (pointer: coarse)').matches;

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
      const blur = disableScrollBlur ? 0 : Math.max(0, (edgeRatio - .55) / .45) * 4;
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
  const aboutSections = document.querySelectorAll('#about.about, #instagram.instagram-feature, #services.services');
  aboutSections.forEach((about) => {
    const title = about.querySelector('.section-title');
    const titleLines = title?.querySelectorAll('.about-title-line');
    if (!title || !titleLines?.length) return;

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
        if (about.id === 'instagram' && word.toLowerCase() === 'instagram') {
          mask.classList.add('about-title-word--instagram');
          inner.classList.add('about-title-word-inner--instagram');
        }
        if (about.id === 'services' && word.toLowerCase() === 'here') {
          inner.classList.add('about-title-word-inner--accent');
        }
        inner.textContent = word;
        mask.append(inner);
        line.append(mask);
        if (index < lineWords.length - 1) line.append(document.createTextNode(' '));
        words.push(inner);
      });
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      words.forEach((word) => {
        word.style.setProperty('--about-title-progress', '0%');
        word.style.setProperty('--about-title-opacity', '1');
        word.style.setProperty('--about-title-blur', '0px');
        word.style.setProperty('--about-title-bleed', '0');
      });
      return;
    }

    let animationFrame = null;
    const updateReveal = () => {
      const viewportHeight = window.innerHeight;
      const titleTop = title.getBoundingClientRect().top;
      const isServicesTitle = about.id === 'services';
      const revealStart = viewportHeight * (isServicesTitle ? 1 : 0.92);
      const revealEnd = viewportHeight * (isServicesTitle ? 0.365 : 0.2);
      const overallProgress = Math.min(1, Math.max(0, (revealStart - titleTop) / (revealStart - revealEnd)));
      const overlap = 3.4;
      const wordStep = 1 / Math.max(1, words.length - 1 + overlap);
      const wordDuration = wordStep * overlap;

      words.forEach((word, index) => {
        const progress = Math.min(1, Math.max(0, (overallProgress - index * wordStep) / wordDuration));
        word.style.setProperty('--about-title-progress', `${(1 - progress) * -110}%`);
        word.style.setProperty('--about-title-opacity', `${progress}`);
        const finalBlur = word.classList.contains('about-title-word-inner--instagram') ? .6 : 0;
        word.style.setProperty('--about-title-blur', `${(1 - progress) * 8 + progress * finalBlur}px`);
        word.style.setProperty('--about-title-bleed', `${(1 - progress) * 0.2}`);
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
  });
}

function initGalleryCurrentFilterReveal() {
  const title = document.querySelector('#galleryCurrentMode');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const line = title.querySelector('.about-title-line');
  if (!line) return;

  const words = line.textContent.trim().split(/\s+/);
  line.replaceChildren();
  words.forEach((word, index) => {
    const mask = document.createElement('span');
    const inner = document.createElement('span');
    mask.className = 'gallery-filter-title-word';
    inner.className = 'gallery-filter-title-word-inner';
    inner.style.setProperty('--gallery-filter-word-index', String(index));
    inner.textContent = word;
    mask.append(inner);
    line.append(mask);
    if (index < words.length - 1) line.append(document.createTextNode(' '));
  });

  title.classList.add('is-reveal-ready');
  const observer = new IntersectionObserver(([entry], currentObserver) => {
    if (!entry.isIntersecting) return;
    title.classList.add('is-revealed');
    currentObserver.unobserve(title);
  }, { threshold: 0.2 });
  observer.observe(title);
}

function initContactTitleReveal() {
  const title = document.querySelector('#contact .contact-title');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  title.classList.add('is-reveal-ready');
  let animationFrame = null;
  const updateReveal = () => {
    const viewportHeight = window.innerHeight;
    const titleTop = title.getBoundingClientRect().top;
    const start = viewportHeight * 0.92;
    const end = viewportHeight * 0.42;
    const progress = Math.min(1, Math.max(0, (start - titleTop) / (start - end)));
    const easedProgress = progress * progress * (3 - 2 * progress);
    title.style.setProperty('--contact-title-reveal', easedProgress);
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

function initContactSocialHeadingReveal() {
  const groups = document.querySelectorAll('#contact .contact-links > div');
  if (!groups.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  groups.forEach((group, index) => {
    group.classList.add('is-reveal-ready');
    group.style.setProperty('--contact-heading-delay', `${index * 450}ms`);
  });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  groups.forEach((group) => observer.observe(group));
}

function initAboutCopyScrollReveal() {
  const about = document.querySelector('#about.about');
  const copy = about?.querySelector('.about-copy-scroll');
  if (!about || !copy) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    copy.style.setProperty('--about-copy-scroll-y', '0px');
    copy.style.setProperty('--about-copy-scroll-blur', '0px');
    copy.style.setProperty('--about-copy-bg-blur', '0px');
    copy.style.setProperty('--about-copy-bg-opacity', '0');
    about.style.setProperty('--about-parallax-blur', '0px');
    return;
  }

  let animationFrame = null;
  const updateReveal = () => {
    const viewportHeight = window.innerHeight;
    const copyTop = copy.getBoundingClientRect().top;
    const revealStart = viewportHeight * 0.78;
    const revealEnd = viewportHeight * 0.28;
    const progress = Math.min(1, Math.max(0, (revealStart - copyTop) / (revealStart - revealEnd)));
    const blurProgress = Math.min(1, progress / 0.75);
    copy.style.setProperty('--about-copy-scroll-y', `${(1 - progress) * 100}px`);
    copy.style.setProperty('--about-copy-scroll-blur', `${(1 - blurProgress) * 3}px`);
    copy.style.setProperty('--about-copy-bg-blur', `${blurProgress * 8}px`);
    copy.style.setProperty('--about-copy-bg-opacity', `${progress * 0.55}`);
    const parallaxBlurProgress = Math.max(0, (blurProgress - 0.55) / 0.45);
    about.style.setProperty('--about-parallax-blur', `${parallaxBlurProgress * parallaxBlurProgress * 2}px`);
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

function initAboutParallax() {
  const about = document.querySelector('#about.about-feature');
  const shapes = about?.querySelectorAll('[data-parallax-depth]');
  if (!about || !shapes?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let animationFrame = null;
  const updateParallax = () => {
    const sectionProgress = (window.innerHeight - about.getBoundingClientRect().top) / (window.innerHeight + about.offsetHeight);
    const scrollDistance = (sectionProgress - 0.5) * 420;
    shapes.forEach((shape) => {
      const depth = Number(shape.dataset.parallaxDepth);
      shape.style.transform = `translate3d(0, ${scrollDistance * depth}px, 0)`;
    });
    animationFrame = null;
  };

  const scheduleUpdate = () => {
    if (animationFrame !== null) return;
    animationFrame = window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
}

function initInstagramParallax() {
  const section = document.querySelector('#instagram.instagram-feature');
  const parallaxItems = section?.querySelectorAll('[data-instagram-parallax], [data-instagram-orb-depth]');
  if (!section || !parallaxItems?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let animationFrame = null;
  const updateParallax = () => {
    const sectionProgress = (window.innerHeight - section.getBoundingClientRect().top) / (window.innerHeight + section.offsetHeight);
    const scrollDistance = (sectionProgress - 0.5) * 480;
    parallaxItems.forEach((item) => {
      const depth = Number(item.dataset.instagramParallax ?? item.dataset.instagramOrbDepth);
      item.style.transform = `translate3d(0, ${scrollDistance * depth}px, 0)`;
    });
    animationFrame = null;
  };

  const scheduleUpdate = () => {
    if (animationFrame !== null) return;
    animationFrame = window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
}

function initSectionParallaxGlows() {
  const glowLayers = document.querySelectorAll('.section-parallax-glow [data-section-parallax-depth], .closing-atmosphere-pattern [data-section-parallax-depth], #contact [data-section-parallax-depth]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!glowLayers.length) return;
  const closingGlow = document.querySelector('.closing-atmosphere-glow');
  const closingServices = document.querySelector('.closing-atmosphere .services');
  if (closingGlow && closingServices && !reducedMotion) closingGlow.classList.add('is-scroll-reveal-ready');
  if (reducedMotion) return;

  const sections = new Map();
  glowLayers.forEach((layer) => {
    const section = layer.closest('.closing-atmosphere, section');
    if (!section) return;
    const layers = sections.get(section) || [];
    layers.push(layer);
    sections.set(section, layers);
  });

  let animationFrame = null;
  const updateParallax = () => {
    sections.forEach((layers, section) => {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionProgress = (window.innerHeight - sectionTop) / (window.innerHeight + section.offsetHeight);
      const parallaxRange = Number(section.dataset.sectionParallaxRange) || 260;
      const services = section.matches('.closing-atmosphere') ? section.querySelector('.services') : null;
      const scrollDistance = section.matches('.closing-atmosphere')
        ? services
          ? -Math.min(1, Math.max(0, -sectionTop / Math.max(1, section.offsetHeight - window.innerHeight))) * parallaxRange
          : -Math.min(1, Math.max(0, sectionProgress)) * parallaxRange
        : (sectionProgress - 0.5) * parallaxRange;
      if (services) {
        const cutoffStart = Number(section.dataset.sectionCutoffStart) || 0;
        const cutoffEnd = Number(section.dataset.sectionCutoffEnd) || 1;
        const servicesProgress = (window.innerHeight - services.getBoundingClientRect().top) / (window.innerHeight + services.offsetHeight);
        const cutoffProgress = Math.min(1, Math.max(0, (servicesProgress - cutoffStart) / Math.max(0.001, cutoffEnd - cutoffStart)));
        if (closingGlow) {
          const glowRevealStart = Math.max(0, cutoffStart - 0.18);
          const glowProgress = Math.min(1, Math.max(0, (servicesProgress - glowRevealStart) / (1 - glowRevealStart)));
          const easedReveal = glowProgress * glowProgress * (3 - 2 * glowProgress);
          closingGlow.style.setProperty('--closing-glow-reveal', easedReveal);
        }
        const currentShift = Number.parseFloat(getComputedStyle(services).getPropertyValue('--services-cutoff-shift')) || 0;
        const currentPanelHeight = Number.parseFloat(getComputedStyle(services, '::before').height);
        const cutoffRange = Math.max(0, services.offsetHeight - currentPanelHeight + currentShift);
        const easedCutoffProgress = cutoffProgress * cutoffProgress * (3 - 2 * cutoffProgress);
        services.style.setProperty('--services-cutoff-shift', `${easedCutoffProgress * cutoffRange}px`);
      }
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.sectionParallaxDepth);
        layer.style.transform = `translate3d(0, ${scrollDistance * depth}px, 0)`;
      });
    });
    animationFrame = null;
  };
  const scheduleUpdate = () => {
    if (animationFrame !== null) return;
    animationFrame = window.requestAnimationFrame(updateParallax);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();
}

function initFutureGoalReveal() {
  const grid = document.querySelector('.future-goals-grid');
  const cells = grid?.querySelectorAll('.future-goal-cell');
  if (!grid || !cells?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  grid.classList.add('has-future-goal-reveal');
  cells.forEach((cell, index) => {
    cell.style.setProperty('--future-goal-reveal-delay', `${(index % 4) * 90}ms`);
  });

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  cells.forEach((cell) => observer.observe(cell));
}

function initFutureMarquee() {
  const marquee = document.querySelector('.future-marquee');
  if (!marquee || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(([entry]) => {
    marquee.classList.toggle('is-active', entry.isIntersecting);
  });
  observer.observe(marquee);
}

function initServicesComingSoon() {
  const section = document.querySelector('#services.services');
  const notification = document.querySelector('#servicesComingSoon');
  const serviceButtons = section?.querySelectorAll('.service-pill');
  if (!serviceButtons?.length) return;

  let dismissTimer = null;
  let hideTimer = null;
  serviceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!notification) return;

      window.clearTimeout(dismissTimer);
      window.clearTimeout(hideTimer);
      notification.textContent = 'Coming soon';
      notification.hidden = false;
      requestAnimationFrame(() => notification.classList.add('is-visible'));
      dismissTimer = window.setTimeout(() => {
        notification.classList.remove('is-visible');
        hideTimer = window.setTimeout(() => {
          notification.hidden = true;
        }, 440);
      }, 2400);
    });
  });
}

function initDriverLicenseToast() {
  const hero = document.querySelector('.page');
  const toast = document.querySelector('#driverLicenseToast');
  const toggle = toast?.querySelector('.driver-license-toggle');
  const details = toast?.querySelector('.driver-license-toast-details');
  if (!hero || !toast || !toggle || !details) return;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setExpanded = (isExpanded) => {
    toggle.setAttribute('aria-expanded', String(isExpanded));
    details.setAttribute('aria-hidden', String(!isExpanded));
    details.inert = !isExpanded;
    toast.classList.toggle('is-expanded', isExpanded);
  };

  toggle.addEventListener('click', () => {
    setExpanded(toggle.getAttribute('aria-expanded') !== 'true');
  });

  let visibilityFrame = null;
  let magnetFrame = null;
  let targetOffset = 0;
  let currentOffset = 0;
  const maxOffset = 12;
  const activationDistance = 80;

  const animateMagnet = () => {
    currentOffset += (targetOffset - currentOffset) * .16;
    if (Math.abs(targetOffset - currentOffset) < .1) currentOffset = targetOffset;
    toast.style.setProperty('--magnetic-x', `${currentOffset.toFixed(2)}px`);
    if (currentOffset !== targetOffset) {
      magnetFrame = window.requestAnimationFrame(animateMagnet);
    } else {
      magnetFrame = null;
    }
  };
  const setMagnetTarget = (offset) => {
    targetOffset = offset;
    if (magnetFrame === null) magnetFrame = window.requestAnimationFrame(animateMagnet);
  };
  const updateMagnet = (event) => {
    if (event.pointerType !== 'mouse' || !toast.classList.contains('is-visible')) return;
    const bounds = toast.getBoundingClientRect();
    const nearestX = Math.max(bounds.left, Math.min(event.clientX, bounds.right));
    const nearestY = Math.max(bounds.top, Math.min(event.clientY, bounds.bottom));
    const distanceX = event.clientX - nearestX;
    const distanceY = event.clientY - nearestY;
    const distance = Math.hypot(distanceX, distanceY);
    if (distance > activationDistance) {
      setMagnetTarget(0);
      return;
    }
    const attraction = 1 - distance / activationDistance;
    const distanceFromCenter = event.clientX - (bounds.left + bounds.width / 2);
    const baseCenter = bounds.left + bounds.width / 2 - currentOffset;
    const minOffset = 12 + bounds.width / 2 - baseCenter;
    const maxViewportOffset = window.innerWidth - 12 - bounds.width / 2 - baseCenter;
    const offset = distanceFromCenter * .15 * attraction;
    setMagnetTarget(Math.max(Math.max(minOffset, -maxOffset), Math.min(maxOffset, maxViewportOffset, offset)));
  };
  const resetMagnet = () => setMagnetTarget(0);

  if (hasFinePointer && !hasReducedMotion) {
    window.addEventListener('pointermove', updateMagnet, { passive: true });
    window.addEventListener('pointerleave', resetMagnet);
  }

  if (hasFinePointer) {
    const collapseWhenPointerLeaves = (event) => {
      if (event.pointerType !== 'mouse' || toggle.getAttribute('aria-expanded') !== 'true') return;
      const bounds = toast.getBoundingClientRect();
      const distanceX = Math.max(bounds.left - event.clientX, 0, event.clientX - bounds.right);
      const distanceY = Math.max(bounds.top - event.clientY, 0, event.clientY - bounds.bottom);
      if (Math.hypot(distanceX, distanceY) > 16) setExpanded(false);
    };
    window.addEventListener('pointermove', collapseWhenPointerLeaves, { passive: true });
    window.addEventListener('pointerleave', () => setExpanded(false));
  }

  const updateVisibility = () => {
    const hasLeftHero = hero.getBoundingClientRect().bottom <= 0;
    toast.classList.toggle('is-visible', hasLeftHero);
    if (!hasLeftHero) resetMagnet();
    if (!hasLeftHero && toggle.getAttribute('aria-expanded') === 'true') {
      setExpanded(false);
    }
    visibilityFrame = null;
  };
  const scheduleVisibilityUpdate = () => {
    if (visibilityFrame !== null) return;
    visibilityFrame = window.requestAnimationFrame(updateVisibility);
  };

  window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
  window.addEventListener('resize', scheduleVisibilityUpdate);
  scheduleVisibilityUpdate();
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
      const isIndexPage = location.pathname.endsWith('/index.html') || location.pathname.endsWith('/');
      if (!isIndexPage) return;
      event.preventDefault();
      enableSmoothScroll();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
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
    if (document.getElementById('siteNav')?.classList.contains('is-open')) return;
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

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  const openNav = () => {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
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

  nav.addEventListener('wheel', (event) => {
    if (event.target === nav) event.preventDefault();
  }, { passive: false });

  nav.addEventListener('touchmove', (event) => {
    if (event.target === nav) event.preventDefault();
  }, { passive: false });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.hasAttribute('data-melancholia-trigger')) {
        event.preventDefault();
        closeNav();
        showMelancholiaPopup(toggle);
        return;
      }
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
}

function showMelancholiaPopup(returnFocusTarget) {
  const dialog = document.createElement('dialog');
  dialog.className = 'melancholia-popup';
  dialog.setAttribute('aria-labelledby', 'melancholia-popup-title');
  dialog.innerHTML = `
    <div class="melancholia-popup-content">
      <h2 id="melancholia-popup-title">melancholia</h2>
      <button class="melancholia-popup-close" type="button" aria-label="Close popup">×</button>
      <iframe
        width="110"
        height="200"
        src="https://www.myinstants.com/instant/oj-wymasuj-mnie-romanie-13971/embed/"
        title="Oj wymasuj mnie Romanie sound button"
        frameborder="0"
        scrolling="no"
        allow="autoplay"
      ></iframe>
    </div>
  `;

  const closeButton = dialog.querySelector('.melancholia-popup-close');
  let closeTimer = null;
  const closeDialog = () => {
    if (dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    closeTimer = window.setTimeout(() => dialog.close(), 420);
  };

  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('close', () => {
    window.clearTimeout(closeTimer);
    dialog.remove();
    returnFocusTarget.focus({ preventScroll: true });
  }, { once: true });

  document.body.append(dialog);
  dialog.showModal();
  closeButton.focus();
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
    '.music-player-expand-toggle',
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

  document.querySelectorAll('.future-goal-card, .about-read-more, .music-player-expand-toggle').forEach((card) => {
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
