const api = window.offlineTranslator;
const persistedExperience = (() => {
  try { return api.getExperienceSettings() || {}; }
  catch { return {}; }
})();

const sourceText = document.getElementById('sourceText');
const sourceImageButton = document.getElementById('sourceImageButton');
const sourceImageInput = document.getElementById('sourceImageInput');
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
const ocrModeGrid = document.getElementById('ocrModeGrid');
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
const sourceLanguageButton = document.getElementById('sourceLanguageButton');
const sourceLanguageCode = document.getElementById('sourceLanguageCode');
const sourceLanguageLabel = document.getElementById('sourceLanguageLabel');
const targetLanguageButton = document.getElementById('targetLanguageButton');
const targetLanguageCode = document.getElementById('targetLanguageCode');
const targetLanguageLabel = document.getElementById('targetLanguageLabel');
const languagePicker = document.getElementById('languagePicker');
const languagePickerBackdrop = document.getElementById('languagePickerBackdrop');
const languagePickerClose = document.getElementById('languagePickerClose');
const languagePickerTitle = document.getElementById('languagePickerTitle');
const languageSearchInput = document.getElementById('languageSearchInput');
const languagePickerContent = document.getElementById('languagePickerContent');
const captureButton = document.getElementById('captureButton');
const documentButton = document.getElementById('documentButton');
const captureProgress = document.getElementById('captureProgress');
const captureProgressTitle = document.getElementById('captureProgressTitle');
const captureProgressDetail = document.getElementById('captureProgressDetail');
const captureProgressPercent = document.getElementById('captureProgressPercent');
const captureProgressFill = document.getElementById('captureProgressFill');
const captureResultLayer = document.getElementById('captureResultLayer');
const captureResultBackdrop = document.getElementById('captureResultBackdrop');
const captureResultClose = document.getElementById('captureResultClose');
const captureResultMeta = document.getElementById('captureResultMeta');
const capturePreviewImage = document.getElementById('capturePreviewImage');
const capturePreviewStage = document.getElementById('capturePreviewStage');
const captureBlockLayer = document.getElementById('captureBlockLayer');
const captureDragSelection = document.getElementById('captureDragSelection');
const captureSourceText = document.getElementById('captureSourceText');
const captureTranslatedText = document.getElementById('captureTranslatedText');
const copyCaptureSource = document.getElementById('copyCaptureSource');
const copyCaptureTranslation = document.getElementById('copyCaptureTranslation');
const captureAgain = document.getElementById('captureAgain');
const captureInsert = document.getElementById('captureInsert');
const captureCopyAndClose = document.getElementById('captureCopyAndClose');
const documentPage = document.getElementById('documentPage');
const closeDocumentPageButton = document.getElementById('closeDocumentPage');
const documentWindowMinimize = document.getElementById('documentWindowMinimize');
const documentWindowMaximize = document.getElementById('documentWindowMaximize');
const documentHeaderCopy = document.getElementById('documentHeaderCopy');
const documentParticleLayer = document.getElementById('documentParticleLayer');
const documentLayout = document.querySelector('.document-layout');
const documentSetupCard = document.querySelector('.document-setup-card');
const documentSetupContent = document.getElementById('documentSetupContent');
const documentProgressCard = document.querySelector('.document-progress-card');
const documentSetupRailButton = document.getElementById('documentSetupRailButton');
const documentVortexGuide = document.getElementById('documentVortexGuide');
const documentDropZone = document.getElementById('documentDropZone');
const documentDropTitle = document.getElementById('documentDropTitle');
const documentDropDetail = document.getElementById('documentDropDetail');
const documentFileChip = document.getElementById('documentFileChip');
const documentFileType = document.getElementById('documentFileType');
const documentFileName = document.getElementById('documentFileName');
const documentFileMeta = document.getElementById('documentFileMeta');
const clearDocumentFileButton = document.getElementById('clearDocumentFile');
const pdfScanOption = document.getElementById('pdfScanOption');
const pdfScanCheckbox = document.getElementById('pdfScanCheckbox');
const documentSourceButton = document.getElementById('documentSourceButton');
const documentSourceCode = document.getElementById('documentSourceCode');
const documentSourceLabel = document.getElementById('documentSourceLabel');
const documentTargetButton = document.getElementById('documentTargetButton');
const documentTargetCode = document.getElementById('documentTargetCode');
const documentTargetLabel = document.getElementById('documentTargetLabel');
const startDocumentTranslationButton = document.getElementById('startDocumentTranslation');
const documentEmptyState = document.getElementById('documentEmptyState');
const documentReaderView = document.getElementById('documentReaderView');
const documentReaderFormat = document.getElementById('documentReaderFormat');
const documentReaderTitle = document.getElementById('documentReaderTitle');
const documentReaderStatus = document.getElementById('documentReaderStatus');
const documentReaderPercent = document.getElementById('documentReaderPercent');
const documentReaderProgressBar = document.getElementById('documentReaderProgressBar');
const documentViewerScroll = document.getElementById('documentViewerScroll');
const documentViewerStage = document.getElementById('documentViewerStage');
const documentViewer = document.getElementById('documentViewer');
const documentZoomOut = document.getElementById('documentZoomOut');
const documentZoomIn = document.getElementById('documentZoomIn');
const documentZoomValue = document.getElementById('documentZoomValue');
const documentSelectionPanel = document.querySelector('.document-selection-panel');
const documentSelectionHint = document.getElementById('documentSelectionHint');
const documentSelectionSource = document.getElementById('documentSelectionSource');
const documentSelectionTranslation = document.getElementById('documentSelectionTranslation');
const copyDocumentSelection = document.getElementById('copyDocumentSelection');
const documentReaderMeta = document.getElementById('documentReaderMeta');
const pauseDocumentReaderTask = document.getElementById('pauseDocumentReaderTask');
const cancelDocumentReaderTask = document.getElementById('cancelDocumentReaderTask');
const showDocumentReaderOutput = document.getElementById('showDocumentReaderOutput');
const openDocumentReaderOutput = document.getElementById('openDocumentReaderOutput');
const documentTaskView = document.getElementById('documentTaskView');
const documentTaskKicker = document.getElementById('documentTaskKicker');
const documentTaskTitle = document.getElementById('documentTaskTitle');
const documentProgressPercent = document.getElementById('documentProgressPercent');
const documentProgressBar = document.getElementById('documentProgressBar');
const documentProgressCount = document.getElementById('documentProgressCount');
const documentElapsed = document.getElementById('documentElapsed');
const documentPreviewList = document.getElementById('documentPreviewList');
const documentOutputCard = document.getElementById('documentOutputCard');
const documentOutputPath = document.getElementById('documentOutputPath');
const documentErrorCard = document.getElementById('documentErrorCard');
const documentErrorText = document.getElementById('documentErrorText');
const pauseDocumentTaskButton = document.getElementById('pauseDocumentTask');
const cancelDocumentTaskButton = document.getElementById('cancelDocumentTask');
const showDocumentOutputButton = document.getElementById('showDocumentOutput');
const openDocumentOutputButton = document.getElementById('openDocumentOutput');

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

const supportedLanguages = [
  { code: 'zh', flag: 'cn', label: '中文（简体）', english: 'Chinese', chinese: '中文', prompt: '中文（简体）', aliases: '简体 中文 chinese mandarin zh cn' },
  { code: 'en', flag: 'gb', label: 'English', english: 'English', chinese: '英语', prompt: '英语', aliases: '英文 英语 english en' },
  { code: 'fr', flag: 'fr', label: 'Français', english: 'French', chinese: '法语', prompt: '法语', aliases: 'francais français french 法文 fr' },
  { code: 'pt', flag: 'pt', label: 'Português', english: 'Portuguese', chinese: '葡萄牙语', prompt: '葡萄牙语', aliases: 'portugues português portuguese 葡语 pt' },
  { code: 'es', flag: 'es', label: 'Español', english: 'Spanish', chinese: '西班牙语', prompt: '西班牙语', aliases: 'espanol español spanish 西语 es' },
  { code: 'ja', flag: 'jp', label: '日本語', english: 'Japanese', chinese: '日语', prompt: '日语', aliases: '日本语 japanese 日文 ja jp' },
  { code: 'tr', flag: 'tr', label: 'Türkçe', english: 'Turkish', chinese: '土耳其语', prompt: '土耳其语', aliases: 'turkce türkçe turkish tr' },
  { code: 'ru', flag: 'ru', label: 'Русский', english: 'Russian', chinese: '俄语', prompt: '俄语', aliases: 'русский russian 俄文 ru' },
  { code: 'ar', flag: 'sa', label: 'العربية', english: 'Arabic', chinese: '阿拉伯语', prompt: '阿拉伯语', aliases: 'arabic العربية 阿语 ar' },
  { code: 'ko', flag: 'kr', label: '한국어', english: 'Korean', chinese: '韩语', prompt: '韩语', aliases: '한국어 korean 韩文 ko kr' },
  { code: 'th', flag: 'th', label: 'ไทย', english: 'Thai', chinese: '泰语', prompt: '泰语', aliases: 'thai ไทย th' },
  { code: 'it', flag: 'it', label: 'Italiano', english: 'Italian', chinese: '意大利语', prompt: '意大利语', aliases: 'italiano italian it' },
  { code: 'de', flag: 'de', label: 'Deutsch', english: 'German', chinese: '德语', prompt: '德语', aliases: 'deutsch german 德文 de' },
  { code: 'vi', flag: 'vn', label: 'Tiếng Việt', english: 'Vietnamese', chinese: '越南语', prompt: '越南语', aliases: 'tieng viet tiếng việt vietnamese vi' },
  { code: 'ms', flag: 'my', label: 'Bahasa Melayu', english: 'Malay', chinese: '马来语', prompt: '马来语', aliases: 'malay melayu ms' },
  { code: 'id', flag: 'id', label: 'Bahasa Indonesia', english: 'Indonesian', chinese: '印尼语', prompt: '印尼语', aliases: 'indonesian indonesia id' },
  { code: 'tl', flag: 'ph', label: 'Filipino', english: 'Filipino', chinese: '菲律宾语', prompt: '菲律宾语', aliases: 'tagalog filipino tl' },
  { code: 'hi', flag: 'in', label: 'हिन्दी', english: 'Hindi', chinese: '印地语', prompt: '印地语', aliases: 'hindi हिन्दी hi' },
  { code: 'zh-Hant', flag: 'cn', label: '中文（繁體）', english: 'Traditional Chinese', chinese: '繁体中文', prompt: '繁体中文', aliases: '繁體 中文 traditional chinese zh hant tw' },
  { code: 'pl', flag: 'pl', label: 'Polski', english: 'Polish', chinese: '波兰语', prompt: '波兰语', aliases: 'polski polish pl' },
  { code: 'cs', flag: 'cz', label: 'Čeština', english: 'Czech', chinese: '捷克语', prompt: '捷克语', aliases: 'cestina čeština czech cs' },
  { code: 'nl', flag: 'nl', label: 'Nederlands', english: 'Dutch', chinese: '荷兰语', prompt: '荷兰语', aliases: 'nederlands dutch nl' },
  { code: 'km', flag: 'kh', label: 'ភាសាខ្មែរ', english: 'Khmer', chinese: '高棉语', prompt: '高棉语', aliases: 'khmer cambodian km' },
  { code: 'my', flag: 'mm', label: 'မြန်မာဘာသာ', english: 'Burmese', chinese: '缅甸语', prompt: '缅甸语', aliases: 'burmese myanmar my' },
  { code: 'fa', flag: 'ir', label: 'فارسی', english: 'Persian', chinese: '波斯语', prompt: '波斯语', aliases: 'persian farsi فارسی fa' },
  { code: 'gu', flag: 'in', label: 'ગુજરાતી', english: 'Gujarati', chinese: '古吉拉特语', prompt: '古吉拉特语', aliases: 'gujarati ગુજરાતી gu' },
  { code: 'ur', flag: 'pk', label: 'اردو', english: 'Urdu', chinese: '乌尔都语', prompt: '乌尔都语', aliases: 'urdu اردو ur' },
  { code: 'te', flag: 'in', label: 'తెలుగు', english: 'Telugu', chinese: '泰卢固语', prompt: '泰卢固语', aliases: 'telugu తెలుగు te' },
  { code: 'mr', flag: 'in', label: 'मराठी', english: 'Marathi', chinese: '马拉地语', prompt: '马拉地语', aliases: 'marathi मराठी mr' },
  { code: 'he', flag: 'il', label: 'עברית', english: 'Hebrew', chinese: '希伯来语', prompt: '希伯来语', aliases: 'hebrew עברית he iw' },
  { code: 'bn', flag: 'bd', label: 'বাংলা', english: 'Bengali', chinese: '孟加拉语', prompt: '孟加拉语', aliases: 'bengali bangla বাংলা bn' },
  { code: 'ta', flag: 'in', label: 'தமிழ்', english: 'Tamil', chinese: '泰米尔语', prompt: '泰米尔语', aliases: 'tamil தமிழ் ta' },
  { code: 'uk', flag: 'ua', label: 'Українська', english: 'Ukrainian', chinese: '乌克兰语', prompt: '乌克兰语', aliases: 'ukrainian українська uk ua' },
  { code: 'bo', flag: 'cn', label: 'བོད་ཡིག', english: 'Tibetan', chinese: '藏语', prompt: '藏语', aliases: 'tibetan བོད bo' },
  { code: 'kk', flag: 'kz', label: 'Қазақша', english: 'Kazakh', chinese: '哈萨克语', prompt: '哈萨克语', aliases: 'kazakh қазақша kk kz' },
  { code: 'mn', flag: 'mn', label: 'Монгол', english: 'Mongolian', chinese: '蒙古语', prompt: '蒙古语', aliases: 'mongolian монгол mn' },
  { code: 'ug', flag: 'cn', label: 'ئۇيغۇرچە', english: 'Uyghur', chinese: '维吾尔语', prompt: '维吾尔语', aliases: 'uyghur uighur ئۇيغۇرچە ug' },
  { code: 'yue', flag: 'cn', label: '粵語', english: 'Cantonese', chinese: '粤语', prompt: '粤语', aliases: 'cantonese 粤语 廣東話 广东话 yue' }
];

const languageByCode = new Map(supportedLanguages.map((language) => [language.code, language]));
const commonLanguageCodes = ['zh', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'ru'];

