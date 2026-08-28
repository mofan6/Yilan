const api = window.offlineTranslator;

const sourceText = document.getElementById('sourceText');
const outputText = document.getElementById('outputText');
const translateButton = document.getElementById('translateButton');
const clearButton = document.getElementById('clearButton');
const copyButton = document.getElementById('copyButton');
const swapButton = document.getElementById('swapButton');
const charCount = document.getElementById('charCount');
const translationMeta = document.getElementById('translationMeta');
const enginePill = document.getElementById('enginePill');
const engineText = document.getElementById('engineText');
const renderMode = document.getElementById('renderMode');
const wordTitle = document.getElementById('wordTitle');
const languageBadge = document.getElementById('languageBadge');
const definitionText = document.getElementById('definitionText');
const dictionaryPanel = document.getElementById('dictionaryPanel');
const toast = document.getElementById('toast');
const openLogButton = document.getElementById('openLogButton');
const themeToggle = document.getElementById('themeToggle');
const windowMinimize = document.getElementById('windowMinimize');
const windowMaximize = document.getElementById('windowMaximize');
const windowClose = document.getElementById('windowClose');
const settingsTrigger = document.getElementById('settingsTrigger');
const settingsPage = document.getElementById('settingsPage');
const closeSettingsButton = document.getElementById('closeSettings');
const tiltRange = document.getElementById('tiltRange');
const tiltValue = document.getElementById('tiltValue');
const tiltDemo = document.getElementById('tiltDemo');
const paletteGrid = document.getElementById('paletteGrid');
const replayOnboardingButton = document.getElementById('replayOnboarding');
const onboarding = document.getElementById('onboarding');
const onboardingSkip = document.getElementById('onboardingSkip');
const onboardingBack = document.getElementById('onboardingBack');
const onboardingNext = document.getElementById('onboardingNext');
const onboardingDots = document.getElementById('onboardingDots');
const posterVisual = document.getElementById('posterVisual');
const posterCopy = document.getElementById('posterCopy');
const onboardingKicker = document.getElementById('onboardingKicker');
const onboardingTitle = document.getElementById('onboardingTitle');
const onboardingDescription = document.getElementById('onboardingDescription');
const onboardingTags = document.getElementById('onboardingTags');
const directionButtons = [...document.querySelectorAll('.direction')];

const accentThemes = [
  { id: 'aurora', name: '极光紫', detail: '蓝紫流光', colors: ['#70a0ff', '#9a6cf2'] },
  { id: 'jade', name: '翡翠青', detail: '清透青绿', colors: ['#26d4ae', '#159e9e'] },
  { id: 'orange', name: '橘影橙', detail: '温暖橘红', colors: ['#ffad55', '#ef6556'] },
  { id: 'sapphire', name: '深海蓝', detail: '沉静蓝靛', colors: ['#48a5ff', '#5368ed'] },
  { id: 'orchid', name: '兰庭紫', detail: '柔和兰紫', colors: ['#b27aff', '#d65fc8'] },
  { id: 'rose', name: '雾玫瑰', detail: '克制玫红', colors: ['#ff7c9f', '#b967dd'] },
  { id: 'cyan', name: '晴空青', detail: '明亮青蓝', colors: ['#43dce9', '#3d8dff'] },
  { id: 'gold', name: '鎏光金', detail: '金色暖光', colors: ['#e7c55a', '#ee8748'] }
];

const onboardingPages = [
  {
    kicker: 'WELCOME TO YILAN',
    title: '译澜，安静地理解两种语言',
    description: '无需网络，也无需账号。让中文与 English 在你的电脑里自然流动。',
    tags: ['全程离线', '中英互译', 'GPU 加速']
  },
  {
    kicker: 'SENTENCE TRANSLATION',
    title: '不止查词，也能翻译完整句子',
    description: '输入一段中文或英文，译澜会自动识别方向；也可以在顶部手动指定。按 Ctrl + Enter 即可开始。',
    tags: ['自动检测', '自然句译', '快捷操作']
  },
  {
    kicker: 'WORD INSPECTOR',
    title: '点一下句中词语，看见具体含义',
    description: '译文中的单词与中文词语都可以点击。逐词释义来自本地词典，不会打断你的阅读节奏。',
    tags: ['点击查义', '双向词典', '本地数据']
  },
  {
    kicker: 'MAKE IT YOURS',
    title: '你的文字，只留在你的电脑里',
    description: '翻译模型完全在本机运行。长按左上角「译」图标两秒，还可以调整倾斜角度与主题色。',
    tags: ['隐私优先', '八种配色', '可调动效']
  }
];

