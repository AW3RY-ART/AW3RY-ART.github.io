(() => {
  const storageKey = 'aw3ry.preferences.v1';
  const isMobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const defaults = {
    musicEnabled: true,
    volume: 0.1,
    muted: false,
    track: 0,
    visualizerEnabled: false,
    vfxEnabled: !isMobile,
    popupEnabled: true
  };
  let preferences = { ...defaults };

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.musicEnabled === 'boolean') preferences.musicEnabled = parsed.musicEnabled;
        if (typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)) {
          preferences.volume = Math.min(1, Math.max(0, parsed.volume));
        }
        if (typeof parsed.muted === 'boolean') preferences.muted = parsed.muted;
        if (Number.isInteger(parsed.track) && parsed.track >= 0 && parsed.track <= 1) {
          preferences.track = parsed.track;
        }
        if (typeof parsed.visualizerEnabled === 'boolean') preferences.visualizerEnabled = parsed.visualizerEnabled;
        if (typeof parsed.vfxEnabled === 'boolean') preferences.vfxEnabled = parsed.vfxEnabled;
        if (typeof parsed.popupEnabled === 'boolean') preferences.popupEnabled = parsed.popupEnabled;
      }
    }
  } catch (error) {
    console.warn('Saved preferences could not be loaded.', error);
  }

  const applyPreferences = () => {
    document.documentElement.classList.toggle('visualizer-disabled', !preferences.visualizerEnabled);
    document.documentElement.classList.toggle('vfx-disabled', !preferences.vfxEnabled);
  };
  applyPreferences();

  window.aw3ryPreferences = {
    get() {
      return { ...preferences };
    },
    save(changes) {
      preferences = { ...preferences, ...changes };
      applyPreferences();
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Preferences could not be saved.', error);
      }
      document.dispatchEvent(new CustomEvent('aw3ry:preferences-changed', {
        detail: { ...preferences, changed: Object.keys(changes) }
      }));
    }
  };

})();