const onboardingPages = [
  {
    kicker: 'WELCOME TO YILAN',
    title: '译澜，让 38 种语言在本地流动',
    description: '无需网络，也无需账号。Hy‑MT2 在你的电脑里完成多语言翻译。',
    tags: ['38 种语言', '全程离线', 'GPU 加速']
  },
  {
    kicker: 'ONE LOCAL WORKFLOW',
    title: '输入、截图或整份文档，都在这里翻译',
    description: '从 38 种语言中选择方向。按 Ctrl + Enter 翻译句子，用 Alt + Q 框选屏幕，也可以导入文档生成新的译文文件。',
    tags: ['自动检测', '截图 OCR', '文档翻译']
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

let sourceLanguage = 'auto';
let targetLanguage = 'en';
let detectedSourceLanguage = null;
let languagePickerRole = null;
let favoriteLanguageCodes = [];
let recentLanguageCodes = [];
let languagePickerReturnFocus = null;
let languagePickerOpenFrame = 0;
let lastTranslation = '';
let busy = false;
let toastTimer = null;
let themeTransitioning = false;
let tiltDegrees = 1.2;
let onboardingIndex = 0;
let settingsHoldTimer = null;
let documentSourceLanguage = 'auto';
let documentTargetLanguage = 'en';
let selectedDocument = null;
let activeDocumentTask = null;
let lastCaptureResult = null;
let captureBusy = false;
let captureShortcutRegistered = false;
let captureOcrMode = 'smart';
let captureProgressValue = 0;
let captureProgressTarget = 0;
let captureProgressStage = '';
let captureProgressTimer = null;
let captureProgressResetTimer = null;
let documentPreviewSerial = 0;
let documentViewerCleanup = null;
let documentSelectionTimer = null;
let documentSelectionRequest = 0;
let lastDocumentSelectionTranslation = '';
let documentZoom = 1;
let documentViewerBaseWidth = 1;
let documentViewerBaseHeight = 1;
let documentViewerOffsetX = 0;
let documentViewerMeasureFrame = 0;
let documentViewerRelayoutPending = false;
let documentPanState = null;
let captureDragState = null;
let captureSelectionRequest = 0;
let documentImmersiveTimer = null;
let documentParticleFrame = 0;
let documentVortexTimer = null;
let documentVortexGuideTimer = null;
let documentSidebarAnimation = null;
let documentSetupYieldAnimations = [];
let documentProgressAnchorAnimations = [];
let documentRestoring = false;
const documentFlipAnimations = new Map();
const featureScriptPromises = new Map();

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

function hexToRgbChannels(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[\da-f]{6}$/i.test(value)) return '';
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)).join(', ');
}

function applyAccent(accent, persist = true) {
  const selectedTheme = accentThemes.find((item) => item.id === accent)
    || accentThemes.find((item) => item.id === 'orange');
  const selected = selectedTheme.id;
  const [accentA, accentB] = selectedTheme.colors;
  const rootStyle = document.documentElement.style;
  document.documentElement.dataset.accent = selected;
  rootStyle.setProperty('--accent-a', accentA);
  rootStyle.setProperty('--accent-b', accentB);
  rootStyle.setProperty('--accent-a-rgb', hexToRgbChannels(accentA));
  rootStyle.setProperty('--accent-b-rgb', hexToRgbChannels(accentB));
  document.body.dataset.accent = selected;
  paletteGrid.querySelectorAll('.palette-option').forEach((button) => {
    const active = button.dataset.accent === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
  if (persist) {
    localStorage.setItem('yilan-accent', selected);
    api.setExperienceSettings({ accent: selected }).catch(() => {});
  }
  api.setAccent(selected).catch(() => {});
  syncCapturePreferences();
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

function normalizeLanguageSearch(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

function readStoredLanguageCodes(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((code) => languageByCode.has(code)))];
  } catch {
    return [];
  }
}

function languageDisplayName(code) {
  return languageByCode.get(code)?.label || code;
}

function renderLanguageMark(element, language, automatic = false) {
  element.replaceChildren();
  element.classList.toggle('automatic', automatic);
  element.classList.toggle('flag-mark', !automatic);
  element.setAttribute('aria-hidden', 'true');

  if (automatic) {
    element.textContent = 'AUTO';
    return;
  }

  const flag = document.createElement('img');
  flag.src = `assets/flags/${language.flag}.svg`;
  flag.alt = '';
  flag.decoding = 'async';
  flag.draggable = false;
  element.append(flag);
}

function persistLanguageRoute() {
  localStorage.setItem('yilan-source-language', sourceLanguage);
  localStorage.setItem('yilan-target-language', targetLanguage);
  syncCapturePreferences();
}

function syncCapturePreferences() {
  const accent = accentThemes.find((item) => item.id === document.body.dataset.accent) || accentThemes[0];
  api.setCapturePreferences({
    sourceLanguage,
    targetLanguage,
    ocrMode: captureOcrMode,
    theme: document.body.dataset.theme === 'light' ? 'light' : 'dark',
    accentA: accent.colors[0],
    accentB: accent.colors[1]
  }).then((result) => {
    captureShortcutRegistered = Boolean(result?.shortcutRegistered);
    updateCaptureButtonHint();
  }).catch(() => {});
}

function updateCaptureButtonHint() {
  const modeHint = captureOcrMode === 'specified' ? ' · 指定语言极速' : captureOcrMode === 'compatible' ? ' · 兼容融合' : '';
  captureButton.title = captureShortcutRegistered
    ? `截图翻译 · Alt+Q${modeHint}`
    : `截图翻译${modeHint}`;
  captureButton.setAttribute('aria-label', captureButton.title);
}

function applyCaptureOcrMode(mode, persist = true) {
  captureOcrMode = ['smart', 'compatible', 'specified'].includes(mode) ? mode : 'smart';
  for (const option of ocrModeGrid.querySelectorAll('[data-ocr-mode]')) {
    const active = option.dataset.ocrMode === captureOcrMode;
    option.classList.toggle('active', active);
    option.setAttribute('aria-checked', String(active));
  }
  if (persist) localStorage.setItem('yilan-capture-ocr-mode', captureOcrMode);
  syncCapturePreferences();
  updateCaptureButtonHint();
}

function noteRecentLanguage(code) {
  if (!languageByCode.has(code)) return;
  recentLanguageCodes = [code, ...recentLanguageCodes.filter((item) => item !== code)].slice(0, 5);
  localStorage.setItem('yilan-recent-languages', JSON.stringify(recentLanguageCodes));
}

function updateLanguageControlState() {
  sourceLanguageButton.disabled = busy;
  targetLanguageButton.disabled = busy;
  const hasEffectiveSource = sourceLanguage !== 'auto' || Boolean(detectedSourceLanguage);
  swapButton.disabled = busy || !hasEffectiveSource;
  const documentTaskLocked = activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status);
  documentSourceButton.disabled = Boolean(documentTaskLocked);
  documentTargetButton.disabled = Boolean(documentTaskLocked);
  documentDropZone.disabled = Boolean(documentTaskLocked);
  pdfScanCheckbox.disabled = Boolean(documentTaskLocked);
  startDocumentTranslationButton.disabled = !selectedDocument || Boolean(documentTaskLocked);
  openDocumentReaderOutput.disabled = !(activeDocumentTask?.status === 'completed' && activeDocumentTask.outputPath);
}

function renderLanguageRoute() {
  const source = sourceLanguage === 'auto' ? null : languageByCode.get(sourceLanguage);
  const detected = languageByCode.get(detectedSourceLanguage);
  const target = languageByCode.get(targetLanguage) || languageByCode.get('en');

  renderLanguageMark(sourceLanguageCode, source, !source);
  sourceLanguageLabel.textContent = source
    ? source.label
    : detected
      ? `自动检测 · ${detected.label}`
      : '自动检测';
  sourceLanguageButton.dataset.language = sourceLanguage;
  sourceLanguageButton.classList.toggle('detected', !source && Boolean(detected));
  sourceLanguageButton.title = source ? `${source.chinese} · ${source.english}` : '让 Hy‑MT2 自动识别输入语言';

  renderLanguageMark(targetLanguageCode, target);
  targetLanguageLabel.textContent = target.label;
  targetLanguageButton.dataset.language = target.code;
  targetLanguageButton.title = `${target.chinese} · ${target.english}`;
  updateLanguageControlState();
}

function renderDocumentLanguageRoute() {
  const source = documentSourceLanguage === 'auto' ? null : languageByCode.get(documentSourceLanguage);
  const target = languageByCode.get(documentTargetLanguage) || languageByCode.get('en');
  renderLanguageMark(documentSourceCode, source, !source);
  documentSourceLabel.textContent = source ? source.label : '自动检测';
  documentSourceButton.title = source ? `${source.chinese} · ${source.english}` : '自动识别文档语言';
  renderLanguageMark(documentTargetCode, target);
  documentTargetLabel.textContent = target.label;
  documentTargetButton.title = `${target.chinese} · ${target.english}`;
  updateLanguageControlState();
}

function toggleFavoriteLanguage(code) {
  if (!languageByCode.has(code)) return;
  const favorite = favoriteLanguageCodes.includes(code);
  favoriteLanguageCodes = favorite
    ? favoriteLanguageCodes.filter((item) => item !== code)
    : [...favoriteLanguageCodes, code];
  localStorage.setItem('yilan-favorite-languages', JSON.stringify(favoriteLanguageCodes));
  renderLanguagePicker();
  showToast(favorite ? `已取消收藏 ${languageDisplayName(code)}` : `已收藏 ${languageDisplayName(code)}`);
}

function chooseLanguage(code) {
  if (languagePickerRole === 'source') {
    const previousEffectiveSource = sourceLanguage === 'auto' ? detectedSourceLanguage : sourceLanguage;
    sourceLanguage = code === 'auto' ? 'auto' : code;
    detectedSourceLanguage = null;
    if (sourceLanguage !== 'auto') {
      noteRecentLanguage(sourceLanguage);
      if (sourceLanguage === targetLanguage) {
        targetLanguage = previousEffectiveSource && previousEffectiveSource !== sourceLanguage
          ? previousEffectiveSource
          : sourceLanguage === 'en' ? 'zh' : 'en';
        noteRecentLanguage(targetLanguage);
      }
    }
  } else if (languagePickerRole === 'target') {
    if (!languageByCode.has(code)) return;
    if (sourceLanguage !== 'auto' && sourceLanguage === code) {
      showToast('源语言和目标语言不能相同');
      return;
    }
    targetLanguage = code;
    noteRecentLanguage(targetLanguage);
  } else if (languagePickerRole === 'document-source') {
    const previousSource = documentSourceLanguage;
    documentSourceLanguage = code === 'auto' ? 'auto' : code;
    if (documentSourceLanguage !== 'auto') {
      noteRecentLanguage(documentSourceLanguage);
      if (documentSourceLanguage === documentTargetLanguage) {
        documentTargetLanguage = previousSource !== 'auto' && previousSource !== documentSourceLanguage
          ? previousSource
          : documentSourceLanguage === 'en' ? 'zh' : 'en';
        noteRecentLanguage(documentTargetLanguage);
      }
    }
    localStorage.setItem('yilan-document-source-language', documentSourceLanguage);
    localStorage.setItem('yilan-document-target-language', documentTargetLanguage);
    renderDocumentLanguageRoute();
    closeLanguagePicker();
    return;
  } else if (languagePickerRole === 'document-target') {
    if (!languageByCode.has(code)) return;
    if (documentSourceLanguage !== 'auto' && documentSourceLanguage === code) {
      showToast('源语言和目标语言不能相同');
      return;
    }
    documentTargetLanguage = code;
    noteRecentLanguage(code);
    localStorage.setItem('yilan-document-target-language', documentTargetLanguage);
    renderDocumentLanguageRoute();
    closeLanguagePicker();
    return;
  } else {
    return;
  }
  persistLanguageRoute();
  renderLanguageRoute();
  translationMeta.textContent = `${sourceLanguage === 'auto' ? '自动检测' : languageDisplayName(sourceLanguage)} → ${languageDisplayName(targetLanguage)} · 全程离线`;
  closeLanguagePicker();
}

function createLanguageOption(code) {
  const automatic = code === 'auto';
  const language = automatic ? null : languageByCode.get(code);
  if (!automatic && !language) return null;

  const row = document.createElement('div');
  row.className = `language-option${automatic ? ' automatic' : ''}`;
  const choice = document.createElement('button');
  choice.type = 'button';
  choice.className = 'language-choice';
  choice.dataset.language = code;
  const selected = languagePickerRole === 'source'
    ? sourceLanguage === code
    : languagePickerRole === 'target'
      ? targetLanguage === code
      : languagePickerRole === 'document-source'
        ? documentSourceLanguage === code
        : documentTargetLanguage === code;
  choice.classList.toggle('active', selected);
  choice.setAttribute('aria-pressed', String(selected));

  const codeTile = document.createElement('span');
  codeTile.className = 'language-option-code';
  renderLanguageMark(codeTile, language, automatic);
  const copy = document.createElement('span');
  copy.className = 'language-option-copy';
  const strong = document.createElement('strong');
  strong.textContent = automatic ? '自动检测' : language.label;
  const small = document.createElement('small');
  small.textContent = automatic ? '根据输入识别源语言' : `${language.chinese} · ${language.english}`;
  copy.append(strong, small);
  const check = document.createElement('span');
  check.className = 'language-option-check';
  check.textContent = '✓';
  choice.append(codeTile, copy, check);

  const unavailable = (languagePickerRole === 'target' && sourceLanguage !== 'auto' && sourceLanguage === code)
    || (languagePickerRole === 'document-target' && documentSourceLanguage !== 'auto' && documentSourceLanguage === code);
  choice.disabled = unavailable;
  if (unavailable) choice.title = '已选为源语言';
  choice.addEventListener('click', () => chooseLanguage(code));
  if (!automatic) {
    choice.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      toggleFavoriteLanguage(code);
    });
  }
  row.append(choice);

  if (!automatic) {
    const favoriteButton = document.createElement('button');
    favoriteButton.type = 'button';
    favoriteButton.className = 'language-favorite';
    const favorite = favoriteLanguageCodes.includes(code);
    favoriteButton.classList.toggle('active', favorite);
    favoriteButton.textContent = favorite ? '★' : '☆';
    favoriteButton.title = favorite ? `取消收藏 ${language.label}` : `收藏 ${language.label}`;
    favoriteButton.setAttribute('aria-label', favoriteButton.title);
    favoriteButton.addEventListener('click', () => toggleFavoriteLanguage(code));
    row.append(favoriteButton);
  }
  return row;
}

function appendLanguageSection(title, codes, detail = '') {
  const validCodes = codes.filter((code) => code === 'auto' || languageByCode.has(code));
  if (validCodes.length === 0) return;
  const section = document.createElement('section');
  section.className = 'language-section';
  const heading = document.createElement('header');
  const headingTitle = document.createElement('strong');
  headingTitle.textContent = title;
  const headingDetail = document.createElement('span');
  headingDetail.textContent = detail || `${validCodes.length} 项`;
  heading.append(headingTitle, headingDetail);
  const grid = document.createElement('div');
  grid.className = 'language-grid';
  validCodes.forEach((code) => {
    const option = createLanguageOption(code);
    if (option) grid.append(option);
  });
  section.append(heading, grid);
  languagePickerContent.append(section);
}

function renderLanguagePicker() {
  if (!languagePickerRole) return;
  languagePickerContent.replaceChildren();
  const query = normalizeLanguageSearch(languageSearchInput.value);
  if (query) {
    const results = supportedLanguages
      .filter((language) => normalizeLanguageSearch(`${language.code} ${language.label} ${language.english} ${language.chinese} ${language.aliases}`).includes(query))
      .map((language) => language.code);
    const autoMatches = ['source', 'document-source'].includes(languagePickerRole)
      && normalizeLanguageSearch('auto 自动检测 自动识别 detect language').includes(query);
    const combined = autoMatches ? ['auto', ...results] : results;
    if (combined.length > 0) {
      appendLanguageSection('搜索结果', combined, `${combined.length} 项匹配`);
    } else {
      const empty = document.createElement('div');
      empty.className = 'language-search-empty';
      empty.innerHTML = '<span>⌕</span><strong>没有找到这种语言</strong><small>试试中文名、English name 或语言代码</small>';
      languagePickerContent.append(empty);
    }
    return;
  }

  if (['source', 'document-source'].includes(languagePickerRole)) appendLanguageSection('智能识别', ['auto'], '推荐');
  appendLanguageSection('最近使用', recentLanguageCodes, '本机记录');
  appendLanguageSection('已收藏', favoriteLanguageCodes, favoriteLanguageCodes.length ? '快速访问' : '点击 ☆ 添加');
  appendLanguageSection('常用语言', commonLanguageCodes, '常用');
  appendLanguageSection('全部语言', supportedLanguages.map((language) => language.code), '38 种');
}

