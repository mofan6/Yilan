(() => {
  const accentIds = new Set(['aurora', 'jade', 'orange', 'sapphire', 'orchid', 'rose', 'cyan', 'gold']);
  let experience = {};
  try {
    experience = window.offlineTranslator?.getExperienceSettings?.() || {};
  } catch {}

  const storedTheme = experience.theme
    || localStorage.getItem('yilan-theme')
    || localStorage.getItem('offline-translator-theme');
  const storedAccent = experience.accent || localStorage.getItem('yilan-accent');
  const theme = storedTheme === 'light' ? 'light' : 'dark';
  const accent = accentIds.has(storedAccent) ? storedAccent : 'orange';

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.accent = accent;
  document.body.dataset.theme = theme;
  document.body.dataset.accent = accent;
})();