let mode = 'auto';
let lastTranslation = '';
let busy = false;
let toastTimer = null;
let themeTransitioning = false;
let tiltDegrees = 1.2;
let onboardingIndex = 0;
let settingsHoldTimer = null;

function enableGlassInteractions() {
  let current = null;
  let rect = null;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const settleTimers = new WeakMap();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const panelFrom = (target) => target instanceof Element ? target.closest('.glass-panel') : null;

  const settle = (panel) => {
    panel.removeAttribute('data-glass-active');
    panel.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    const previous = settleTimers.get(panel);
    if (previous) clearTimeout(previous);
    settleTimers.set(panel, setTimeout(() => {
      panel.style.removeProperty('transform');
      panel.style.removeProperty('transform-origin');
    }, 240));
  };

  const paint = () => {
    frame = 0;
    if (!current || !rect) return;
    const x = Math.min(rect.width, Math.max(0, pointerX - rect.left));
    const y = Math.min(rect.height, Math.max(0, pointerY - rect.top));
    current.style.setProperty('--spot-x', `${x}px`);
    current.style.setProperty('--spot-y', `${y}px`);
    if (!reducedMotion.matches && tiltDegrees > 0) {
      const dx = x / Math.max(1, rect.width) - 0.5;
      const dy = y / Math.max(1, rect.height) - 0.5;
      const tiltFactor = tiltDegrees * 2;
      const hoverScale = 1 + Math.min(0.013, tiltDegrees / 300);
      current.style.transformOrigin = '50% 50%';
      current.style.transform = `perspective(900px) rotateX(${(-dy * tiltFactor).toFixed(3)}deg) rotateY(${(dx * tiltFactor).toFixed(3)}deg) scale(${hoverScale.toFixed(4)})`;
    } else if (tiltDegrees === 0) {
      current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  const activate = (panel, event) => {
    if (current && current !== panel) settle(current);
    const previous = settleTimers.get(panel);
    if (previous) clearTimeout(previous);
    current = panel;
    rect = panel.getBoundingClientRect();
    panel.setAttribute('data-glass-active', '');
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  };

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    const panel = panelFrom(event.target);
    if (!panel || (event.relatedTarget instanceof Node && panel.contains(event.relatedTarget))) return;
    activate(panel, event);
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    if (!current || event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    const panel = panelFrom(event.target);
    if (!panel || panel !== current) return;
    if (event.relatedTarget instanceof Node && panel.contains(event.relatedTarget)) return;
    settle(panel);
    current = null;
    rect = null;
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (current) settle(current);
    current = null;
    rect = null;
  }, { passive: true });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 1800);
}

function applyTilt(value, persist = true) {
  const parsed = Number.parseFloat(value);
  tiltDegrees = Number.isFinite(parsed) ? Math.min(4, Math.max(0, parsed)) : 1.2;
  const label = `${tiltDegrees.toFixed(1)}°`;
  tiltRange.value = String(tiltDegrees);
  tiltValue.value = label;
  tiltValue.textContent = label;
  tiltDemo.style.setProperty('--demo-x', `${(-tiltDegrees * 0.42).toFixed(2)}deg`);
  tiltDemo.style.setProperty('--demo-y', `${(tiltDegrees * 0.72).toFixed(2)}deg`);
  if (persist) localStorage.setItem('yilan-tilt', String(tiltDegrees));
}