function openLanguagePicker(role) {
  const documentTaskLocked = activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status);
  if (busy || (documentTaskLocked && role.startsWith('document-'))
      || !['source', 'target', 'document-source', 'document-target'].includes(role)) return;
  cancelAnimationFrame(languagePickerOpenFrame);
  languagePickerRole = role;
  const sourceRole = role === 'source' || role === 'document-source';
  languagePickerReturnFocus = role === 'source'
    ? sourceLanguageButton
    : role === 'target'
      ? targetLanguageButton
      : role === 'document-source'
        ? documentSourceButton
        : documentTargetButton;
  languagePickerTitle.textContent = sourceRole ? '选择源语言' : '选择目标语言';
  languageSearchInput.value = '';
  languagePicker.classList.remove('visible');
  languagePicker.setAttribute('aria-hidden', 'false');
  document.body.classList.add('language-picker-open');
  languagePicker.classList.add('active');
  sourceLanguageButton.setAttribute('aria-expanded', String(role === 'source'));
  targetLanguageButton.setAttribute('aria-expanded', String(role === 'target'));
  documentSourceButton.setAttribute('aria-expanded', String(role === 'document-source'));
  documentTargetButton.setAttribute('aria-expanded', String(role === 'document-target'));
  renderLanguagePicker();
  languagePickerOpenFrame = requestAnimationFrame(() => {
    languagePickerOpenFrame = requestAnimationFrame(() => {
      languagePickerOpenFrame = 0;
      if (!languagePicker.classList.contains('active')) return;
      languagePicker.classList.add('visible');
      languageSearchInput.focus({ preventScroll: true });
    });
  });
}

function closeLanguagePicker() {
  if (!languagePicker.classList.contains('active')) return;
  cancelAnimationFrame(languagePickerOpenFrame);
  languagePickerOpenFrame = 0;
  languagePicker.classList.remove('visible');
  languagePicker.classList.remove('active');
  languagePicker.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('language-picker-open');
  sourceLanguageButton.setAttribute('aria-expanded', 'false');
  targetLanguageButton.setAttribute('aria-expanded', 'false');
  documentSourceButton.setAttribute('aria-expanded', 'false');
  documentTargetButton.setAttribute('aria-expanded', 'false');
  const returnFocus = languagePickerReturnFocus;
  languagePickerRole = null;
  languagePickerReturnFocus = null;
  returnFocus?.focus();
}

function initializeLanguageRoute() {
  const storedSource = localStorage.getItem('yilan-source-language');
  const storedTarget = localStorage.getItem('yilan-target-language');
  sourceLanguage = storedSource === 'auto' || languageByCode.has(storedSource) ? storedSource : 'auto';
  targetLanguage = languageByCode.has(storedTarget) ? storedTarget : 'en';
  if (sourceLanguage !== 'auto' && sourceLanguage === targetLanguage) sourceLanguage = 'auto';
  favoriteLanguageCodes = readStoredLanguageCodes('yilan-favorite-languages');
  recentLanguageCodes = readStoredLanguageCodes('yilan-recent-languages').slice(0, 5);
  const storedDocumentSource = localStorage.getItem('yilan-document-source-language');
  const storedDocumentTarget = localStorage.getItem('yilan-document-target-language');
  documentSourceLanguage = storedDocumentSource === 'auto' || languageByCode.has(storedDocumentSource)
    ? storedDocumentSource
    : sourceLanguage;
  documentTargetLanguage = languageByCode.has(storedDocumentTarget) ? storedDocumentTarget : targetLanguage;
  if (documentSourceLanguage !== 'auto' && documentSourceLanguage === documentTargetLanguage) {
    documentSourceLanguage = 'auto';
  }
  persistLanguageRoute();
  renderLanguageRoute();
  renderDocumentLanguageRoute();
}

function openSettings() {
  closeLanguagePicker();
  closeDocumentPage(false);
  closeCaptureResult(false);
  onboarding.classList.remove('visible');
  onboarding.setAttribute('aria-hidden', 'true');
  settingsPage.classList.add('visible');
  settingsPage.setAttribute('aria-hidden', 'false');
  syncExperienceState();
  closeSettingsButton.focus();
}

function closeSettings() {
  settingsPage.classList.remove('visible');
  settingsPage.setAttribute('aria-hidden', 'true');
  syncExperienceState();
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
  closeDocumentPage(false);
  closeCaptureResult(false);
  settingsPage.classList.remove('visible');
  settingsPage.setAttribute('aria-hidden', 'true');
  onboarding.classList.add('visible');
  onboarding.setAttribute('aria-hidden', 'false');
  syncExperienceState();
  renderOnboardingPage(false);
}

function closeOnboarding() {
  onboarding.classList.remove('visible');
  onboarding.setAttribute('aria-hidden', 'true');
  syncExperienceState();
  localStorage.setItem('yilan-onboarding-v1', 'complete');
  api.setExperienceSettings({ onboardingComplete: true }).catch(() => {});
  sourceText.focus();
}

function initializeExperience() {
  buildPalette();
  applyCaptureOcrMode(localStorage.getItem('yilan-capture-ocr-mode') || 'smart', false);
  const storedTilt = localStorage.getItem('yilan-tilt');
  applyTilt(storedTilt === null ? 1.2 : storedTilt, false);
  const storedAccent = persistedExperience.accent || localStorage.getItem('yilan-accent');
  const initialAccent = accentThemes.some((item) => item.id === storedAccent) ? storedAccent : 'orange';
  if (localStorage.getItem('yilan-accent') !== initialAccent) localStorage.setItem('yilan-accent', initialAccent);
  if (persistedExperience.accent !== initialAccent) {
    api.setExperienceSettings({ accent: initialAccent }).catch(() => {});
  }
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

  const onboardingComplete = persistedExperience.onboardingComplete === true
    || localStorage.getItem('yilan-onboarding-v1') === 'complete';
  if (onboardingComplete) {
    localStorage.setItem('yilan-onboarding-v1', 'complete');
    if (persistedExperience.onboardingComplete !== true) {
      api.setExperienceSettings({ onboardingComplete: true }).catch(() => {});
    }
  } else {
    openOnboarding(true);
  }
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('yilan-theme', theme);
  api.setExperienceSettings({ theme }).catch(() => {});
  const light = theme === 'light';
  themeToggle.setAttribute('aria-label', light ? '切换深色模式' : '切换亮色模式');
  themeToggle.title = light ? '切换深色模式' : '切换亮色模式';
  api.setTheme(theme).catch(() => {});
  syncCapturePreferences();
}

async function toggleTheme() {
  if (themeTransitioning) return;
  const nextTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  const rect = themeToggle.getBoundingClientRect();
  const revealX = rect.left + rect.width / 2;
  const revealY = rect.top + rect.height / 2;
  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const revealRadius = Math.max(
    Math.hypot(revealX, revealY),
    Math.hypot(viewportWidth - revealX, revealY),
    Math.hypot(revealX, viewportHeight - revealY),
    Math.hypot(viewportWidth - revealX, viewportHeight - revealY)
  ) + 4;
  document.documentElement.style.setProperty('--theme-x', `${revealX}px`);
  document.documentElement.style.setProperty('--theme-y', `${revealY}px`);
  document.documentElement.style.setProperty('--theme-radius', `${revealRadius}px`);

  const canReveal = document.startViewTransition
    && CSS.supports('clip-path', 'circle(0px at 0px 0px)')
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canReveal) {
    applyTheme(nextTheme);
    return;
  }

  themeTransitioning = true;
  themeToggle.disabled = true;
  themeToggle.setAttribute('aria-busy', 'true');
  document.documentElement.dataset.themeTransition = 'active';
  let themeCommitted = false;
  try {
    const transition = document.startViewTransition(() => {
      applyTheme(nextTheme);
      themeCommitted = true;
    });
    await transition.ready;
    await transition.finished;
  } catch {
    if (!themeCommitted) applyTheme(nextTheme);
  } finally {
    document.documentElement.removeAttribute('data-theme-transition');
    themeToggle.removeAttribute('aria-busy');
    themeToggle.disabled = false;
    themeTransitioning = false;
  }
}

function setEngineStatus({ status, detail }) {
  enginePill.dataset.state = status;
  engineText.textContent = detail || (status === 'ready' ? 'GPU 离线模型已就绪' : '正在加载本地模型');
}

function setBusy(value) {
  busy = value;
  translateButton.disabled = value;
  translateButton.classList.toggle('loading-shimmer', value);
  translateButton.querySelector('.orb-icon').textContent = value ? '···' : '→';
  translateButton.querySelector('.orb-label').textContent = value ? '翻译中' : '翻译';
  updateLanguageControlState();
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
  } else {
    const canonical = entry.word;
    wordTitle.textContent = canonical.toLocaleLowerCase() === String(requestedWord).toLocaleLowerCase()
      ? canonical
      : `${requestedWord}  →  ${canonical}`;
    languageBadge.textContent = entry.lang === 'en' ? '英 → 中' : '中 → 英';
    definitionText.textContent = entry.definition;
  }
  definitionText.scrollTop = 0;
  requestAnimationFrame(() => {
    definitionText.scrollTop = 0;
  });
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
    const result = await api.translate({ text, sourceLanguage, targetLanguage });
    detectedSourceLanguage = sourceLanguage === 'auto' ? result.detectedSourceLanguage : null;
    if (detectedSourceLanguage) noteRecentLanguage(detectedSourceLanguage);
    noteRecentLanguage(result.targetLanguage);
    renderLanguageRoute();
    lastTranslation = result.text;
    await renderTranslation(result.text);
    const effectiveSource = result.detectedSourceLanguage || result.sourceLanguage;
    const direction = `${languageDisplayName(effectiveSource)} → ${languageDisplayName(result.targetLanguage)}`;
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
  detectedSourceLanguage = null;
  renderLanguageRoute();
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
  definitionText.scrollTop = 0;
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
  if (busy) return;
  const effectiveSource = sourceLanguage === 'auto' ? detectedSourceLanguage : sourceLanguage;
  if (!effectiveSource || !languageByCode.has(effectiveSource)) {
    showToast('请先输入并翻译一次，让译澜识别源语言');
    return;
  }
  const previousTarget = targetLanguage;
  sourceLanguage = previousTarget;
  targetLanguage = effectiveSource;
  detectedSourceLanguage = null;
  persistLanguageRoute();
  noteRecentLanguage(sourceLanguage);
  noteRecentLanguage(targetLanguage);
  renderLanguageRoute();
  if (lastTranslation) {
    const previousSource = sourceText.value;
    sourceText.value = lastTranslation;
    lastTranslation = previousSource;
    await renderTranslation(previousSource);
    charCount.textContent = `${sourceText.value.length} / 3000`;
  }
  translationMeta.textContent = `${languageDisplayName(sourceLanguage)} → ${languageDisplayName(targetLanguage)} · 全程离线`;
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(value < 10 * 1024 ** 2 ? 1 : 0)} MB`;
}

function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.round(Number(milliseconds || 0) / 1000));
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} 分 ${seconds % 60} 秒`;
}

function syncExperienceState() {
  const visible = [settingsPage, onboarding, documentPage].some((element) => element.classList.contains('visible'));
  document.body.classList.toggle('experience-open', visible);
}

function clearDocumentParticles() {
  if (documentParticleFrame) cancelAnimationFrame(documentParticleFrame);
  documentParticleFrame = 0;
  const context = documentParticleLayer.getContext('2d');
  if (context) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, documentParticleLayer.width, documentParticleLayer.height);
  }
}

function emitDocumentHeaderParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  clearDocumentParticles();
  const pageBounds = documentPage.getBoundingClientRect();
  const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  documentParticleLayer.width = Math.max(1, Math.round(pageBounds.width * pixelRatio));
  documentParticleLayer.height = Math.max(1, Math.round(pageBounds.height * pixelRatio));
  const context = documentParticleLayer.getContext('2d', { alpha: true });
  if (!context) return;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-a').trim() || '#ffad55';
  const sources = [
    { element: documentHeaderCopy.querySelector('.experience-kicker'), count: 28 },
    { element: documentHeaderCopy.querySelector('h1'), count: 142 },
    { element: documentHeaderCopy.querySelector('p'), count: 52 }
  ].filter((source) => source.element);
  const particles = [];
  for (const source of sources) {
    const bounds = source.element.getBoundingClientRect();
    const computed = getComputedStyle(source.element);
    const textColor = computed.color;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = Math.max(1, Math.ceil(bounds.width));
    sampleCanvas.height = Math.max(1, Math.ceil(bounds.height));
    const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    const points = [];
    if (sampleContext) {
      sampleContext.font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      sampleContext.textBaseline = 'middle';
      sampleContext.fillStyle = '#fff';
      if ('letterSpacing' in sampleContext) sampleContext.letterSpacing = computed.letterSpacing;
      sampleContext.fillText(source.element.textContent || '', 0, sampleCanvas.height / 2, sampleCanvas.width);
      const pixels = sampleContext.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      for (let y = 0; y < sampleCanvas.height; y += 2) {
        for (let x = 0; x < sampleCanvas.width; x += 2) {
          if (pixels[((y * sampleCanvas.width + x) * 4) + 3] > 72) points.push({ x, y });
        }
      }
    }
    for (let index = 0; index < source.count; index += 1) {
      const sampled = points.length ? points[Math.floor(Math.random() * points.length)] : null;
      const localX = sampled ? sampled.x + Math.random() * 2 : bounds.width * Math.pow(Math.random(), .76);
      const localY = sampled ? sampled.y + Math.random() * 2 : bounds.height * Math.random();
      const horizontal = Math.min(1, localX / Math.max(1, bounds.width));
      particles.push({
        x: bounds.left - pageBounds.left + localX,
        y: bounds.top - pageBounds.top + localY,
        vx: 54 + Math.random() * 150,
        vy: -44 + Math.random() * 88,
        curve: -22 + Math.random() * 44,
        size: .8 + Math.random() * 2.45,
        delay: 20 + horizontal * 210 + Math.random() * 70,
        life: 500 + Math.random() * 250,
        color: index % 5 === 0 ? accent : textColor
      });
    }
  }
  const startedAt = performance.now();
  const paint = (now) => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, documentParticleLayer.width, documentParticleLayer.height);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    let active = false;
    for (const particle of particles) {
      const elapsed = now - startedAt - particle.delay;
      if (elapsed < 0) {
        active = true;
        continue;
      }
      const progress = Math.min(1, elapsed / particle.life);
      if (progress >= 1) continue;
      active = true;
      const eased = 1 - ((1 - progress) ** 3);
      const alpha = Math.min(1, progress / .12) * ((1 - progress) ** 1.3);
      const x = particle.x + particle.vx * eased;
      const y = particle.y + particle.vy * eased + Math.sin(progress * Math.PI) * particle.curve;
      context.globalAlpha = alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(x, y, particle.size * (1 - progress * .55), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (active) documentParticleFrame = requestAnimationFrame(paint);
    else clearDocumentParticles();
  };
  documentParticleFrame = requestAnimationFrame(paint);
}

