'use strict';

const params = new URLSearchParams(location.search);
const accentIds = new Set(['aurora', 'jade', 'orange', 'sapphire', 'orchid', 'rose', 'cyan', 'gold']);
document.documentElement.dataset.theme = params.get('theme') === 'light' ? 'light' : 'dark';
document.documentElement.dataset.accent = accentIds.has(params.get('accent')) ? params.get('accent') : 'orange';

document.addEventListener('DOMContentLoaded', async () => {
  const detail = document.getElementById('startupDetail');
  const percent = document.getElementById('startupPercent');
  let completed = false;

  const update = (payload = {}) => {
    if (completed) return;
    const progress = Math.max(12, Math.min(96, Math.round(Number(payload.progress) || 12)));
    document.documentElement.style.setProperty('--startup-progress', `${progress}%`);
    percent.textContent = `${progress}%`;
    if (payload.detail) detail.textContent = payload.detail;
  };

  window.yilanStartup.onProgress(update);
  window.yilanStartup.onComplete(() => {
    if (completed) return;
    completed = true;
    document.documentElement.style.setProperty('--startup-progress', '100%');
    percent.textContent = '100%';
    detail.textContent = '一切就绪，欢迎回来';
    document.body.classList.add('is-completing');
  });

  try { await document.fonts?.ready; } catch {}
  requestAnimationFrame(() => {
    document.body.classList.add('is-ready');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.yilanStartup.ready());
    });
  });
});