function applyAccent(accent, persist = true) {
  const selected = accentThemes.some((item) => item.id === accent) ? accent : 'aurora';
  document.body.dataset.accent = selected;
  paletteGrid.querySelectorAll('.palette-option').forEach((button) => {
    const active = button.dataset.accent === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
  if (persist) localStorage.setItem('yilan-accent', selected);
  api.setAccent(selected).catch(() => {});
}

function buildPalette() {
  const fragment = document.createDocumentFragment();
  accentThemes.forEach((theme) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'palette-option';
    button.dataset.accent = theme.id;
    button.setAttribute('role', 'radio');
    button.innerHTML = `
      <span class="palette-swatch"><i></i></span>
      <span><strong>${theme.name}</strong><small>${theme.detail}</small></span>
      <b aria-hidden="true">✓</b>`;
    button.style.setProperty('--swatch-a', theme.colors[0]);
    button.style.setProperty('--swatch-b', theme.colors[1]);
    button.addEventListener('click', () => applyAccent(theme.id));
    fragment.append(button);
  });
  paletteGrid.append(fragment);
}

function firstLaunchAccent() {
  const bucketCount = accentThemes.length;
  const upperBound = 0x100000000;
  const unbiasedLimit = Math.floor(upperBound / bucketCount) * bucketCount;
  const sample = new Uint32Array(1);
  do {
    crypto.getRandomValues(sample);
  } while (sample[0] >= unbiasedLimit);
  return accentThemes[sample[0] % bucketCount].id;
}

function openSettings() {
  onboarding.classList.remove('visible');
  onboarding.setAttribute('aria-hidden', 'true');
  settingsPage.classList.add('visible');
  settingsPage.setAttribute('aria-hidden', 'false');
  document.body.classList.add('experience-open');
  closeSettingsButton.focus();
}

function closeSettings() {
  settingsPage.classList.remove('visible');
  settingsPage.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('experience-open');
  settingsTrigger.focus();
}

function cancelSettingsHold() {
  clearTimeout(settingsHoldTimer);
  settingsHoldTimer = null;
  settingsTrigger.classList.remove('holding');
}

function beginSettingsHold(event) {
  if (event.type === 'pointerdown' && event.button !== 0) return;
  cancelSettingsHold();
  settingsTrigger.classList.add('holding');
  settingsHoldTimer = setTimeout(() => {
    settingsHoldTimer = null;
    settingsTrigger.classList.remove('holding');
    openSettings();
  }, 2000);
}

function renderOnboardingPage(animate = true) {
  const page = onboardingPages[onboardingIndex];
  const update = () => {
    posterVisual.dataset.page = String(onboardingIndex);
    onboardingKicker.textContent = page.kicker;
    onboardingTitle.textContent = page.title;
    onboardingDescription.textContent = page.description;
    onboardingTags.replaceChildren(...page.tags.map((tag) => {
      const span = document.createElement('span');
      span.textContent = tag;
      return span;
    }));
    [...onboardingDots.children].forEach((dot, index) => dot.classList.toggle('active', index === onboardingIndex));
    onboardingBack.classList.toggle('hidden', onboardingIndex === 0);
    onboardingNext.querySelector('span').textContent = onboardingIndex === onboardingPages.length - 1 ? '开始使用' : '下一步';
  };

  if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  posterCopy.animate(
    [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(12px)' }],
    { duration: 150, easing: 'ease-in', fill: 'forwards' }
  ).finished.then(() => {
    update();
    posterCopy.animate(
      [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
    );
    posterVisual.animate(
      [{ opacity: 0.74, transform: 'scale(.975) rotateY(-2deg)' }, { opacity: 1, transform: 'scale(1) rotateY(0)' }],
      { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }
    );
  });
}

function openOnboarding(reset = false) {
  if (reset) onboardingIndex = 0;
  settingsPage.classList.remove('visible');
  settingsPage.setAttribute('aria-hidden', 'true');
  onboarding.classList.add('visible');
  onboarding.setAttribute('aria-hidden', 'false');
  document.body.classList.add('experience-open');
  renderOnboardingPage(false);
}

function closeOnboarding() {
  onboarding.classList.remove('visible');
  onboarding.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('experience-open');
  localStorage.setItem('yilan-onboarding-v1', 'complete');
  sourceText.focus();
}

function initializeExperience() {
  buildPalette();
  const storedTilt = localStorage.getItem('yilan-tilt');
  applyTilt(storedTilt === null ? 1.2 : storedTilt, false);
  const storedAccent = localStorage.getItem('yilan-accent');
  const initialAccent = storedAccent || firstLaunchAccent();
  if (!storedAccent) localStorage.setItem('yilan-accent', initialAccent);
  applyAccent(initialAccent, false);

  onboardingPages.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `前往教程第 ${index + 1} 页`);
    dot.addEventListener('click', () => {
      onboardingIndex = index;
      renderOnboardingPage();
    });
    onboardingDots.append(dot);
  });

  if (localStorage.getItem('yilan-onboarding-v1') !== 'complete') openOnboarding(true);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('yilan-theme', theme);
  const light = theme === 'light';
  themeToggle.setAttribute('aria-label', light ? '切换深色模式' : '切换亮色模式');
  themeToggle.title = light ? '切换深色模式' : '切换亮色模式';
  api.setTheme(theme).catch(() => {});
}