function animateDocumentFlip(element, firstBounds, duration = 380, positionOnly = false) {
  if (!element || !firstBounds || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const lastBounds = element.getBoundingClientRect();
  if (!lastBounds.width || !lastBounds.height) return null;
  const deltaX = firstBounds.left - lastBounds.left;
  const deltaY = firstBounds.top - lastBounds.top;
  const scaleX = positionOnly ? 1 : firstBounds.width / lastBounds.width;
  const scaleY = positionOnly ? 1 : firstBounds.height / lastBounds.height;
  documentFlipAnimations.get(element)?.cancel();
  const animation = element.animate([
    { transformOrigin: '0 0', transform: `translate3d(${deltaX}px,${deltaY}px,0) scale(${scaleX},${scaleY})` },
    { transformOrigin: '0 0', transform: 'translate3d(0,0,0) scale(1)' }
  ], { duration, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  documentFlipAnimations.set(element, animation);
  animation.finished.catch(() => {}).finally(() => {
    if (animation.playState === 'finished') animation.cancel();
    if (documentFlipAnimations.get(element) === animation) documentFlipAnimations.delete(element);
  });
  return animation;
}

function cancelDocumentProgressAnchorAnimations() {
  documentProgressAnchorAnimations.forEach((animation) => animation.cancel());
  documentProgressAnchorAnimations = [];
}

function animateDocumentProgressEdge(firstBounds) {
  if (!firstBounds || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const lastBounds = documentProgressCard.getBoundingClientRect();
  if (!lastBounds.width || !lastBounds.height) return null;
  const scaleX = firstBounds.width / Math.max(1, lastBounds.width);
  if (!Number.isFinite(scaleX) || Math.abs(scaleX - 1) < .001) return null;

  documentFlipAnimations.get(documentProgressCard)?.cancel();
  cancelDocumentProgressAnchorAnimations();
  const timing = { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' };
  const animation = documentProgressCard.animate([
    { transformOrigin: '100% 0', transform: `scaleX(${scaleX})` },
    { transformOrigin: '100% 0', transform: 'scaleX(1)' }
  ], timing);
  documentFlipAnimations.set(documentProgressCard, animation);

  const inverseScale = 1 / scaleX;
  const anchors = [
    documentReaderView.querySelector('.document-reader-state'),
    documentReaderView.querySelector('.document-reader-footer > div'),
    documentProgressPercent,
    documentTaskView.querySelector('.document-task-actions')
  ].filter((element) => element && element.getClientRects().length);
  const anchorAnimations = anchors.map((element) => {
    const anchorBounds = element.getBoundingClientRect();
    const rightGap = Math.max(0, lastBounds.right - anchorBounds.right);
    const compensationX = rightGap - (rightGap / scaleX);
    return element.animate([
      { transformOrigin: '100% 0', transform: `translateX(${compensationX}px) scaleX(${inverseScale})` },
      { transformOrigin: '100% 0', transform: 'translateX(0) scaleX(1)' }
    ], timing);
  });
  documentProgressAnchorAnimations = anchorAnimations;

  animation.finished.catch(() => {}).finally(() => {
    anchorAnimations.forEach((anchorAnimation) => anchorAnimation.cancel());
    if (documentProgressAnchorAnimations === anchorAnimations) documentProgressAnchorAnimations = [];
    if (documentFlipAnimations.get(documentProgressCard) !== animation) return;
    if (animation.playState === 'finished') animation.cancel();
    documentFlipAnimations.delete(documentProgressCard);
  });
  return animation;
}

function animateDocumentActionButton(element, delay = 0) {
  if (!element || element.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  element.getAnimations().forEach((animation) => animation.cancel());
  element.animate([
    { opacity: 0, transform: 'translate3d(0,14px,0) scale(.94)' },
    { offset: .72, opacity: 1, transform: 'translate3d(0,-2px,0) scale(1.018)' },
    { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
  ], { duration: 520, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
}

function animateDocumentReaderArrival(delay = 0) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const parts = [
    documentReaderView.querySelector('.document-reader-header'),
    documentReaderView.querySelector('.document-reader-progress'),
    documentReaderView.querySelector('.document-reader-grid'),
    documentReaderView.querySelector('.document-reader-footer')
  ].filter(Boolean);
  parts.forEach((element, index) => {
    element.animate([
      { opacity: 0, transform: 'translate3d(0,10px,0)' },
      { opacity: 1, transform: 'translate3d(0,0,0)' }
    ], { duration: 440, delay: delay + index * 34, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
  });
}

function renderDocumentSidebarToggle(collapsed) {
  documentSetupRailButton.setAttribute('aria-expanded', String(!collapsed));
  documentSetupRailButton.setAttribute('aria-label', collapsed ? '展开文档设置' : '收起文档设置');
  documentSetupRailButton.title = collapsed ? '展开文档设置' : '收起文档设置';
}

function runDocumentSidebarAnimation(keyframes, options, onFinish) {
  documentSidebarAnimation?.cancel();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onFinish();
    return;
  }
  const animation = documentSetupCard.animate(keyframes, { ...options, fill: 'both' });
  documentSidebarAnimation = animation;
  animation.finished.then(() => {
    if (documentSidebarAnimation !== animation) return;
    onFinish();
    animation.cancel();
    documentSidebarAnimation = null;
  }).catch(() => {});
}

function collapseDocumentSetup() {
  if (!selectedDocument || documentPage.classList.contains('document-sidebar-collapsed') || documentPage.classList.contains('document-sidebar-collapsing') || documentPage.classList.contains('document-sidebar-expanding')) return;
  documentPage.classList.remove('document-sidebar-expanding');
  documentPage.classList.add('document-sidebar-collapsing');
  documentSetupCard.inert = true;
  renderDocumentSidebarToggle(true);
  runDocumentSidebarAnimation([
    { offset: 0, opacity: 1, transform: 'translate3d(0,0,0) rotate(0) scale(1)' },
    { offset: .26, opacity: 1, transform: 'translate3d(3px,-2px,0) rotate(.6deg) scale(.965)' },
    { offset: .7, opacity: .72, transform: 'translate3d(-7px,-8px,0) rotate(-5deg) scale(.43)' },
    { offset: 1, opacity: 0, transform: 'translate3d(-17px,-17px,0) rotate(-13deg) scale(.025)' }
  ], { duration: 620, easing: 'cubic-bezier(.2,.85,.22,1)' }, () => {
    const firstBounds = documentProgressCard.getBoundingClientRect();
    documentPage.classList.add('document-sidebar-collapsed');
    documentPage.classList.remove('document-sidebar-collapsing');
    animateDocumentProgressEdge(firstBounds);
    documentSetupRailButton.focus({ preventScroll: true });
  });
}

function expandDocumentSetup() {
  if (!documentPage.classList.contains('document-sidebar-collapsed') || documentPage.classList.contains('document-sidebar-collapsing') || documentPage.classList.contains('document-sidebar-expanding')) return;
  const firstBounds = documentProgressCard.getBoundingClientRect();
  documentPage.classList.remove('document-sidebar-collapsing', 'document-sidebar-collapsed');
  documentPage.classList.add('document-sidebar-expanding');
  documentSetupCard.inert = true;
  animateDocumentProgressEdge(firstBounds);
  renderDocumentSidebarToggle(false);
  runDocumentSidebarAnimation([
    { offset: 0, opacity: 0, transform: 'translate3d(-17px,-17px,0) rotate(-13deg) scale(.025)' },
    { offset: .48, opacity: .7, transform: 'translate3d(-6px,-7px,0) rotate(-4deg) scale(.5)' },
    { offset: .82, opacity: 1, transform: 'translate3d(3px,1px,0) rotate(.35deg) scale(1.012)' },
    { offset: 1, opacity: 1, transform: 'translate3d(0,0,0) rotate(0) scale(1)' }
  ], { duration: 620, easing: 'cubic-bezier(.2,.85,.22,1)' }, () => {
    documentPage.classList.remove('document-sidebar-expanding');
    documentSetupCard.inert = false;
    documentDropZone.focus({ preventScroll: true });
  });
}

function toggleDocumentSetup() {
  if (documentPage.classList.contains('document-sidebar-collapsed')) expandDocumentSetup();
  else collapseDocumentSetup();
}

const DOCUMENT_VORTEX_GUIDE_STORAGE_KEY = 'yilan-document-vortex-guide-v1';

function documentVortexGuideDismissed() {
  return localStorage.getItem(DOCUMENT_VORTEX_GUIDE_STORAGE_KEY) === 'dismissed';
}

function hideDocumentVortexGuide() {
  if (documentVortexGuideTimer) clearTimeout(documentVortexGuideTimer);
  documentVortexGuideTimer = null;
  documentVortexGuide.classList.remove('visible', 'leaving');
  documentVortexGuide.hidden = true;
  documentVortexGuide.setAttribute('aria-hidden', 'true');
}

function revealDocumentVortexGuide() {
  if (!selectedDocument || documentRestoring || !documentPage.classList.contains('visible') || documentVortexGuideDismissed()) {
    hideDocumentVortexGuide();
    return;
  }
  if (documentVortexGuideTimer) clearTimeout(documentVortexGuideTimer);
  documentVortexGuideTimer = null;
  documentVortexGuide.hidden = false;
  documentVortexGuide.setAttribute('aria-hidden', 'false');
  documentVortexGuide.classList.remove('visible', 'leaving');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    documentVortexGuide.classList.add('visible');
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!selectedDocument || documentVortexGuideDismissed()) {
      hideDocumentVortexGuide();
      return;
    }
    documentVortexGuide.classList.add('visible');
  }));
}

function dismissDocumentVortexGuide() {
  localStorage.setItem(DOCUMENT_VORTEX_GUIDE_STORAGE_KEY, 'dismissed');
  if (documentVortexGuideTimer) clearTimeout(documentVortexGuideTimer);
  documentVortexGuideTimer = null;
  if (documentVortexGuide.hidden) {
    hideDocumentVortexGuide();
    return;
  }
  documentVortexGuide.classList.remove('visible');
  documentVortexGuide.classList.add('leaving');
  const finish = () => hideDocumentVortexGuide();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else documentVortexGuideTimer = setTimeout(finish, 540);
}

function cancelDocumentSetupYieldAnimations() {
  for (const animation of documentSetupYieldAnimations) animation.cancel();
  documentSetupYieldAnimations = [];
}

function captureDocumentSetupPositions() {
  const elements = [
    documentSetupContent.querySelector('.document-card-heading:not(.language-heading)'),
    documentDropZone,
    documentSetupContent.querySelector('.language-heading'),
    documentSetupContent.querySelector('.document-language-route'),
    startDocumentTranslationButton
  ].filter(Boolean);
  return new Map(elements.map((element) => [element, element.getBoundingClientRect()]));
}

function trackDocumentSetupAnimation(animation) {
  documentSetupYieldAnimations.push(animation);
  animation.finished.then(() => {
    const index = documentSetupYieldAnimations.indexOf(animation);
    if (index >= 0) documentSetupYieldAnimations.splice(index, 1);
    animation.cancel();
  }).catch(() => {});
  return animation;
}

function animateDocumentSetupYield(previousPositions) {
  cancelDocumentSetupYieldAnimations();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  for (const [element, previous] of previousPositions || []) {
    const current = element.getBoundingClientRect();
    const deltaX = previous.left - current.left;
    const deltaY = previous.top - current.top;
    if (Math.abs(deltaX) < .5 && Math.abs(deltaY) < .5) continue;
    const arc = Math.min(2.4, Math.max(.7, Math.abs(deltaY) * .018));
    trackDocumentSetupAnimation(element.animate([
      { offset:0, transform:`translate3d(${deltaX}px,${deltaY}px,0)` },
      { offset:.46, transform:`translate3d(${deltaX * .42 + arc}px,${deltaY * .48}px,0)` },
      { offset:.78, transform:`translate3d(${deltaX * .1 + arc * .24}px,${deltaY * .13}px,0)` },
      { offset:1, transform:'translate3d(0,0,0)' }
    ], {
      duration:760,
      easing:'cubic-bezier(.16,.88,.24,1)',
      fill:'both'
    }));
  }

  trackDocumentSetupAnimation(documentFileChip.animate([
    { offset:0, opacity:0, filter:'blur(7px)', clipPath:'circle(2px at 31px 50%)', transform:'translate3d(-10px,-7px,0) scale(.72)' },
    { offset:.56, opacity:1, filter:'blur(0)', clipPath:'circle(72% at 31px 50%)', transform:'translate3d(1px,1px,0) scale(1.015)' },
    { offset:1, opacity:1, filter:'blur(0)', clipPath:'circle(145% at 31px 50%)', transform:'translate3d(0,0,0) scale(1)' }
  ], {
    duration:700,
    delay:70,
    easing:'cubic-bezier(.16,1,.3,1)',
    fill:'both'
  }));

  trackDocumentSetupAnimation(documentFileType.animate([
    { offset:0, opacity:0, filter:'brightness(1.7) blur(3px)', transform:'rotate(-140deg) scale(.08)', boxShadow:'0 0 0 rgba(var(--accent-a-rgb),0)' },
    { offset:.55, opacity:1, filter:'brightness(1.22) blur(0)', transform:'rotate(10deg) scale(1.12)', boxShadow:'0 0 24px rgba(var(--accent-a-rgb),.38)' },
    { offset:.78, transform:'rotate(-3deg) scale(.98)' },
    { offset:1, opacity:1, filter:'brightness(1) blur(0)', transform:'rotate(0) scale(1)', boxShadow:'inset 0 1px rgba(255,255,255,.08),0 7px 18px rgba(var(--accent-b-rgb),.08)' }
  ], {
    duration:680,
    delay:80,
    easing:'cubic-bezier(.16,1,.3,1)',
    fill:'both'
  }));

  const fileDetails = documentFileChip.children[1];
  const fileDismiss = documentFileChip.children[2];
  for (const [element, delay] of [[fileDetails, 210], [fileDismiss, 270]]) {
    if (!element) continue;
    trackDocumentSetupAnimation(element.animate([
      { opacity:0, transform:'translate3d(-8px,3px,0)' },
      { opacity:1, transform:'translate3d(0,0,0)' }
    ], {
      duration:430,
      delay,
      easing:'cubic-bezier(.16,1,.3,1)',
      fill:'both'
    }));
  }

  if (pdfScanOption.classList.contains('visible')) {
    trackDocumentSetupAnimation(pdfScanOption.animate([
      { opacity:0, transform:'translate3d(0,-12px,0) scale(.985)' },
      { opacity:1, transform:'translate3d(0,0,0) scale(1)' }
    ], {
      duration:520,
      delay:190,
      easing:'cubic-bezier(.16,1,.3,1)',
      fill:'both'
    }));
  }
}

function revealDocumentVortex() {
  if (documentVortexTimer) clearTimeout(documentVortexTimer);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveal = () => {
    documentPage.classList.add('document-vortex-ready');
    if (reducedMotion) return;
    documentPage.classList.add('document-vortex-arriving');
    documentVortexTimer = setTimeout(() => {
      documentPage.classList.remove('document-vortex-arriving');
      documentVortexTimer = null;
    }, 540);
  };
  if (reducedMotion) reveal();
  else documentVortexTimer = setTimeout(reveal, 210);
}

function resetDocumentPresentation() {
  if (documentImmersiveTimer) clearTimeout(documentImmersiveTimer);
  if (documentVortexTimer) clearTimeout(documentVortexTimer);
  hideDocumentVortexGuide();
  documentImmersiveTimer = null;
  documentVortexTimer = null;
  documentSidebarAnimation?.cancel();
  documentSidebarAnimation = null;
  cancelDocumentSetupYieldAnimations();
  cancelDocumentProgressAnchorAnimations();
  documentRestoring = false;
  for (const animation of documentFlipAnimations.values()) animation.cancel();
  documentFlipAnimations.clear();
  clearDocumentParticles();
  documentSetupCard.inert = false;
  documentPage.classList.remove(
    'document-entering', 'document-immersive', 'document-restoring', 'document-layout-settling', 'document-has-file', 'document-vortex-ready', 'document-vortex-arriving',
    'document-sidebar-collapsing', 'document-sidebar-collapsed', 'document-sidebar-expanding'
  );
  documentHeaderCopy.removeAttribute('aria-hidden');
  renderDocumentSidebarToggle(false);
}

function enterDocumentReaderMode() {
  if (documentPage.classList.contains('document-immersive') || documentPage.classList.contains('document-entering')) return;
  if (documentImmersiveTimer) clearTimeout(documentImmersiveTimer);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!selectedDocument || !documentPage.classList.contains('visible')) return;
    emitDocumentHeaderParticles();
    documentPage.classList.add('document-entering');
    documentHeaderCopy.setAttribute('aria-hidden', 'true');
    revealDocumentVortex();
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 780;
    documentImmersiveTimer = setTimeout(() => {
      const setupBounds = documentSetupCard.getBoundingClientRect();
      const progressBounds = documentProgressCard.getBoundingClientRect();
      const vortexBounds = documentSetupRailButton.getBoundingClientRect();
      documentPage.classList.remove('document-entering');
      documentPage.classList.add('document-immersive', 'document-layout-settling');
      const entranceAnimations = [
        animateDocumentFlip(documentSetupCard, setupBounds, 480),
        animateDocumentFlip(documentProgressCard, progressBounds, 480),
        animateDocumentFlip(documentSetupRailButton, vortexBounds, 480, true)
      ].filter(Boolean);
      Promise.all(entranceAnimations.map((animation) => animation.finished.catch(() => {}))).then(() => {
        documentPage.classList.remove('document-layout-settling');
        revealDocumentVortexGuide();
      });
      documentImmersiveTimer = null;
    }, delay);
  }));
}

function openDocumentPage() {
  closeLanguagePicker();
  closeCaptureResult(false);
  settingsPage.classList.remove('visible');
  settingsPage.setAttribute('aria-hidden', 'true');
  onboarding.classList.remove('visible');
  onboarding.setAttribute('aria-hidden', 'true');
  documentPage.classList.add('visible');
  documentPage.setAttribute('aria-hidden', 'false');
  syncExperienceState();
  renderDocumentLanguageRoute();
  if (selectedDocument) enterDocumentReaderMode();
  requestAnimationFrame(() => (selectedDocument ? documentSetupRailButton : documentDropZone).focus());
}

function closeDocumentPage(restoreFocus = true) {
  if (!documentPage.classList.contains('visible')) return;
  if (languagePickerRole?.startsWith('document-')) closeLanguagePicker();
  setSelectedDocument(null, { force: true });
  documentPage.classList.remove('visible');
  documentPage.setAttribute('aria-hidden', 'true');
  syncExperienceState();
  if (restoreFocus) documentButton.focus();
}

function documentBytesToArrayBuffer(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const DOCUMENT_ZOOM_MIN = .55;
const DOCUMENT_ZOOM_MAX = 3;
const DOCUMENT_ZOOM_STEP = .15;

function updateDocumentZoomControls() {
  const rounded = Math.round(documentZoom * 100);
  documentZoomValue.textContent = `${rounded}%`;
  documentZoomOut.disabled = documentZoom <= DOCUMENT_ZOOM_MIN + .001;
  documentZoomIn.disabled = documentZoom >= DOCUMENT_ZOOM_MAX - .001;
}

function applyDocumentViewerGeometry() {
  const viewportWidth = Math.max(1, documentViewerScroll.clientWidth);
  const viewportHeight = Math.max(1, documentViewerScroll.clientHeight);
  const visualWidth = Math.max(1, documentViewerBaseWidth * documentZoom);
  const visualHeight = Math.max(1, documentViewerBaseHeight * documentZoom);
  documentViewerOffsetX = Math.max(0, (viewportWidth - visualWidth) / 2);
  documentViewerStage.style.width = `${Math.ceil(Math.max(viewportWidth, visualWidth))}px`;
  documentViewerStage.style.height = `${Math.ceil(Math.max(viewportHeight, visualHeight))}px`;
  documentViewer.style.left = `${documentViewerOffsetX}px`;
  documentViewer.style.transform = `scale(${documentZoom})`;
  updateDocumentZoomControls();
}

function measureDocumentViewer(relayout = false) {
  if (!documentViewerScroll.clientWidth || !documentViewerScroll.clientHeight) return;
  const viewportWidth = Math.max(1, documentViewerScroll.clientWidth);
  const viewportHeight = Math.max(1, documentViewerScroll.clientHeight);
  if (relayout || !Number.isFinite(documentViewerBaseWidth) || documentViewerBaseWidth <= 1) {
    documentViewer.style.width = `${viewportWidth}px`;
  }
  const measuredWidth = Math.max(viewportWidth, documentViewer.offsetWidth, documentViewer.scrollWidth);
  if (Math.abs(documentViewer.offsetWidth - measuredWidth) > 1) {
    documentViewer.style.width = `${Math.ceil(measuredWidth)}px`;
  }
  documentViewerBaseWidth = Math.max(viewportWidth, documentViewer.offsetWidth, documentViewer.scrollWidth);
  documentViewerBaseHeight = Math.max(viewportHeight, documentViewer.offsetHeight, documentViewer.scrollHeight);
  applyDocumentViewerGeometry();
}

function scheduleDocumentViewerMeasure(relayout = false) {
  documentViewerRelayoutPending ||= relayout;
  if (documentViewerMeasureFrame) return;
  documentViewerMeasureFrame = requestAnimationFrame(() => {
    documentViewerMeasureFrame = 0;
    const shouldRelayout = documentViewerRelayoutPending;
    documentViewerRelayoutPending = false;
    measureDocumentViewer(shouldRelayout);
  });
}

function resetDocumentViewerViewport() {
  if (documentViewerMeasureFrame) cancelAnimationFrame(documentViewerMeasureFrame);
  documentViewerMeasureFrame = 0;
  documentViewerRelayoutPending = false;
  documentPanState = null;
  documentViewerScroll.classList.remove('is-panning');
  documentZoom = 1;
  documentViewerBaseWidth = Math.max(1, documentViewerScroll.clientWidth);
  documentViewerBaseHeight = Math.max(1, documentViewerScroll.clientHeight);
  documentViewerOffsetX = 0;
  documentViewer.style.width = '';
  documentViewer.style.left = '0px';
  documentViewer.style.transform = 'scale(1)';
  documentViewerStage.style.width = '100%';
  documentViewerStage.style.height = '100%';
  documentViewerScroll.scrollLeft = 0;
  documentViewerScroll.scrollTop = 0;
  updateDocumentZoomControls();
  scheduleDocumentViewerMeasure(true);
}

function setDocumentZoom(value, clientX, clientY) {
  const nextZoom = Math.min(DOCUMENT_ZOOM_MAX, Math.max(DOCUMENT_ZOOM_MIN, Number(value) || 1));
  if (Math.abs(nextZoom - documentZoom) < .002) return;
  measureDocumentViewer(false);
  const bounds = documentViewerScroll.getBoundingClientRect();
  const pointerX = Number.isFinite(clientX)
    ? Math.min(bounds.width, Math.max(0, clientX - bounds.left))
    : bounds.width / 2;
  const pointerY = Number.isFinite(clientY)
    ? Math.min(bounds.height, Math.max(0, clientY - bounds.top))
    : bounds.height / 2;
  const sourceX = (documentViewerScroll.scrollLeft + pointerX - documentViewerOffsetX) / documentZoom;
  const sourceY = (documentViewerScroll.scrollTop + pointerY) / documentZoom;
  documentZoom = nextZoom;
  applyDocumentViewerGeometry();
  documentViewerScroll.scrollLeft = documentViewerOffsetX + sourceX * documentZoom - pointerX;
  documentViewerScroll.scrollTop = sourceY * documentZoom - pointerY;
}

function canPanDocumentFrom(target, button) {
  if (!(target instanceof Element) || (button !== 0 && button !== 1)) return false;
  if (button === 1) return true;
  return !target.closest('p,h1,h2,h3,h4,h5,h6,span,li,td,th,pre,code,a,input,textarea,button,[contenteditable="true"],.document-pdf-text-layer');
}

function beginDocumentPan(event) {
  if (!canPanDocumentFrom(event.target, event.button)) return;
  documentPanState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: documentViewerScroll.scrollLeft,
    scrollTop: documentViewerScroll.scrollTop
  };
  documentViewerScroll.setPointerCapture?.(event.pointerId);
  documentViewerScroll.classList.add('is-panning');
  event.preventDefault();
}

function moveDocumentPan(event) {
  if (!documentPanState || documentPanState.pointerId !== event.pointerId) return;
  documentViewerScroll.scrollLeft = documentPanState.scrollLeft - (event.clientX - documentPanState.startX);
  documentViewerScroll.scrollTop = documentPanState.scrollTop - (event.clientY - documentPanState.startY);
  event.preventDefault();
}

function finishDocumentPan(event) {
  if (!documentPanState || documentPanState.pointerId !== event.pointerId) return;
  try { documentViewerScroll.releasePointerCapture?.(event.pointerId); } catch {}
  documentPanState = null;
  documentViewerScroll.classList.remove('is-panning');
}

function clearDocumentViewer() {
  documentPreviewSerial += 1;
  documentSelectionRequest += 1;
  if (documentSelectionTimer) clearTimeout(documentSelectionTimer);
  documentSelectionTimer = null;
  try { documentViewerCleanup?.(); } catch {}
  documentViewerCleanup = null;
  documentViewer.className = 'document-viewer';
  documentViewer.replaceChildren();
  resetDocumentViewerViewport();
  documentSelectionSource.textContent = '';
  documentSelectionTranslation.textContent = '';
  documentSelectionHint.textContent = '在左侧阅读器里拖选任意文字，译文会在这里出现。';
  lastDocumentSelectionTranslation = '';
}

function decodeDocumentText(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  const offset = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  return new TextDecoder('utf-8').decode(bytes.subarray(offset));
}

function loadFeatureScript(key, source, isReady) {
  if (isReady()) return Promise.resolve();
  if (featureScriptPromises.has(key)) return featureScriptPromises.get(key);
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.dataset.yilanFeature = key;
    script.addEventListener('load', () => {
      if (isReady()) resolve();
      else reject(new Error(`${key} 组件未正确初始化`));
    }, { once: true });
    script.addEventListener('error', () => reject(new Error(`${key} 组件加载失败`)), { once: true });
    document.head.append(script);
  }).catch((error) => {
    featureScriptPromises.delete(key);
    document.querySelector(`script[data-yilan-feature="${key}"]`)?.remove();
    throw error;
  });
  featureScriptPromises.set(key, promise);
  return promise;
}

async function ensureDocxReaderLibraries() {
  await loadFeatureScript('JSZip', '../node_modules/jszip/dist/jszip.min.js', () => Boolean(window.JSZip?.loadAsync));
  await loadFeatureScript('DOCX', '../node_modules/docx-preview/dist/docx-preview.min.js', () => Boolean(window.docx?.renderAsync));
}

function ensureWorkbookReaderLibrary() {
  return loadFeatureScript('XLSX', '../node_modules/xlsx/dist/xlsx.full.min.js', () => Boolean(window.XLSX?.read));
}

function ensurePresentationReaderLibrary() {
  return loadFeatureScript('PPTX', '../node_modules/pptx-preview/dist/pptx-preview.umd.js', () => Boolean(window.pptxPreview?.init));
}

function renderPlainTextReader(text) {
  const page = document.createElement('article');
  page.className = 'document-text-reader';
  page.textContent = text;
  documentViewer.append(page);
}

function renderMarkdownReader(text) {
  const page = document.createElement('article');
  page.className = 'document-text-reader document-markdown-reader';
  let code = false;
  let pre = null;
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(rawLine)) {
      code = !code;
      if (code) {
        pre = document.createElement('pre');
        page.append(pre);
      }
      continue;
    }
    if (code) {
      pre.textContent += `${rawLine}\n`;
      continue;
    }
    const heading = rawLine.match(/^(#{1,3})\s+(.+)$/);
    const element = document.createElement(heading ? `h${heading[1].length}` : rawLine.trim().startsWith('>') ? 'blockquote' : 'p');
    element.textContent = heading ? heading[2] : rawLine.trim().startsWith('>') ? rawLine.replace(/^\s*>\s?/, '') : rawLine || '\u00a0';
    page.append(element);
  }
  documentViewer.append(page);
}

async function renderPdfReader(arrayBuffer, serial) {
  documentViewer.classList.add('document-pdf-reader');
  const pdfjs = await import('../node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', window.location.href).href;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  documentViewerCleanup = () => loadingTask.destroy();
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (serial !== documentPreviewSerial) return;
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(360, documentViewerScroll.clientWidth - 48);
    const scale = Math.max(.72, Math.min(1.55, availableWidth / Math.max(1, baseViewport.width)));
    const viewport = page.getViewport({ scale });
    const stage = document.createElement('article');
    stage.className = 'document-pdf-page';
    stage.style.width = `${Math.ceil(viewport.width)}px`;
    stage.style.height = `${Math.ceil(viewport.height)}px`;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width * Math.min(1.5, window.devicePixelRatio || 1));
    canvas.height = Math.ceil(viewport.height * Math.min(1.5, window.devicePixelRatio || 1));
    canvas.style.width = `${Math.ceil(viewport.width)}px`;
    canvas.style.height = `${Math.ceil(viewport.height)}px`;
    const renderViewport = page.getViewport({ scale: scale * Math.min(1.5, window.devicePixelRatio || 1) });
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;
    const textLayer = document.createElement('div');
    textLayer.className = 'document-pdf-text-layer';
    const content = await page.getTextContent();
    for (const item of content.items || []) {
      const value = String(item.str || '');
      if (!value) continue;
      const transform = pdfjs.Util.transform(viewport.transform, item.transform);
      const fontSize = Math.max(2, Math.hypot(transform[2], transform[3]));
      const span = document.createElement('span');
      span.textContent = value;
      span.style.left = `${transform[4]}px`;
      span.style.top = `${transform[5] - fontSize}px`;
      span.style.fontSize = `${fontSize}px`;
      span.style.width = `${Math.max(1, Number(item.width || 0) * scale)}px`;
      span.style.height = `${fontSize * 1.2}px`;
      textLayer.append(span);
    }
    stage.append(canvas, textLayer);
    documentViewer.append(stage);
    documentReaderStatus.textContent = `已渲染 ${pageNumber} / ${pdf.numPages} 页`;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

async function renderDocxReader(arrayBuffer) {
  await ensureDocxReaderLibraries();
  if (!window.JSZip?.loadAsync) throw new Error('Word 解压组件未加载');
  if (!window.docx?.renderAsync) throw new Error('Word 阅读器组件未加载');
  await window.docx.renderAsync(arrayBuffer, documentViewer, documentViewer, {
    className: 'docx', inWrapper: true, ignoreWidth: false, ignoreHeight: false,
    renderHeaders: true, renderFooters: true, renderFootnotes: true,
    breakPages: true, useBase64URL: true
  });
}