async function toggleTheme() {
  if (themeTransitioning) return;
  const nextTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  const rect = themeToggle.getBoundingClientRect();
  document.documentElement.style.setProperty('--theme-x', `${rect.left + rect.width / 2}px`);
  document.documentElement.style.setProperty('--theme-y', `${rect.top + rect.height / 2}px`);

  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyTheme(nextTheme);
    return;
  }

  themeTransitioning = true;
  themeToggle.disabled = true;
  try {
    const transition = document.startViewTransition(() => applyTheme(nextTheme));
    await transition.finished;
  } finally {
    themeToggle.disabled = false;
    themeTransitioning = false;
  }
}

function setEngineStatus({ status, detail }) {
  enginePill.dataset.state = status;
  engineText.textContent = detail || (status === 'ready' ? 'GPU 离线模型已就绪' : '正在加载本地模型');
}

function setMode(nextMode) {
  mode = nextMode;
  directionButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === nextMode);
  });
}

function setBusy(value) {
  busy = value;
  translateButton.disabled = value;
  translateButton.classList.toggle('loading-shimmer', value);
  translateButton.querySelector('.orb-icon').textContent = value ? '···' : '→';
  translateButton.querySelector('.orb-label').textContent = value ? '翻译中' : '翻译';
}

function setDefinition(entry, requestedWord) {
  dictionaryPanel.animate(
    [{ transform: 'translateY(4px)', opacity: 0.82 }, { transform: 'translateY(0)', opacity: 1 }],
    { duration: 180, easing: 'ease-out' }
  );
  if (!entry) {
    wordTitle.textContent = requestedWord || '未收录';
    languageBadge.textContent = '本地词典';
    definitionText.textContent = '本地词典暂未收录这个词。';
    return;
  }
  const canonical = entry.word;
  wordTitle.textContent = canonical.toLocaleLowerCase() === String(requestedWord).toLocaleLowerCase()
    ? canonical
    : `${requestedWord}  →  ${canonical}`;
  languageBadge.textContent = entry.lang === 'en' ? '英 → 中' : '中 → 英';
  definitionText.textContent = entry.definition;
}

async function inspectSourceWord() {
  const text = sourceText.value;
  if (!text) return;
  const result = await api.wordAt({ text, offset: sourceText.selectionStart });
  if (result) setDefinition(result.entry, result.word);
}

async function renderTranslation(text) {
  const tokens = await api.tokenize(text);
  outputText.replaceChildren();
  outputText.classList.remove('empty');
  const fragment = document.createDocumentFragment();
  for (const token of tokens) {
    if (!token.word) {
      fragment.append(document.createTextNode(token.text));
      continue;
    }
    const span = document.createElement('span');
    span.className = `word-token${token.known ? '' : ' unknown'}`;
    span.textContent = token.text;
    span.tabIndex = 0;
    span.dataset.word = token.word;
    span.addEventListener('click', async () => {
      const entry = await api.lookup(token.word);
      setDefinition(entry, token.word);
    });
    span.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const entry = await api.lookup(token.word);
        setDefinition(entry, token.word);
      }
    });
    fragment.append(span);
  }
  outputText.append(fragment);
}

async function translate() {
  if (busy) return;
  const text = sourceText.value.trim();
  if (!text) {
    showToast('请先输入需要翻译的句子');
    sourceText.focus();
    return;
  }
  setBusy(true);
  translationMeta.textContent = '本地模型正在生成译文…';
  try {
    const result = await api.translate({ text, mode });
    lastTranslation = result.text;
    await renderTranslation(result.text);
    const direction = result.direction === 'zh-en' ? '中文 → English' : 'English → 中文';
    translationMeta.textContent = `${direction} · ${(result.elapsedMs / 1000).toFixed(1)} 秒 · 全程离线`;
  } catch (error) {
    translationMeta.textContent = '翻译失败';
    showToast(error?.message || String(error));
  } finally {
    setBusy(false);
  }
}

function clearAll() {
  sourceText.value = '';
  lastTranslation = '';
  charCount.textContent = '0 / 3000';
  outputText.className = 'output-surface empty';
  outputText.innerHTML = `
    <div class="empty-state">
      <div class="empty-glyph" aria-hidden="true"><span>A</span><i>译</i></div>
      <p>译文将在这里呈现</p>
    </div>`;
  wordTitle.textContent = '逐词释义';
  languageBadge.textContent = '离线词典';
  definitionText.textContent = '点击原文或译文中的中文词语、英文单词，即可查看详细含义。';
  translationMeta.textContent = '全程离线，不上传文本';
  sourceText.focus();
}