async function renderWorkbookReader(arrayBuffer) {
  await ensureWorkbookReaderLibrary();
  if (!window.XLSX) throw new Error('Excel 阅读器组件未加载');
  const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellStyles: true, cellDates: true });
  const tabs = document.createElement('nav');
  tabs.className = 'document-sheet-tabs';
  const tableHost = document.createElement('div');
  const showSheet = (sheetName) => {
    for (const button of tabs.querySelectorAll('button')) button.classList.toggle('active', button.dataset.sheet === sheetName);
    const sheet = workbook.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '', blankrows: true });
    const table = document.createElement('table');
    table.className = 'document-sheet-table';
    const maximumRows = Math.min(rows.length, 2500);
    const maximumColumns = Math.min(80, rows.reduce((max, row) => Math.max(max, row.length), 0));
    for (let rowIndex = 0; rowIndex < maximumRows; rowIndex += 1) {
      const rowElement = document.createElement('tr');
      const rowHeader = document.createElement('th');
      rowHeader.textContent = String(rowIndex + 1);
      rowElement.append(rowHeader);
      for (let column = 0; column < maximumColumns; column += 1) {
        const cell = document.createElement(rowIndex === 0 ? 'th' : 'td');
        cell.textContent = String(rows[rowIndex]?.[column] ?? '');
        rowElement.append(cell);
      }
      table.append(rowElement);
    }
    tableHost.replaceChildren(table);
  };
  for (const sheetName of workbook.SheetNames) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.sheet = sheetName;
    button.textContent = sheetName;
    button.addEventListener('click', () => showSheet(sheetName));
    tabs.append(button);
  }
  documentViewer.append(tabs, tableHost);
  if (workbook.SheetNames[0]) showSheet(workbook.SheetNames[0]);
}

async function renderPptxReader(arrayBuffer) {
  await ensurePresentationReaderLibrary();
  if (!window.pptxPreview?.init) throw new Error('PowerPoint 阅读器组件未加载');
  documentViewer.classList.add('document-pptx-reader');
  const width = Math.max(560, Math.min(960, documentViewerScroll.clientWidth - 48));
  const previewer = window.pptxPreview.init(documentViewer, { width, height: Math.round(width * 9 / 16) });
  await previewer.preview(arrayBuffer);
  documentViewerCleanup = () => previewer.destroy?.();
}

async function loadSelectedDocumentPreview(file) {
  const serial = ++documentPreviewSerial;
  const readerWasVisible = documentReaderView.classList.contains('visible');
  try { documentViewerCleanup?.(); } catch {}
  documentViewerCleanup = null;
  documentViewer.className = 'document-viewer';
  documentViewer.innerHTML = '<div class="document-viewer-loading">正在识别格式并启动本地阅读器…</div>';
  resetDocumentViewerViewport();
  documentEmptyState.hidden = true;
  documentTaskView.classList.remove('visible');
  documentTaskView.setAttribute('aria-hidden', 'true');
  documentReaderView.classList.add('visible');
  documentReaderView.setAttribute('aria-hidden', 'false');
  if (!readerWasVisible) requestAnimationFrame(() => animateDocumentReaderArrival(120));
  documentReaderFormat.textContent = `${String(file.extension || '').slice(1).toUpperCase()} · LOCAL READER`;
  documentReaderTitle.textContent = file.name;
  documentReaderStatus.textContent = '识别格式中';
  documentReaderPercent.textContent = 'READY';
  documentReaderProgressBar.style.width = '0%';
  documentReaderMeta.textContent = '文档只在本机解析 · 拖选文字即可翻译';
  documentSelectionSource.textContent = '';
  documentSelectionTranslation.textContent = '';
  documentSelectionHint.textContent = '在左侧阅读器里拖选任意文字，译文会在这里出现。';
  try {
    const payload = await api.readDocument(file.token);
    if (serial !== documentPreviewSerial) return;
    const arrayBuffer = documentBytesToArrayBuffer(payload.data);
    documentViewer.replaceChildren();
    if (file.extension === '.txt') renderPlainTextReader(decodeDocumentText(arrayBuffer));
    else if (file.extension === '.md' || file.extension === '.markdown') renderMarkdownReader(decodeDocumentText(arrayBuffer));
    else if (file.extension === '.docx') await renderDocxReader(arrayBuffer);
    else if (file.extension === '.xlsx') await renderWorkbookReader(arrayBuffer);
    else if (file.extension === '.pptx') await renderPptxReader(arrayBuffer);
    else if (file.extension === '.pdf') await renderPdfReader(arrayBuffer, serial);
    else throw new Error('暂无对应的本地阅读器');
    if (serial !== documentPreviewSerial) return;
    scheduleDocumentViewerMeasure(true);
    documentReaderStatus.textContent = '阅读器已就绪';
    documentReaderMeta.textContent = `${file.format} · 可直接拖选文字翻译`;
    requestAnimationFrame(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      documentViewer.animate([
        { opacity: .25, transform: 'translate3d(0,8px,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)' }
      ], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  } catch (error) {
    if (serial !== documentPreviewSerial) return;
    documentViewer.innerHTML = '';
    const message = document.createElement('div');
    message.className = 'document-viewer-loading';
    message.textContent = `阅读器启动失败：${error?.message || error}`;
    documentViewer.append(message);
    documentReaderStatus.textContent = '阅读器未就绪';
  }
}

async function translateDocumentSelection(text) {
  const source = String(text || '').replace(/\s+/gu, ' ').trim().slice(0, 3000);
  if (!source) return;
  const request = ++documentSelectionRequest;
  documentSelectionSource.textContent = source;
  documentSelectionTranslation.textContent = '正在本地翻译选中内容…';
  documentSelectionHint.textContent = `已选中 ${source.length} 个字符`;
  documentSelectionPanel.classList.add('translating');
  try {
    const result = await api.translateSelection({
      text: source,
      sourceLanguage: documentSourceLanguage,
      targetLanguage: documentTargetLanguage
    });
    if (request !== documentSelectionRequest) return;
    lastDocumentSelectionTranslation = result.text || '';
    documentSelectionTranslation.textContent = lastDocumentSelectionTranslation;
    documentSelectionHint.textContent = `${languageDisplayName(result.detectedSourceLanguage || result.sourceLanguage)} → ${languageDisplayName(result.targetLanguage)} · 划词翻译`;
  } catch (error) {
    if (request !== documentSelectionRequest) return;
    documentSelectionTranslation.textContent = error?.message || String(error);
  } finally {
    if (request === documentSelectionRequest) documentSelectionPanel.classList.remove('translating');
  }
}

function scheduleDocumentSelectionTranslation() {
  if (documentSelectionTimer) clearTimeout(documentSelectionTimer);
  documentSelectionTimer = setTimeout(() => {
    const selection = window.getSelection();
    const text = String(selection?.toString() || '').trim();
    const anchor = selection?.anchorNode;
    const focus = selection?.focusNode;
    if (!text || !anchor || !focus || !documentViewer.contains(anchor) || !documentViewer.contains(focus)) return;
    void translateDocumentSelection(text);
  }, 180);
}

function setSelectedDocument(file, options = {}) {
  const force = Boolean(options.force);
  if (!force && activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status)) {
    showToast('请先完成或取消当前文档任务');
    return;
  }
  if (force && activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status)) {
    void api.cancelDocumentTranslation(activeDocumentTask.id).catch(() => {});
  }
  if (activeDocumentTask) {
    activeDocumentTask = null;
    documentTaskView.classList.remove('visible');
    documentTaskView.setAttribute('aria-hidden', 'true');
  }
  const hadSelectedDocument = Boolean(selectedDocument);
  const setupPositions = file && !hadSelectedDocument ? captureDocumentSetupPositions() : null;
  selectedDocument = file || null;
  clearDocumentFileButton.disabled = false;
  const visible = Boolean(selectedDocument);
  const isPdf = selectedDocument?.extension === '.pdf';
  documentFileChip.classList.toggle('visible', visible);
  documentFileChip.setAttribute('aria-hidden', String(!visible));
  pdfScanOption.classList.toggle('visible', isPdf);
  pdfScanOption.setAttribute('aria-hidden', String(!isPdf));
  pdfScanCheckbox.checked = false;
  documentPage.classList.toggle('document-has-file', visible);
  if (visible) {
    documentFileType.textContent = String(selectedDocument.extension || '').replace('.', '').slice(0, 5).toUpperCase() || 'DOC';
    documentFileName.textContent = selectedDocument.name;
    documentFileMeta.textContent = `${selectedDocument.format} · ${formatFileSize(selectedDocument.size)}`;
    documentDropTitle.textContent = '更换文档';
    documentDropDetail.textContent = selectedDocument.directory || '已安全读取文件信息';
    if (!hadSelectedDocument) animateDocumentSetupYield(setupPositions);
    void loadSelectedDocumentPreview(selectedDocument);
    enterDocumentReaderMode();
  } else {
    clearDocumentViewer();
    documentReaderView.classList.remove('visible');
    documentReaderView.setAttribute('aria-hidden', 'true');
    documentEmptyState.hidden = false;
    resetDocumentPresentation();
    documentTaskView.classList.remove('visible', 'completed');
    documentTaskView.setAttribute('aria-hidden', 'true');
    documentOutputCard.classList.remove('visible');
    documentErrorCard.classList.remove('visible');
    documentReaderProgressBar.style.width = '0%';
    documentReaderPercent.textContent = 'READY';
    documentDropTitle.textContent = '拖入文档，或点击选择';
    documentDropDetail.textContent = '原文件不会被覆盖 · 全程离线';
  }
  updateLanguageControlState();
  if (visible && documentPage.classList.contains('document-immersive')) {
    requestAnimationFrame(() => animateDocumentActionButton(startDocumentTranslationButton));
  }
}

async function clearSelectedDocumentWithAnimation() {
  if (!selectedDocument || documentRestoring) return;
  if (activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status)) return;
  documentRestoring = true;
  clearDocumentFileButton.disabled = true;
  cancelDocumentProgressAnchorAnimations();

  try {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readerParts = [
    documentReaderView.querySelector('.document-reader-header'),
    documentReaderView.querySelector('.document-reader-progress'),
    documentReaderView.querySelector('.document-reader-grid'),
    documentReaderView.querySelector('.document-reader-footer')
  ].filter(Boolean);
  const exitAnimations = reducedMotion ? [] : readerParts.map((element, index) => element.animate([
    { opacity: 1, transform: 'translate3d(0,0,0)' },
    { opacity: 0, transform: 'translate3d(0,8px,0)' }
  ], { duration: 230, delay: index * 18, easing: 'cubic-bezier(.4,0,1,1)', fill: 'both' }));
  await Promise.all(exitAnimations.map((animation) => animation.finished.catch(() => {})));
  if (!selectedDocument) {
    documentRestoring = false;
    return;
  }

  const progressStart = documentProgressCard.getBoundingClientRect();
  const vortexStart = documentSetupRailButton.getBoundingClientRect();
  const setupStart = documentPage.classList.contains('document-sidebar-collapsed')
    ? vortexStart
    : documentSetupCard.getBoundingClientRect();
  documentSidebarAnimation?.cancel();
  documentSidebarAnimation = null;
  documentPage.classList.remove(
    'document-entering', 'document-immersive', 'document-sidebar-collapsing',
    'document-sidebar-collapsed', 'document-sidebar-expanding', 'document-vortex-arriving'
  );
  documentPage.classList.add('document-restoring');
  documentHeaderCopy.removeAttribute('aria-hidden');
  documentSetupCard.inert = true;
  renderDocumentSidebarToggle(false);
  const vortexEnd = documentSetupRailButton.getBoundingClientRect();
  const vortexDeltaX = vortexStart.left - vortexEnd.left;
  const vortexDeltaY = vortexStart.top - vortexEnd.top;
  const setupContentExitAnimation = reducedMotion ? null : documentSetupContent.animate([
    { offset: 0, opacity: 1, transform: 'translate3d(0,0,0) scale(1)' },
    { offset: .66, opacity: 1, transform: 'translate3d(0,0,0) scale(1)' },
    { offset: 1, opacity: 0, transform: 'translate3d(0,9px,0) scale(.985)' }
  ], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });

  const layoutAnimations = [
    animateDocumentFlip(documentSetupCard, setupStart, 560),
    animateDocumentFlip(documentProgressCard, progressStart, 560),
    setupContentExitAnimation
  ].filter(Boolean);
  const headerAnimation = documentHeaderCopy.animate([
    { opacity: 0, transform: 'translate3d(38px,-2px,0) scale(.975)' },
    { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
  ], { duration: 540, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  const vortexAnimation = documentSetupRailButton.animate([
    { opacity: 1, transform: `translate3d(${vortexDeltaX}px,${vortexDeltaY}px,0) scale(1) rotate(0)` },
    { opacity: 0, transform: 'translate3d(0,0,0) scale(.16) rotate(-150deg)' }
  ], { duration: 420, delay: 90, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
  await Promise.all([
    ...layoutAnimations.map((animation) => animation.finished.catch(() => {})),
    headerAnimation.finished.catch(() => {}),
    vortexAnimation.finished.catch(() => {})
  ]);
  exitAnimations.forEach((animation) => animation.cancel());
  headerAnimation.cancel();
  vortexAnimation.cancel();
  setSelectedDocument(null);
  documentPage.classList.remove('document-restoring');
  if (!reducedMotion) {
    documentSetupContent.animate([
      { opacity: 0, transform: 'translate3d(0,-8px,0) scale(.988)' },
      { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
    ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
    setupContentExitAnimation?.cancel();
    documentEmptyState.animate([
      { opacity: 0, transform: 'translate3d(0,-8px,0)' },
      { opacity: 1, transform: 'translate3d(0,0,0)' }
    ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  } finally {
    documentRestoring = false;
    clearDocumentFileButton.disabled = Boolean(activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status));
  }
}

async function chooseDocument() {
  try {
    const file = await api.pickDocument();
    if (file) setSelectedDocument(file);
  } catch (error) {
    showToast(error?.message || String(error));
  }
}

async function acceptDroppedDocument(file) {
  if (!file) return;
  try {
    const filePath = api.pathForFile(file);
    if (!filePath) throw new Error('无法读取拖入文件的本机路径');
    const selected = await api.registerDocumentPath(filePath);
    setSelectedDocument(selected);
  } catch (error) {
    showToast(error?.message || String(error));
  }
}

function renderDocumentTask(task) {
  if (!task) return;
  activeDocumentTask = task;
  const progress = Math.min(1, Math.max(0, Number(task.progress || 0)));
  const terminal = ['completed', 'failed', 'cancelled'].includes(task.status);
  const readerVisible = documentReaderView.classList.contains('visible');
  documentEmptyState.hidden = true;
  documentTaskView.classList.toggle('visible', !readerVisible);
  documentTaskView.classList.toggle('completed', task.status === 'completed');
  documentTaskView.setAttribute('aria-hidden', String(readerVisible));
  documentTaskKicker.textContent = task.status === 'completed'
    ? 'DOCUMENT READY'
    : task.status === 'failed'
      ? 'TASK INTERRUPTED'
      : task.phase === 'ocr'
        ? 'SCANNED PDF · LOCAL OCR'
        : 'LOCAL DOCUMENT TASK';
  documentTaskTitle.textContent = task.phaseLabel || '正在处理文档';
  documentProgressPercent.textContent = `${Math.round(progress * 100)}%`;
  documentProgressBar.style.width = `${progress * 100}%`;
  documentProgressCount.textContent = task.total
    ? task.phase === 'ocr'
      ? `已识别 ${task.completed} / ${task.total} 页`
      : `已完成 ${task.completed} / ${task.total} 个段落`
    : '正在分析文档结构';
  documentElapsed.textContent = formatElapsed(task.elapsedMs);

  if (readerVisible) {
    documentReaderStatus.textContent = task.status === 'completed'
      ? '译文已经生成'
      : task.status === 'failed'
        ? '翻译任务未完成'
        : task.status === 'cancelled'
          ? '翻译任务已取消'
          : task.phaseLabel || '正在翻译文档';
    documentReaderPercent.textContent = `${Math.round(progress * 100)}%`;
    documentReaderProgressBar.style.width = `${progress * 100}%`;
    documentReaderMeta.textContent = task.status === 'completed'
      ? '译文文件已生成 · 可直接打开或查看所在位置'
      : task.total
        ? `${task.completed} / ${task.total} · ${formatElapsed(task.elapsedMs)}`
        : '正在分析文档结构 · 阅读与划词翻译不受影响';
  }

  documentPreviewList.replaceChildren(...(task.preview || []).map((item) => {
    const row = document.createElement('article');
    row.className = 'document-preview-item';
    const source = document.createElement('p');
    source.textContent = item.source;
    const arrow = document.createElement('i');
    arrow.textContent = '→';
    const translation = document.createElement('p');
    translation.textContent = item.translation;
    row.append(source, arrow, translation);
    return row;
  }));
  documentPreviewList.scrollTop = task.status === 'completed' ? 0 : documentPreviewList.scrollHeight;

  const completed = task.status === 'completed' && Boolean(task.outputPath);
  const taskOutputWasHidden = openDocumentOutputButton.hidden;
  const readerOutputWasDisabled = openDocumentReaderOutput.disabled;
  documentOutputCard.classList.toggle('visible', completed);
  documentOutputCard.setAttribute('aria-hidden', String(!completed));
  documentOutputPath.textContent = task.outputPath || '';
  const hasError = task.status === 'failed' || task.status === 'cancelled';
  documentErrorCard.classList.toggle('visible', hasError);
  documentErrorCard.setAttribute('aria-hidden', String(!hasError));
  documentErrorText.textContent = task.status === 'cancelled' ? '任务已取消，原文件没有发生变化。' : (task.error || '请重新选择文档后再试。');

  pauseDocumentTaskButton.hidden = terminal;
  cancelDocumentTaskButton.hidden = terminal;
  pauseDocumentTaskButton.textContent = task.status === 'paused' ? '继续' : '暂停';
  showDocumentOutputButton.hidden = !completed;
  openDocumentOutputButton.hidden = !completed;
  pauseDocumentReaderTask.hidden = terminal;
  cancelDocumentReaderTask.hidden = terminal;
  pauseDocumentReaderTask.textContent = task.status === 'paused' ? '继续' : '暂停';
  showDocumentReaderOutput.hidden = !completed;
  openDocumentReaderOutput.hidden = false;
  openDocumentReaderOutput.disabled = !completed;
  if (completed && taskOutputWasHidden) requestAnimationFrame(() => animateDocumentActionButton(openDocumentOutputButton));
  if (completed && readerOutputWasDisabled) requestAnimationFrame(() => animateDocumentActionButton(openDocumentReaderOutput));
  clearDocumentFileButton.disabled = !terminal;
  updateLanguageControlState();
  if (completed) showToast('文档翻译完成，译文文件已生成');
}

async function startDocumentTranslation() {
  if (!selectedDocument || (activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status))) return;
  try {
    const readerVisible = documentReaderView.classList.contains('visible');
    documentEmptyState.hidden = true;
    documentTaskView.classList.toggle('visible', !readerVisible);
    documentTaskView.setAttribute('aria-hidden', String(readerVisible));
    documentTaskTitle.textContent = '正在建立本地任务';
    documentProgressPercent.textContent = '0%';
    documentProgressBar.style.width = '0%';
    documentProgressCount.textContent = '正在读取文件';
    documentElapsed.textContent = '0 秒';
    if (readerVisible) {
      documentReaderStatus.textContent = '正在建立本地任务';
      documentReaderPercent.textContent = '0%';
      documentReaderProgressBar.style.width = '0%';
      documentReaderMeta.textContent = '阅读器保持可用 · 正在读取文档结构';
    }
    openDocumentReaderOutput.disabled = true;
    startDocumentTranslationButton.disabled = true;
    const task = await api.startDocumentTranslation({
      token: selectedDocument.token,
      sourceLanguage: documentSourceLanguage,
      targetLanguage: documentTargetLanguage,
      scannedPdf: selectedDocument.extension === '.pdf' && pdfScanCheckbox.checked
    });
    renderDocumentTask(task);
  } catch (error) {
    activeDocumentTask = null;
    const readerVisible = documentReaderView.classList.contains('visible');
    documentEmptyState.hidden = readerVisible;
    documentTaskView.classList.remove('visible');
    documentTaskView.setAttribute('aria-hidden', 'true');
    if (readerVisible) {
      documentReaderStatus.textContent = '翻译任务未启动';
      documentReaderMeta.textContent = error?.message || String(error);
    }
    updateLanguageControlState();
    showToast(error?.message || String(error));
  }
}

async function toggleDocumentPause() {
  if (!activeDocumentTask) return;
  try {
    const task = activeDocumentTask.status === 'paused'
      ? await api.resumeDocumentTranslation(activeDocumentTask.id)
      : await api.pauseDocumentTranslation(activeDocumentTask.id);
    renderDocumentTask(task);
  } catch (error) {
    showToast(error?.message || String(error));
  }
}

async function cancelDocumentTask() {
  if (!activeDocumentTask || !['running', 'paused'].includes(activeDocumentTask.status)) return;
  try {
    renderDocumentTask(await api.cancelDocumentTranslation(activeDocumentTask.id));
  } catch (error) {
    showToast(error?.message || String(error));
  }
}

async function openDocumentOutput(reveal = false) {
  if (!activeDocumentTask?.outputPath) return;
  try {
    if (reveal) await api.showDocumentOutput(activeDocumentTask.outputPath);
    else await api.openDocumentOutput(activeDocumentTask.outputPath);
  } catch (error) {
    showToast(error?.message || String(error));
  }
}

function setCaptureBusy(value, detail = '') {
  captureBusy = value;
  captureButton.disabled = value;
  sourceImageButton.disabled = value;
  captureButton.classList.toggle('is-busy', value);
  if (detail) captureButton.title = detail;
  else updateCaptureButtonHint();
}

const captureProgressStages = {
  preparing: { title: '正在准备截图', ceiling: 16 },
  recognizing: { title: '正在识别文字', ceiling: 69 },
  translating: { title: '正在离线翻译', ceiling: 98 }
};

function paintCaptureProgress(value) {
  captureProgressValue = Math.max(0, Math.min(100, Number(value) || 0));
  const rounded = Math.round(captureProgressValue);
  captureProgressPercent.textContent = `${rounded}%`;
  captureProgressFill.style.width = `${captureProgressValue.toFixed(2)}%`;
}

function stopCaptureProgressTicker() {
  clearInterval(captureProgressTimer);
  captureProgressTimer = null;
}

function startCaptureProgressTicker() {
  if (captureProgressTimer) return;
  captureProgressTimer = setInterval(() => {
    const stage = captureProgressStages[captureProgressStage] || captureProgressStages.recognizing;
    const destination = Math.max(captureProgressTarget, captureProgressValue);
    let next = captureProgressValue;
    if (next + .05 < destination) next += Math.max(.18, (destination - next) * .2);
    else if (next < stage.ceiling) next += Math.max(.035, (stage.ceiling - next) * .009);
    paintCaptureProgress(Math.min(stage.ceiling, next));
  }, 90);
}

function showCaptureProgress(status, detail = '', progress = null) {
  const stage = captureProgressStages[status] || captureProgressStages.recognizing;
  clearTimeout(captureProgressResetTimer);
  captureProgressResetTimer = null;
  captureProgressStage = captureProgressStages[status] ? status : 'recognizing';
  captureProgressTitle.textContent = stage.title;
  captureProgressDetail.textContent = detail || '正在本地处理截图，请稍候…';
  const reported = Number(progress);
  if (Number.isFinite(reported)) captureProgressTarget = Math.max(captureProgressValue, Math.min(stage.ceiling, reported));
  if (!captureProgress.classList.contains('visible')) {
    paintCaptureProgress(Math.max(3, Math.min(captureProgressTarget || 8, 10)));
    captureProgress.classList.add('visible');
    captureProgress.setAttribute('aria-hidden', 'false');
  }
  startCaptureProgressTicker();
}

function hideCaptureProgress(immediate = false) {
  stopCaptureProgressTicker();
  clearTimeout(captureProgressResetTimer);
  captureProgress.classList.remove('visible');
  captureProgress.setAttribute('aria-hidden', 'true');
  const reset = () => {
    captureProgressStage = '';
    captureProgressTarget = 0;
    paintCaptureProgress(0);
  };
  if (immediate) reset();
  else captureProgressResetTimer = setTimeout(reset, 420);
}

function currentCapturePreferences() {
  const accent = accentThemes.find((item) => item.id === document.body.dataset.accent) || accentThemes[0];
  return {
    sourceLanguage,
    targetLanguage,
    ocrMode: captureOcrMode,
    theme: document.body.dataset.theme,
    accentA: accent.colors[0],
    accentB: accent.colors[1]
  };
}

function ensureCaptureLanguageReady() {
  if (captureOcrMode !== 'specified' || sourceLanguage !== 'auto') return true;
  showToast('「仅指定语言」模式需要先选择源语言');
  openLanguagePicker('source');
  return false;
}

async function startCaptureTranslation() {
  if (captureBusy) return;
  if (!ensureCaptureLanguageReady()) return;
  hideCaptureProgress(true);
  closeCaptureResult(false);
  closeDocumentPage(false);
  closeLanguagePicker();
  setCaptureBusy(true, '正在打开截图选区…');
  try {
    await api.startCapture(currentCapturePreferences());
  } catch (error) {
    setCaptureBusy(false);
    hideCaptureProgress();
    showToast(error?.message || String(error));
  }
}

async function submitImageForCapture(file, pasted = false) {
  if (!file) return;
  if (!ensureCaptureLanguageReady()) return;
  if (captureBusy) {
    showToast('已有截图或图片识别任务正在进行');
    return;
  }
  closeCaptureResult(false);
  closeDocumentPage(false);
  closeLanguagePicker();
  hideCaptureProgress(true);
  setCaptureBusy(true, '正在读取图片…');
  showCaptureProgress('preparing', pasted ? '已接收剪贴板图片，正在读取…' : '正在读取所选图片…', 4);
  try {
    let filePath = '';
    try { filePath = api.pathForFile(file) || ''; } catch {}
    const payload = {
      fileName: file.name || (pasted ? '剪贴板图片' : '导入图片'),
      mimeType: file.type || '',
      preferences: currentCapturePreferences()
    };
    if (filePath) payload.filePath = filePath;
    else payload.bytes = new Uint8Array(await file.arrayBuffer());
    await api.processCaptureImage(payload);
  } catch (error) {
    setCaptureBusy(false);
    hideCaptureProgress();
    showToast(error?.message || String(error));
  }
}

function handleSourceImagePaste(event) {
  const clipboard = event.clipboardData;
  if (!clipboard) return;
  const imageItem = [...clipboard.items].find((item) => item.kind === 'file' && item.type.startsWith('image/'));
  const imageFile = imageItem?.getAsFile()
    || [...clipboard.files].find((file) => String(file.type || '').startsWith('image/'));
  if (!imageFile) return;
  event.preventDefault();
  void submitImageForCapture(imageFile, true);
}

function captureBoxBounds(box) {
  const points = Array.isArray(box) ? box : [];
  const xs = points.map((point) => Number(point?.[0])).filter(Number.isFinite);
  const ys = points.map((point) => Number(point?.[1])).filter(Number.isFinite);
  if (xs.length === 0 || ys.length === 0) return null;
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function clearCaptureSelection() {
  captureSelectionRequest += 1;
  captureDragState = null;
  captureDragSelection.classList.remove('visible');
  captureDragSelection.removeAttribute('style');
  for (const element of captureBlockLayer.querySelectorAll('.capture-block-hit.selected')) {
    element.classList.remove('selected');
  }
}

function renderCaptureBlockLayer(result) {
  clearCaptureSelection();
  captureBlockLayer.replaceChildren();
  const width = Math.max(1, Number(result?.imageWidth || capturePreviewImage.naturalWidth || 1));
  const height = Math.max(1, Number(result?.imageHeight || capturePreviewImage.naturalHeight || 1));
  (result?.blocks || []).forEach((block, index) => {
    const bounds = captureBoxBounds(block.box);
    const text = String(block.text || '').trim();
    if (!bounds || !text) return;
    const element = document.createElement('span');
    element.className = 'capture-block-hit';
    element.style.left = `${Math.max(0, Math.min(100, bounds.left / width * 100))}%`;
    element.style.top = `${Math.max(0, Math.min(100, bounds.top / height * 100))}%`;
    element.style.width = `${Math.max(.3, Math.min(100, bounds.width / width * 100))}%`;
    element.style.height = `${Math.max(.6, Math.min(100, bounds.height / height * 100))}%`;
    element._captureBlock = {
      index,
      text,
      left: bounds.left / width,
      top: bounds.top / height,
      width: bounds.width / width,
      height: bounds.height / height
    };
    captureBlockLayer.append(element);
  });
}

function captureLocalPoint(event) {
  const bounds = capturePreviewStage.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
    width: bounds.width,
    height: bounds.height
  };
}

function paintCaptureDrag(start, end) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.max(1, Math.abs(end.x - start.x));
  const height = Math.max(1, Math.abs(end.y - start.y));
  Object.assign(captureDragSelection.style, {
    left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`
  });
  captureDragSelection.classList.add('visible');
}

function selectedTextFromCaptureRect(rect, stageWidth, stageHeight) {
  const horizontalPadding = Math.max(3, stageWidth * .004);
  const verticalPadding = Math.max(7, rect.height * .8);
  const selection = {
    left: Math.max(0, rect.left - horizontalPadding),
    right: Math.min(stageWidth, rect.right + horizontalPadding),
    top: Math.max(0, rect.top - verticalPadding),
    bottom: Math.min(stageHeight, rect.bottom + verticalPadding)
  };
  const selected = [];
  for (const element of captureBlockLayer.querySelectorAll('.capture-block-hit')) {
    const block = element._captureBlock;
    if (!block) continue;
    const box = {
      left: block.left * stageWidth,
      right: (block.left + block.width) * stageWidth,
      top: block.top * stageHeight,
      bottom: (block.top + block.height) * stageHeight
    };
    const overlapWidth = Math.max(0, Math.min(selection.right, box.right) - Math.max(selection.left, box.left));
    const overlapHeight = Math.max(0, Math.min(selection.bottom, box.bottom) - Math.max(selection.top, box.top));
    if (overlapWidth <= 0 || overlapHeight / Math.max(1, box.bottom - box.top) < .22) continue;
    element.classList.add('selected');
    const characters = [...block.text];
    const coveredRatio = overlapWidth / Math.max(1, box.right - box.left);
    let text = block.text;
    if (characters.length > 1 && coveredRatio < .88) {
      let startRatio = Math.max(0, Math.min(1, (selection.left - box.left) / Math.max(1, box.right - box.left)));
      let endRatio = Math.max(0, Math.min(1, (selection.right - box.left) / Math.max(1, box.right - box.left)));
      if (/^[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(block.text)) {
        [startRatio, endRatio] = [1 - endRatio, 1 - startRatio];
      }
      const startIndex = Math.max(0, Math.floor(startRatio * characters.length));
      const endIndex = Math.min(characters.length, Math.max(startIndex + 1, Math.ceil(endRatio * characters.length)));
      text = characters.slice(startIndex, endIndex).join('').trim();
    }
    if (text) selected.push({ index: block.index, text });
  }
  return selected.sort((a, b) => a.index - b.index).map((item) => item.text).join('\n').trim();
}

async function translateCaptureSelection(text) {
  const sourceTextValue = String(text || '').trim().slice(0, 3000);
  if (!sourceTextValue || !lastCaptureResult) return;
  const request = ++captureSelectionRequest;
  captureSourceText.textContent = sourceTextValue;
  captureTranslatedText.textContent = '正在本地翻译选中片段…';
  try {
    const result = await api.translateSelection({
      text: sourceTextValue,
      sourceLanguage: 'auto',
      targetLanguage: lastCaptureResult.targetLanguage || targetLanguage
    });
    if (request !== captureSelectionRequest || !lastCaptureResult) return;
    lastCaptureResult.sourceText = sourceTextValue;
    lastCaptureResult.translatedText = result.text || '';
    lastCaptureResult.sourceLanguage = result.detectedSourceLanguage || result.sourceLanguage || lastCaptureResult.sourceLanguage;
    captureTranslatedText.textContent = lastCaptureResult.translatedText;
    captureResultMeta.textContent = `${languageDisplayName(lastCaptureResult.sourceLanguage)} → ${languageDisplayName(result.targetLanguage)} · 图片划词翻译`;
  } catch (error) {
    if (request === captureSelectionRequest) captureTranslatedText.textContent = error?.message || String(error);
  }
}

function beginCaptureDrag(event) {
  if (event.button !== 0 || !lastCaptureResult || captureBlockLayer.childElementCount === 0) return;
  event.preventDefault();
  clearCaptureSelection();
  const point = captureLocalPoint(event);
  captureDragState = { pointerId: event.pointerId, start: point, current: point };
  capturePreviewStage.setPointerCapture?.(event.pointerId);
  paintCaptureDrag(point, point);
}

function moveCaptureDrag(event) {
  if (!captureDragState || event.pointerId !== captureDragState.pointerId) return;
  event.preventDefault();
  captureDragState.current = captureLocalPoint(event);
  paintCaptureDrag(captureDragState.start, captureDragState.current);
}

function finishCaptureDrag(event) {
  if (!captureDragState || event.pointerId !== captureDragState.pointerId) return;
  event.preventDefault();
  const state = captureDragState;
  const end = captureLocalPoint(event);
  captureDragState = null;
  capturePreviewStage.releasePointerCapture?.(event.pointerId);
  captureDragSelection.classList.remove('visible');
  const left = Math.min(state.start.x, end.x);
  const right = Math.max(state.start.x, end.x);
  const top = Math.min(state.start.y, end.y);
  const bottom = Math.max(state.start.y, end.y);
  if (right - left < 4 && bottom - top < 4) return;
  const text = selectedTextFromCaptureRect({ left, right, top, bottom, height: bottom - top }, end.width, end.height);
  if (text) void translateCaptureSelection(text);
}

function openCaptureResult(result) {
  lastCaptureResult = {
    ...result,
    fullSourceText: result.sourceText || '',
    fullTranslatedText: result.translatedText || ''
  };
  setCaptureBusy(false);
  hideCaptureProgress();
  capturePreviewImage.src = result.imageDataUrl || '';
  captureSourceText.textContent = result.sourceText || '';
  captureTranslatedText.textContent = result.translatedText || '';
  const source = languageDisplayName(result.sourceLanguage || sourceLanguage);
  const target = languageDisplayName(result.targetLanguage || targetLanguage);
  const elapsed = (Number(result.ocrElapsedMs || 0) + Number(result.translationElapsedMs || 0)) / 1000;
  captureResultMeta.textContent = `${source} → ${target} · ${result.ocrModel || '本地 OCR'} · ${elapsed.toFixed(1)} 秒`;
  captureResultLayer.classList.add('visible');
  captureResultLayer.setAttribute('aria-hidden', 'false');
  if (capturePreviewImage.complete) requestAnimationFrame(() => renderCaptureBlockLayer(lastCaptureResult));
  else capturePreviewImage.addEventListener('load', () => renderCaptureBlockLayer(lastCaptureResult), { once: true });
  requestAnimationFrame(() => captureCopyAndClose.focus());
}

function closeCaptureResult(restoreFocus = true) {
  if (!captureResultLayer.classList.contains('visible')) return;
  captureResultLayer.classList.remove('visible');
  captureResultLayer.setAttribute('aria-hidden', 'true');
  clearCaptureSelection();
  if (restoreFocus) captureButton.focus();
}

async function copyCaptureText(value, message) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  showToast(message);
}

async function copyCaptureAndCloseResult() {
  if (!lastCaptureResult?.translatedText) return;
  await copyCaptureText(lastCaptureResult.translatedText, '截图译文已复制');
  closeCaptureResult();
}

function renderWindowMaximized(maximized) {
  for (const button of [windowMaximize, documentWindowMaximize]) {
    button.dataset.maximized = String(Boolean(maximized));
    button.title = maximized ? '还原' : '最大化';
    button.setAttribute('aria-label', button.title);
  }
}

async function toggleWindowMaximize() {
  const state = await api.windowControl('maximize');
  renderWindowMaximized(state?.maximized);
}

async function insertCaptureResult() {
  if (!lastCaptureResult) return;
  const source = String(lastCaptureResult.sourceText || '').slice(0, 3000);
  sourceText.value = source;
  charCount.textContent = `${source.length} / 3000`;
  detectedSourceLanguage = languageByCode.has(lastCaptureResult.sourceLanguage) ? lastCaptureResult.sourceLanguage : null;
  if (languageByCode.has(lastCaptureResult.targetLanguage)) targetLanguage = lastCaptureResult.targetLanguage;
  lastTranslation = lastCaptureResult.translatedText || '';
  await renderTranslation(lastTranslation);
  renderLanguageRoute();
  persistLanguageRoute();
  translationMeta.textContent = `${languageDisplayName(lastCaptureResult.sourceLanguage)} → ${languageDisplayName(targetLanguage)} · 来自截图 OCR`;
  closeCaptureResult();
  if (String(lastCaptureResult.sourceText || '').length > 3000) showToast('OCR 原文较长，主界面仅回填前 3000 字');
}

sourceLanguageButton.addEventListener('click', () => openLanguagePicker('source'));
targetLanguageButton.addEventListener('click', () => openLanguagePicker('target'));
documentSourceButton.addEventListener('click', () => openLanguagePicker('document-source'));
documentTargetButton.addEventListener('click', () => openLanguagePicker('document-target'));
languagePickerBackdrop.addEventListener('click', closeLanguagePicker);
languagePickerClose.addEventListener('click', closeLanguagePicker);
languageSearchInput.addEventListener('input', renderLanguagePicker);
captureButton.addEventListener('click', startCaptureTranslation);
sourceImageButton.addEventListener('click', () => sourceImageInput.click());
sourceImageInput.addEventListener('change', () => {
  const file = sourceImageInput.files?.[0] || null;
  sourceImageInput.value = '';
  if (file) void submitImageForCapture(file, false);
});
documentButton.addEventListener('click', openDocumentPage);
captureResultBackdrop.addEventListener('click', () => closeCaptureResult());
captureResultClose.addEventListener('click', () => closeCaptureResult());
capturePreviewStage.addEventListener('pointerdown', beginCaptureDrag);
capturePreviewStage.addEventListener('pointermove', moveCaptureDrag);
capturePreviewStage.addEventListener('pointerup', finishCaptureDrag);
capturePreviewStage.addEventListener('pointercancel', () => clearCaptureSelection());
copyCaptureSource.addEventListener('click', () => copyCaptureText(lastCaptureResult?.sourceText, 'OCR 原文已复制'));
copyCaptureTranslation.addEventListener('click', () => copyCaptureText(lastCaptureResult?.translatedText, '截图译文已复制'));
captureCopyAndClose.addEventListener('click', copyCaptureAndCloseResult);
captureAgain.addEventListener('click', () => {
  closeCaptureResult(false);
  startCaptureTranslation();
});
captureInsert.addEventListener('click', insertCaptureResult);
closeDocumentPageButton.addEventListener('click', () => closeDocumentPage());
documentWindowMinimize.addEventListener('click', () => api.windowControl('minimize'));
documentWindowMaximize.addEventListener('click', toggleWindowMaximize);
documentSetupRailButton.addEventListener('click', () => {
  dismissDocumentVortexGuide();
  toggleDocumentSetup();
});
documentDropZone.addEventListener('click', chooseDocument);
clearDocumentFileButton.addEventListener('click', () => {
  if (activeDocumentTask && ['running', 'paused'].includes(activeDocumentTask.status)) return;
  void clearSelectedDocumentWithAnimation();
});
documentDropZone.addEventListener('dragenter', (event) => {
  event.preventDefault();
  documentDropZone.classList.add('dragging');
});
documentDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
});
documentDropZone.addEventListener('dragleave', (event) => {
  if (!documentDropZone.contains(event.relatedTarget)) documentDropZone.classList.remove('dragging');
});
documentDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  documentDropZone.classList.remove('dragging');
  acceptDroppedDocument(event.dataTransfer?.files?.[0]);
});
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('drop', (event) => event.preventDefault());
startDocumentTranslationButton.addEventListener('click', startDocumentTranslation);
pauseDocumentTaskButton.addEventListener('click', toggleDocumentPause);
cancelDocumentTaskButton.addEventListener('click', cancelDocumentTask);
showDocumentOutputButton.addEventListener('click', () => openDocumentOutput(true));
openDocumentOutputButton.addEventListener('click', () => openDocumentOutput(false));
documentZoomOut.addEventListener('click', () => setDocumentZoom(documentZoom - DOCUMENT_ZOOM_STEP));
documentZoomIn.addEventListener('click', () => setDocumentZoom(documentZoom + DOCUMENT_ZOOM_STEP));
documentViewerScroll.addEventListener('wheel', (event) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  const scale = Math.exp(-event.deltaY * .0016);
  setDocumentZoom(documentZoom * scale, event.clientX, event.clientY);
}, { passive: false });
documentViewerScroll.addEventListener('pointerdown', beginDocumentPan);
documentViewerScroll.addEventListener('pointermove', moveDocumentPan);
documentViewerScroll.addEventListener('pointerup', finishDocumentPan);
documentViewerScroll.addEventListener('pointercancel', finishDocumentPan);
documentViewerScroll.addEventListener('lostpointercapture', () => {
  documentPanState = null;
  documentViewerScroll.classList.remove('is-panning');
});
documentViewer.addEventListener('pointerup', scheduleDocumentSelectionTranslation);
documentViewer.addEventListener('keyup', scheduleDocumentSelectionTranslation);
copyDocumentSelection.addEventListener('click', () => copyCaptureText(lastDocumentSelectionTranslation, '划词译文已复制'));
pauseDocumentReaderTask.addEventListener('click', toggleDocumentPause);
cancelDocumentReaderTask.addEventListener('click', cancelDocumentTask);
showDocumentReaderOutput.addEventListener('click', () => openDocumentOutput(true));
openDocumentReaderOutput.addEventListener('click', () => openDocumentOutput(false));
translateButton.addEventListener('click', translate);
clearButton.addEventListener('click', clearAll);
copyButton.addEventListener('click', copyTranslation);
swapButton.addEventListener('click', swap);
themeToggle.addEventListener('click', toggleTheme);
windowMinimize.addEventListener('click', () => api.windowControl('minimize'));
windowMaximize.addEventListener('click', toggleWindowMaximize);
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
ocrModeGrid.addEventListener('click', (event) => {
  const option = event.target.closest('[data-ocr-mode]');
  if (!option) return;
  applyCaptureOcrMode(option.dataset.ocrMode);
  option.animate(
    [{ transform: 'scale(.97)' }, { transform: 'scale(1.018)' }, { transform: 'scale(1)' }],
    { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' }
  );
});
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
  if (sourceLanguage === 'auto' && detectedSourceLanguage) {
    detectedSourceLanguage = null;
    renderLanguageRoute();
  }
});
sourceText.addEventListener('paste', handleSourceImagePaste);
sourceText.addEventListener('click', inspectSourceWord);
sourceText.addEventListener('keyup', (event) => {
  if (event.key.startsWith('Arrow')) inspectSourceWord();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && captureResultLayer.classList.contains('visible')) {
    event.preventDefault();
    closeCaptureResult();
    return;
  }
  if (event.key === 'Escape' && languagePicker.classList.contains('active')) {
    event.preventDefault();
    closeLanguagePicker();
    return;
  }
  if (event.key === 'Tab' && languagePicker.classList.contains('active')) {
    const focusable = [...languagePicker.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
      .filter((element) => element.offsetParent !== null);
    if (focusable.length > 0) {
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  if (event.key === 'Escape' && documentPage.classList.contains('visible')) {
    event.preventDefault();
    closeDocumentPage();
    return;
  }
  if (event.key === 'Escape' && settingsPage.classList.contains('visible')) closeSettings();
  if (event.ctrlKey && event.key === 'Enter'
      && !document.body.classList.contains('experience-open')
      && !document.body.classList.contains('language-picker-open')) translate();
});
openLogButton.addEventListener('click', () => api.openLog());

api.onEngineStatus(setEngineStatus);
api.onWindowState(({ maximized }) => {
  renderWindowMaximized(maximized);
});
api.onCaptureShortcutStatus(({ registered }) => {
  captureShortcutRegistered = Boolean(registered);
  updateCaptureButtonHint();
});
api.onCaptureStatus(({ status, detail, progress }) => {
  if (status === 'cancelled') {
    setCaptureBusy(false);
    hideCaptureProgress();
    return;
  }
  if (['preparing', 'recognizing', 'translating'].includes(status)) {
    setCaptureBusy(true, detail || '正在处理截图…');
    showCaptureProgress(status, detail, progress);
  }
});
api.onCaptureResult(openCaptureResult);
api.onCaptureError(({ message }) => {
  setCaptureBusy(false);
  hideCaptureProgress();
  showToast(message || '截图翻译没有完成');
});
api.onDocumentProgress((task) => {
  if (!activeDocumentTask || activeDocumentTask.id === task.id) renderDocumentTask(task);
});

const documentViewerResizeObserver = new ResizeObserver(() => scheduleDocumentViewerMeasure(false));
documentViewerResizeObserver.observe(documentViewer);
window.addEventListener('resize', () => scheduleDocumentViewerMeasure(true), { passive: true });

const storedTheme = persistedExperience.theme
  || localStorage.getItem('yilan-theme')
  || localStorage.getItem('offline-translator-theme');
applyTheme(storedTheme === 'light' ? 'light' : 'dark');
initializeLanguageRoute();
initializeExperience();
enableGlassInteractions();
updateCaptureButtonHint();

const initializeRuntimeInfo = () => {
  api.appInfo()
    .then((info) => {
      const gpuComposited = info.hardwareAcceleration && info.gpuFeatures?.gpu_compositing === 'enabled';
      renderMode.textContent = gpuComposited ? 'GPU 加速 UI' : '合成 UI';
      setEngineStatus({ status: 'idle', detail: info.hardwareProfile?.label || '离线引擎按需启动' });
    })
    .catch(() => setEngineStatus({ status: 'idle', detail: '离线引擎按需启动' }));
};
if ('requestIdleCallback' in window) requestIdleCallback(initializeRuntimeInfo, { timeout: 900 });
else setTimeout(initializeRuntimeInfo, 320);

if (!document.body.classList.contains('experience-open')) sourceText.focus();

// Reveal only after the persisted visual state has been applied and Chromium
// has committed two frames. This prevents the packaged window from exposing a
// blank dark surface while the full interface is still being laid out.
requestAnimationFrame(() => {
  requestAnimationFrame(() => api.rendererReady());
});