async function copyTranslation() {
  if (!lastTranslation) {
    showToast('当前没有可复制的译文');
    return;
  }
  await navigator.clipboard.writeText(lastTranslation);
  showToast('译文已复制');
}

async function swap() {
  if (mode === 'zh-en') setMode('en-zh');
  else if (mode === 'en-zh') setMode('zh-en');
  else setMode(/[\u3400-\u4dbf\u4e00-\u9fff]/u.test(sourceText.value) ? 'en-zh' : 'zh-en');
  if (lastTranslation) {
    const previousSource = sourceText.value;
    sourceText.value = lastTranslation;
    lastTranslation = previousSource;
    await renderTranslation(previousSource);
    charCount.textContent = `${sourceText.value.length} / 3000`;
  }
}

directionButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
translateButton.addEventListener('click', translate);
clearButton.addEventListener('click', clearAll);
copyButton.addEventListener('click', copyTranslation);
swapButton.addEventListener('click', swap);
themeToggle.addEventListener('click', toggleTheme);
windowMinimize.addEventListener('click', () => api.windowControl('minimize'));
windowMaximize.addEventListener('click', async () => {
  const state = await api.windowControl('maximize');
  windowMaximize.dataset.maximized = String(Boolean(state?.maximized));
  windowMaximize.title = state?.maximized ? '还原' : '最大化';
  windowMaximize.setAttribute('aria-label', windowMaximize.title);
});
windowClose.addEventListener('click', () => api.windowControl('close'));
settingsTrigger.addEventListener('pointerdown', beginSettingsHold);
settingsTrigger.addEventListener('pointerup', cancelSettingsHold);
settingsTrigger.addEventListener('pointercancel', cancelSettingsHold);
settingsTrigger.addEventListener('pointerleave', cancelSettingsHold);
settingsTrigger.addEventListener('contextmenu', (event) => event.preventDefault());
settingsTrigger.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') openSettings();
  if (event.key === ' ') beginSettingsHold(event);
});
settingsTrigger.addEventListener('keyup', (event) => {
  if (event.key === ' ') cancelSettingsHold();
});
closeSettingsButton.addEventListener('click', closeSettings);
tiltRange.addEventListener('input', () => applyTilt(tiltRange.value));
replayOnboardingButton.addEventListener('click', () => openOnboarding(true));
onboardingSkip.addEventListener('click', closeOnboarding);
onboardingBack.addEventListener('click', () => {
  if (onboardingIndex > 0) {
    onboardingIndex -= 1;
    renderOnboardingPage();
  }
});
onboardingNext.addEventListener('click', () => {
  if (onboardingIndex < onboardingPages.length - 1) {
    onboardingIndex += 1;
    renderOnboardingPage();
  } else {
    closeOnboarding();
  }
});
sourceText.addEventListener('input', () => {
  charCount.textContent = `${sourceText.value.length} / 3000`;
});
sourceText.addEventListener('click', inspectSourceWord);
sourceText.addEventListener('keyup', (event) => {
  if (event.key.startsWith('Arrow')) inspectSourceWord();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && settingsPage.classList.contains('visible')) closeSettings();
  if (event.ctrlKey && event.key === 'Enter' && !document.body.classList.contains('experience-open')) translate();
});
openLogButton.addEventListener('click', () => api.openLog());

api.onEngineStatus(setEngineStatus);
api.onWindowState(({ maximized }) => {
  windowMaximize.dataset.maximized = String(Boolean(maximized));
  windowMaximize.title = maximized ? '还原' : '最大化';
  windowMaximize.setAttribute('aria-label', windowMaximize.title);
});

const storedTheme = localStorage.getItem('yilan-theme') || localStorage.getItem('offline-translator-theme');
applyTheme(storedTheme === 'light' ? 'light' : 'dark');
initializeExperience();
enableGlassInteractions();

api.appInfo()
  .then((info) => {
    const gpuComposited = info.hardwareAcceleration && info.gpuFeatures?.gpu_compositing === 'enabled';
    renderMode.textContent = gpuComposited ? 'GPU 加速 UI' : '合成 UI';
    setEngineStatus({ status: 'idle', detail: info.hardwareProfile?.label || 'CPU' });
  })
  .catch(() => setEngineStatus({ status: 'idle', detail: '离线引擎按需启动' }));

if (!document.body.classList.contains('experience-open')) sourceText.focus();
