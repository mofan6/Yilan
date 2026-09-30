const { app, BrowserWindow, ipcMain, shell, nativeImage, Menu, dialog, globalShortcut } = require('electron');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { TranslationQueue } = require('./services/translation-queue');

const STARTUP_STARTED_AT = performance.now();

app.setName('译澜');
// Keep renderer storage and app preferences in one stable location across
// development, packaged builds, upgrades and custom install directories.
app.setPath('userData', path.join(app.getPath('appData'), '译澜'));
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

const DEV_ROOT = path.resolve(__dirname, '..', 'base-unpacked', 'resources');
const BUNDLED_ROOT = process.resourcesPath;
const INSTALL_ROOT = app.isPackaged && fs.existsSync(path.join(BUNDLED_ROOT, 'models')) ? BUNDLED_ROOT : DEV_ROOT;
const MODEL_PATH = path.join(INSTALL_ROOT, 'models', 'Hy-MT2-1.8B-Q6_K.gguf');
const DATABASE_PATH = path.join(INSTALL_ROOT, 'data', 'dictionary.sqlite3');
const OCR_ROOT = path.join(INSTALL_ROOT, 'ocr', 'RapidOCR-json_v0.2.0');
const LOG_PATH = path.join(app.getPath('userData'), 'logs', 'yilan-engine.log');
const APP_LOG_PATH = path.join(app.getPath('userData'), 'logs', 'yilan-app.log');
const EXPERIENCE_STATE_PATH = path.join(app.getPath('userData'), 'experience.json');
const SERVER_URL = 'http://127.0.0.1:18081';
const API_KEY = 'offline-translator-local-only';
const MAX_INPUT_CHARS = 3000;

const LANGUAGE_SPECS = Object.freeze({
  zh: { name: 'Chinese (Simplified)', label: '中文（简体）' },
  en: { name: 'English', label: '英语' },
  fr: { name: 'French', label: '法语' },
  pt: { name: 'Portuguese', label: '葡萄牙语' },
  es: { name: 'Spanish', label: '西班牙语' },
  ja: { name: 'Japanese', label: '日语' },
  tr: { name: 'Turkish', label: '土耳其语' },
  ru: { name: 'Russian', label: '俄语' },
  ar: { name: 'Arabic', label: '阿拉伯语' },
  ko: { name: 'Korean', label: '韩语' },
  th: { name: 'Thai', label: '泰语' },
  it: { name: 'Italian', label: '意大利语' },
  de: { name: 'German', label: '德语' },
  vi: { name: 'Vietnamese', label: '越南语' },
  ms: { name: 'Malay', label: '马来语' },
  id: { name: 'Indonesian', label: '印尼语' },
  tl: { name: 'Filipino', label: '菲律宾语' },
  hi: { name: 'Hindi', label: '印地语' },
  'zh-Hant': { name: 'Chinese (Traditional)', label: '繁体中文' },
  pl: { name: 'Polish', label: '波兰语' },
  cs: { name: 'Czech', label: '捷克语' },
  nl: { name: 'Dutch', label: '荷兰语' },
  km: { name: 'Khmer', label: '高棉语' },
  my: { name: 'Burmese', label: '缅甸语' },
  fa: { name: 'Persian', label: '波斯语' },
  gu: { name: 'Gujarati', label: '古吉拉特语' },
  ur: { name: 'Urdu', label: '乌尔都语' },
  te: { name: 'Telugu', label: '泰卢固语' },
  mr: { name: 'Marathi', label: '马拉地语' },
  he: { name: 'Hebrew', label: '希伯来语' },
  bn: { name: 'Bengali', label: '孟加拉语' },
  ta: { name: 'Tamil', label: '泰米尔语' },
  uk: { name: 'Ukrainian', label: '乌克兰语' },
  bo: { name: 'Tibetan', label: '藏语' },
  kk: { name: 'Kazakh', label: '哈萨克语' },
  mn: { name: 'Mongolian', label: '蒙古语' },
  ug: { name: 'Uyghur', label: '维吾尔语' },
  yue: { name: 'Cantonese', label: '粤语' }
});
const LANGUAGE_CODES = Object.freeze(Object.keys(LANGUAGE_SPECS));
const FRANC_TO_LANGUAGE = Object.freeze({
  cmn: 'zh', eng: 'en', fra: 'fr', por: 'pt', spa: 'es', jpn: 'ja', tur: 'tr', rus: 'ru',
  arb: 'ar', kor: 'ko', tha: 'th', ita: 'it', deu: 'de', vie: 'vi', zlm: 'ms', ind: 'id',
  tgl: 'tl', hin: 'hi', pol: 'pl', ces: 'cs', nld: 'nl', khm: 'km', mya: 'my', pes: 'fa',
  guj: 'gu', urd: 'ur', tel: 'te', mar: 'mr', heb: 'he', ben: 'bn', tam: 'ta', ukr: 'uk',
  bod: 'bo', kaz: 'kk', mon: 'mn', uig: 'ug', yue: 'yue'
});
const FRANC_LANGUAGE_CODES = Object.freeze(Object.keys(FRANC_TO_LANGUAGE));

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('force-color-profile', 'srgb');

let mainWindow = null;
let startupWindow = null;
let mainWindowReady = false;
let mainWindowPaintReady = false;
let mainRendererReady = false;
let mainWindowRevealTimer = null;
let startupSwapTimer = null;
let startupFallbackTimer = null;
let startupPreparationTimer = null;
let startupShowPromise = null;
let startupProgressValue = 12;
let startupWindowShownAt = 0;
let startupPreparationPromise = null;
let startupPreparationComplete = false;
let focusMainWindowWhenReady = false;
let appIsQuitting = false;
let dictionary = null;
let lookupStatement = null;
let maxChineseWordLength = 12;
let serverProcess = null;
let serverLog = null;
let enginePromise = null;
let engineReady = false;
let activeBackend = null;
let hardwareProfilePromise = null;
let francDetectorPromise = null;
let ocrWorker = null;
let captureService = null;
let documentService = null;
let DocumentTranslationServiceClass = null;
let captureShortcutRegistered = false;
const translationQueue = new TranslationQueue();
const documentTokens = new Map();
let capturePreferences = {
  sourceLanguage: 'auto',
  targetLanguage: 'en',
  ocrMode: 'smart',
  theme: 'dark',
  accentA: '#ffad55',
  accentB: '#ef6556'
};

function backendDirectory(id) {
  return app.isPackaged
    ? path.join(INSTALL_ROOT, 'runtime', id)
    : path.resolve(__dirname, '..', `runtime-${id}`);
}

const BACKENDS = [
  {
    id: 'vulkan',
    label: 'Vulkan GPU/集显',
    directory: backendDirectory('vulkan'),
    gpuLayers: 'all'
  },
  {
    id: 'cpu',
    label: 'CPU',
    directory: backendDirectory('cpu'),
    gpuLayers: '0'
  }
];

async function detectHardwareProfile() {
  if (hardwareProfilePromise) return hardwareProfilePromise;
  hardwareProfilePromise = (async () => {
    try {
      const gpuInfo = await app.getGPUInfo('complete');
      const devices = Array.isArray(gpuInfo?.gpuDevice) ? gpuInfo.gpuDevice : [];
      const normalized = devices.map((device) => {
        const rawVendor = device?.vendorId;
        const vendor = typeof rawVendor === 'number'
          ? rawVendor
          : /^0x/i.test(String(rawVendor || ''))
            ? Number.parseInt(String(rawVendor).slice(2), 16)
            : Number(rawVendor || 0);
        return {
          vendor,
          description: JSON.stringify(device || {}).toLowerCase(),
          active: Boolean(device?.active)
        };
      }).filter(({ vendor, description }) => vendor !== 0x1414 && !/swiftshader|microsoft basic|llvmpipe/.test(description));

      const nvidia = normalized.find(({ vendor }) => vendor === 0x10de);
      if (nvidia) return { id: 'discrete', label: '独显' };

      const amdDiscrete = normalized.find(({ vendor, description }) =>
        (vendor === 0x1002 || vendor === 0x1022) &&
        !/\bapu\b|radeon\(tm\) graphics|vega\s*\d*\s*graphics|\b(660m|680m|760m|780m|880m|890m)\b/.test(description)
      );
      if (amdDiscrete) return { id: 'discrete', label: '独显' };

      if (normalized.some(({ vendor }) => vendor === 0x8086 || vendor === 0x1002 || vendor === 0x1022)) {
        return { id: 'integrated', label: '集显' };
      }
      if (normalized.length > 0) return { id: 'integrated', label: '集显' };
      return { id: 'cpu', label: 'CPU' };
    } catch {
      return { id: 'cpu', label: 'CPU' };
    }
  })();
  return hardwareProfilePromise;
}

const ACCENT_IDS = new Set(['aurora', 'jade', 'orange', 'sapphire', 'orchid', 'rose', 'cyan', 'gold']);

function readExperienceState() {
  try {
    const stored = JSON.parse(fs.readFileSync(EXPERIENCE_STATE_PATH, 'utf8'));
    return {
      accent: ACCENT_IDS.has(stored?.accent) ? stored.accent : null,
      theme: stored?.theme === 'light' || stored?.theme === 'dark' ? stored.theme : null,
      onboardingComplete: stored?.onboardingComplete === true
    };
  } catch {
    return { accent: null, theme: null, onboardingComplete: false };
  }
}

function writeExperienceState(patch = {}) {
  const current = readExperienceState();
  const next = {
    accent: ACCENT_IDS.has(patch.accent) ? patch.accent : current.accent,
    theme: patch.theme === 'light' || patch.theme === 'dark' ? patch.theme : current.theme,
    onboardingComplete: typeof patch.onboardingComplete === 'boolean'
      ? patch.onboardingComplete
      : current.onboardingComplete
  };
  fs.mkdirSync(path.dirname(EXPERIENCE_STATE_PATH), { recursive: true });
  const temporaryPath = `${EXPERIENCE_STATE_PATH}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, EXPERIENCE_STATE_PATH);
  return next;
}

function writeAppLog(message) {
  try {
    fs.mkdirSync(path.dirname(APP_LOG_PATH), { recursive: true });
    fs.appendFileSync(APP_LOG_PATH, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  } catch {}
}

process.on('uncaughtException', (error) => {
  writeAppLog(`uncaughtException: ${error?.stack || error}`);
});
process.on('unhandledRejection', (error) => {
  writeAppLog(`unhandledRejection: ${error?.stack || error}`);
});

function accentIconPath(accent) {
  const selected = ACCENT_IDS.has(accent) ? accent : 'orange';
  const root = app.isPackaged ? path.join(process.resourcesPath, 'icons') : path.join(__dirname, 'build', 'accent-icons');
  return path.join(root, `${selected}.ico`);
}

function refreshWindowsIcons() {
  const systemRoot = process.env.SystemRoot || 'C:\\Windows';
  const refreshTool = path.join(systemRoot, 'System32', 'ie4uinit.exe');
  if (!fs.existsSync(refreshTool)) return;
  const refresh = spawn(refreshTool, ['-show'], { windowsHide: true, detached: true, stdio: 'ignore' });
  refresh.unref();
}

function shortcutCandidates() {
  const publicProfile = process.env.PUBLIC || path.join(path.parse(app.getPath('home')).root, 'Users', 'Public');
  const programData = process.env.ProgramData || 'C:\\ProgramData';
  return [
    { shortcutPath: path.join(app.getPath('desktop'), '译澜.lnk'), ensure: true },
    { shortcutPath: path.join(publicProfile, 'Desktop', '译澜.lnk'), ensure: false },
    {
      shortcutPath: path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', '译澜.lnk'),
      ensure: true
    },
    {
      shortcutPath: path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', '译澜.lnk'),
      ensure: false
    }
  ];
}

function updateShortcutIcons(accent) {
  const icon = accentIconPath(accent);
  if (!fs.existsSync(icon)) return { updated: 0, icon: null };
  if (!app.isPackaged) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try { mainWindow.setIcon(nativeImage.createFromPath(icon)); } catch {}
    }
    return { updated: 0, icon };
  }
  let updated = 0;
  for (const { shortcutPath, ensure } of shortcutCandidates()) {
    const exists = fs.existsSync(shortcutPath);
    if (!exists && !ensure) continue;
    try {
      if (!exists) fs.mkdirSync(path.dirname(shortcutPath), { recursive: true });
      const details = exists ? shell.readShortcutLink(shortcutPath) : {};
      const operation = exists ? 'replace' : 'create';
      const succeeded = shell.writeShortcutLink(shortcutPath, operation, {
        ...details,
        target: process.execPath,
        cwd: path.dirname(process.execPath),
        description: '译澜 · 38 语言离线翻译',
        icon,
        iconIndex: 0
      });
      if (succeeded) updated += 1;
      else writeAppLog(`快捷方式更新失败：${shortcutPath}`);
    } catch (error) {
      writeAppLog(`快捷方式更新失败：${shortcutPath} · ${error?.message || error}`);
    }
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    try { mainWindow.setIcon(nativeImage.createFromPath(icon)); } catch {}
  }
  if (updated > 0) refreshWindowsIcons();
  return { updated, icon };
}

function sendEngineStatus(status, detail = '') {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('engine-status', { status, detail });
  }
}

function openDictionary() {
  if (dictionary && lookupStatement) return dictionary;
  dictionary = new DatabaseSync(DATABASE_PATH, { readOnly: true });
  lookupStatement = dictionary.prepare(
    'SELECT word, lang, definition FROM entries WHERE word = ? LIMIT 1'
  );
  const row = dictionary
    .prepare("SELECT value FROM meta WHERE key = 'max_zh_len'")
    .get();
  if (row) maxChineseWordLength = Math.min(Number(row.value) || 12, 16);
  return dictionary;
}

function englishCandidates(value) {
  const word = value.toLowerCase().replaceAll('’', "'");
  const candidates = [];
  const irregular = {
    am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be',
    has: 'have', had: 'have', does: 'do', did: 'do', went: 'go', gone: 'go',
    better: 'good', best: 'good', worse: 'bad', worst: 'bad'
  };
  if (irregular[word]) candidates.push(irregular[word]);
  if (word.endsWith('ies') && word.length > 4) candidates.push(`${word.slice(0, -3)}y`);
  if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3);
    candidates.push(stem, `${stem}e`);
    if (stem.length > 2 && stem.at(-1) === stem.at(-2)) candidates.push(stem.slice(0, -1));
  }
  if (word.endsWith('ed') && word.length > 4) {
    const stem = word.slice(0, -2);
    candidates.push(stem, `${stem}e`);
    if (stem.length > 2 && stem.at(-1) === stem.at(-2)) candidates.push(stem.slice(0, -1));
  }
  if (word.endsWith('es') && word.length > 4) candidates.push(word.slice(0, -2), word.slice(0, -1));
  else if (word.endsWith('s') && word.length > 3) candidates.push(word.slice(0, -1));
  if (word.endsWith('ly') && word.length > 4) candidates.push(word.slice(0, -2));
  return [...new Set(candidates.filter((item) => item && item !== word))];
}

function lookupWord(value) {
  const word = String(value || '').trim();
  if (!word) return null;
  if (!lookupStatement) openDictionary();
  let row = lookupStatement.get(word);
  if (row) return { ...row, requested: word };
  if (/^[\x00-\x7F]+$/.test(word)) {
    for (const candidate of englishCandidates(word)) {
      row = lookupStatement.get(candidate);
      if (row) return { ...row, requested: word };
    }
  }
  return null;
}

function isCjk(character) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(character || '');
}

function chineseWordAt(text, offset) {
  if (!text) return null;
  let cursor = Math.min(Math.max(Number(offset) || 0, 0), text.length - 1);
  if (!isCjk(text[cursor])) {
    if (cursor > 0 && isCjk(text[cursor - 1])) cursor -= 1;
    else return null;
  }
  let blockStart = cursor;
  while (blockStart > 0 && isCjk(text[blockStart - 1])) blockStart -= 1;
  let blockEnd = cursor + 1;
  while (blockEnd < text.length && isCjk(text[blockEnd])) blockEnd += 1;

  let best = null;
  const leftMin = Math.max(blockStart, cursor - maxChineseWordLength + 1);
  const rightMax = Math.min(blockEnd, cursor + maxChineseWordLength);
  for (let left = leftMin; left <= cursor; left += 1) {
    for (let right = rightMax; right > cursor; right -= 1) {
      if (right - left > maxChineseWordLength) continue;
      const candidate = text.slice(left, right);
      const entry = lookupWord(candidate);
      if (entry && (!best || candidate.length > best.word.length)) {
        best = { word: candidate, start: left, end: right, entry };
      }
    }
  }
  if (best) return best;
  const word = text.slice(cursor, cursor + 1);
  return { word, start: cursor, end: cursor + 1, entry: lookupWord(word) };
}

function wordAt(text, offset) {
  const value = String(text || '');
  if (!value) return null;
  const cursor = Math.min(Math.max(Number(offset) || 0, 0), value.length - 1);
  if (isCjk(value[cursor]) || (cursor > 0 && isCjk(value[cursor - 1]))) {
    return chineseWordAt(value, cursor);
  }
  const regex = /[A-Za-z]+(?:['’\-][A-Za-z]+)*/gu;
  for (const match of value.matchAll(regex)) {
    const start = match.index;
    const end = start + match[0].length;
    if ((start <= cursor && cursor < end) || (cursor === end && cursor > start)) {
      return { word: match[0], start, end, entry: lookupWord(match[0]) };
    }
  }
  return null;
}

function pushToken(tokens, text, word = null, known = false) {
  if (!text) return;
  if (!word && tokens.length && !tokens.at(-1).word) tokens.at(-1).text += text;
  else tokens.push({ text, word, known });
}

function tokenizeText(text) {
  const value = String(text || '');
  const tokens = [];
  let cursor = 0;
  while (cursor < value.length) {
    const rest = value.slice(cursor);
    const english = rest.match(/^[A-Za-z]+(?:['’\-][A-Za-z]+)*/u);
    if (english) {
      const word = english[0];
      pushToken(tokens, word, word, Boolean(lookupWord(word)));
      cursor += word.length;
      continue;
    }
    if (isCjk(value[cursor])) {
      let blockEnd = cursor + 1;
      while (blockEnd < value.length && isCjk(value[blockEnd])) blockEnd += 1;
      let position = cursor;
      while (position < blockEnd) {
        let found = null;
        const maxEnd = Math.min(blockEnd, position + maxChineseWordLength);
        for (let end = maxEnd; end > position; end -= 1) {
          const candidate = value.slice(position, end);
          const entry = lookupWord(candidate);
          if (entry) {
            found = { word: candidate, entry };
            break;
          }
        }
        if (found) {
          pushToken(tokens, found.word, found.word, true);
          position += found.word.length;
        } else {
          const character = value[position];
          pushToken(tokens, character, character, false);
          position += 1;
        }
      }
      cursor = blockEnd;
      continue;
    }
    pushToken(tokens, value[cursor]);
    cursor += 1;
  }
  return tokens;
}

async function healthCheck() {
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(1500)
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.status === 'ok';
  } catch {
    return false;
  }
}

async function ensureEngine() {
  if (engineReady && (await healthCheck())) return true;
  if (enginePromise) return enginePromise;
  enginePromise = (async () => {
    if (await healthCheck()) {
      engineReady = true;
      const profile = activeBackend?.id === 'cpu' ? { label: 'CPU' } : await detectHardwareProfile();
      sendEngineStatus('ready', profile.label);
      return true;
    }
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    serverLog = fs.createWriteStream(LOG_PATH, { flags: 'a' });
    const failures = [];
    for (const backend of BACKENDS) {
      const serverExe = path.join(backend.directory, 'llama-server.exe');
      if (!fs.existsSync(serverExe)) {
        failures.push(`${backend.label}：运行文件缺失`);
        continue;
      }
      const displayedProfile = backend.id === 'cpu' ? { label: 'CPU' } : await detectHardwareProfile();
      sendEngineStatus('loading', displayedProfile.label);
      serverLog.write(`\n[译澜] 尝试后端：${backend.label}\n`);
      const args = [
        '-m', MODEL_PATH,
        '--host', '127.0.0.1',
        '--port', '18081',
        '--api-key', API_KEY,
        '--cors-origins', 'localhost',
        '-ngl', backend.gpuLayers,
        '-c', '4096',
        '-np', '1',
        '-t', String(Math.max(1, Math.min(12, os.availableParallelism() - 1))),
        '--no-warmup',
        '--no-webui'
      ];
      let spawnError = null;
      const processForAttempt = spawn(serverExe, args, {
        cwd: backend.directory,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      // Model loading is intentionally kept below the UI processes on Windows.
      // This prevents Vulkan shader/model initialization from starving the
      // startup renderer and later making the visible main window appear hung.
      try {
        os.setPriority(processForAttempt.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
      } catch {}
      serverProcess = processForAttempt;
      processForAttempt.stdout.pipe(serverLog, { end: false });
      processForAttempt.stderr.pipe(serverLog, { end: false });
      processForAttempt.once('error', (error) => {
        spawnError = error;
      });
      for (let attempt = 0; attempt < 90; attempt += 1) {
        if (await healthCheck()) {
          engineReady = true;
          activeBackend = backend;
          processForAttempt.once('exit', (code) => {
            if (serverProcess !== processForAttempt) return;
            engineReady = false;
            activeBackend = null;
            sendEngineStatus('error', `翻译引擎已退出（${code ?? 'unknown'}）`);
          });
          const profile = backend.id === 'cpu' ? { label: 'CPU' } : await detectHardwareProfile();
          sendEngineStatus('ready', profile.label);
          return true;
        }
        if (spawnError || processForAttempt.exitCode !== null) break;
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      const reason = spawnError?.message || `退出代码 ${processForAttempt.exitCode ?? '超时'}`;
      failures.push(`${backend.label}：${reason}`);
      if (processForAttempt.exitCode === null) {
        try { processForAttempt.kill(); } catch {}
      }
      if (serverProcess === processForAttempt) serverProcess = null;
    }
    throw new Error(`所有离线推理后端均启动失败：${failures.join('；')}`);
  })();
  try {
    return await enginePromise;
  } catch (error) {
    engineReady = false;
    sendEngineStatus('error', error.message);
    throw error;
  } finally {
    enginePromise = null;
  }
}

async function requestModelCompletion(prompt, options = {}) {
  const timeoutSignal = AbortSignal.timeout(options.timeout || 180000);
  const signal = options.signal
    ? AbortSignal.any([timeoutSignal, options.signal])
    : timeoutSignal;
  const response = await fetch(`${SERVER_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      top_k: options.topK ?? 20,
      top_p: options.topP ?? 0.6,
      repeat_penalty: options.repeatPenalty ?? 1.05,
      stream: false
    }),
    signal
  });
  if (!response.ok) throw new Error(`翻译引擎返回 HTTP ${response.status}`);
  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('模型返回了空结果');
  return content;
}

function fallbackDetectedLanguage(text) {
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/u.test(text)) return 'ko';
  if (/[\u0e00-\u0e7f]/u.test(text)) return 'th';
  if (/[\u1780-\u17ff]/u.test(text)) return 'km';
  if (/[\u1000-\u109f]/u.test(text)) return 'my';
  if (/[\u0a80-\u0aff]/u.test(text)) return 'gu';
  if (/[\u0c00-\u0c7f]/u.test(text)) return 'te';
  if (/[\u0b80-\u0bff]/u.test(text)) return 'ta';
  if (/[\u0980-\u09ff]/u.test(text)) return 'bn';
  if (/[\u0f00-\u0fff]/u.test(text)) return 'bo';
  if (/[\u0590-\u05ff]/u.test(text)) return 'he';
  if (/[\u0600-\u06ff]/u.test(text)) return 'ar';
  if (/[\u0900-\u097f]/u.test(text)) return 'hi';
  if (/[\u0400-\u04ff]/u.test(text)) return 'ru';
  if (/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(text)) return 'zh';
  return 'en';
}

function detectDistinctiveScript(text) {
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/u.test(text)) return 'ko';
  if (/[\u0e00-\u0e7f]/u.test(text)) return 'th';
  if (/[\u1780-\u17ff]/u.test(text)) return 'km';
  if (/[\u1000-\u109f]/u.test(text)) return 'my';
  if (/[\u0a80-\u0aff]/u.test(text)) return 'gu';
  if (/[\u0c00-\u0c7f]/u.test(text)) return 'te';
  if (/[\u0b80-\u0bff]/u.test(text)) return 'ta';
  if (/[\u0980-\u09ff]/u.test(text)) return 'bn';
  if (/[\u0f00-\u0fff]/u.test(text)) return 'bo';
  if (/[\u0590-\u05ff]/u.test(text)) return 'he';
  if (/[\u0400-\u04ff]/u.test(text)) {
    if (/[іїєґ]/iu.test(text)) return 'uk';
    if (/[әғқңұһі]/iu.test(text)) return 'kk';
    if (/[өү]/iu.test(text)) return 'mn';
  }
  if (/[\u0600-\u06ff]/u.test(text) && /[ەېڭۈۆ]/u.test(text)) return 'ug';
  if (/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(text)) {
    if (/[喺嘅咗佢哋冇啲唔咩嚟畀噉攞]/u.test(text)) return 'yue';
    const traditional = (text.match(/[萬與專業東絲兩嚴個豐臨為麗舉麼義烏樂喬習鄉書買亂爭於雲亞產畝親億僅從侖倉儀們價眾優會傘偉傳傷倫體餘來侶俠係]/gu) || []).length;
    const simplified = (text.match(/[万与专业东丝两严个丰临为丽举么义乌乐乔习乡书买乱争于云亚产亩亲亿仅从仑仓仪们价众优会伞伟传伤伦体余来侣侠系]/gu) || []).length;
    return traditional > simplified ? 'zh-Hant' : 'zh';
  }
  return null;
}

async function detectSourceLanguage(source) {
  const distinctive = detectDistinctiveScript(source);
  if (distinctive) return distinctive;
  try {
    francDetectorPromise ||= import('franc-min');
    const { franc } = await francDetectorPromise;
    const isoCode = franc(source, { minLength: 3, only: FRANC_LANGUAGE_CODES });
    if (FRANC_TO_LANGUAGE[isoCode]) return FRANC_TO_LANGUAGE[isoCode];
  } catch (error) {
    writeAppLog(`本地语言识别器不可用，回退到字符检测：${error?.message || error}`);
  }
  return fallbackDetectedLanguage(source);
}

async function performTranslation(text, requestedSourceLanguage = 'auto', requestedTargetLanguage = 'en', options = {}) {
  const reportProgress = (progress, detail) => {
    if (typeof options.onProgress !== 'function') return;
    try {
      options.onProgress({ progress: Math.max(0, Math.min(1, Number(progress) || 0)), detail });
    } catch {}
  };
  const source = String(text || '').trim();
  if (!source) throw new Error('请输入需要翻译的句子');
  if (source.length > MAX_INPUT_CHARS) {
    throw new Error(`单次最多翻译 ${MAX_INPUT_CHARS} 个字符，请分段翻译`);
  }
  const sourceLanguage = requestedSourceLanguage === 'auto' || LANGUAGE_SPECS[requestedSourceLanguage]
    ? requestedSourceLanguage
    : 'auto';
  const targetLanguage = LANGUAGE_SPECS[requestedTargetLanguage] ? requestedTargetLanguage : 'en';
  reportProgress(.04, '正在确认本地翻译引擎状态…');
  await ensureEngine();
  reportProgress(.18, '本地模型已就绪，正在分析语种…');
  const started = performance.now();
  const detectedSourceLanguage = sourceLanguage === 'auto'
    ? await detectSourceLanguage(source)
    : sourceLanguage;
  reportProgress(.34, '语种分析完成，正在组织翻译上下文…');
  const sourceSpec = LANGUAGE_SPECS[detectedSourceLanguage];
  const targetSpec = LANGUAGE_SPECS[targetLanguage];
  const documentMode = String(options.mode || '').startsWith('document');
  const selectionMode = options.mode === 'selection';
  const instruction = documentMode
    ? `Translate the following document segment into ${targetSpec.name}. Preserve every token shaped like ⟦YILAN_NT_...⟧ or ⟦YILAN_SEG_...⟧ exactly. Return only the translated segment, with no explanation.`
    : `Translate the following segment into ${targetSpec.name}, without additional explanation.`;
  const prompt = [
    `Source language: ${sourceSpec.name} (${sourceSpec.label})`,
    `Target language: ${targetSpec.name} (${targetSpec.label})`,
    instruction,
    '',
    source
  ].join('\n');
  reportProgress(.43, '正在由本地模型生成译文…');
  const translated = await requestModelCompletion(prompt, {
    maxTokens: 1536,
    temperature: documentMode ? (options.mode === 'document-strict' ? 0 : 0.18) : (options.mode === 'ocr' || selectionMode) ? 0.2 : 0.7,
    topP: documentMode ? 0.58 : 0.6,
    timeout: documentMode ? 240000 : 180000,
    signal: options.signal
  });
  reportProgress(.98, '译文生成完成，正在整理结果…');
  return {
    text: translated,
    sourceLanguage,
    detectedSourceLanguage: sourceLanguage === 'auto' ? detectedSourceLanguage : null,
    targetLanguage,
    elapsedMs: Math.round(performance.now() - started)
  };
}

function translateText(text, requestedSourceLanguage = 'auto', requestedTargetLanguage = 'en', options = {}) {
  const priority = Number.isFinite(options.priority) ? options.priority : 100;
  return translationQueue.enqueue(
    () => performTranslation(text, requestedSourceLanguage, requestedTargetLanguage, options),
    { priority, signal: options.signal }
  );
}

function cleanOcrCache() {
  const directory = path.join(app.getPath('userData'), 'cache', 'ocr');
  if (!fs.existsSync(directory)) return;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const filePath = path.join(directory, entry.name);
    try {
      if (fs.statSync(filePath).mtimeMs < cutoff) fs.unlinkSync(filePath);
    } catch {}
  }
}

function sendCaptureShortcutStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('capture:shortcut-status', {
      accelerator: 'Alt+Q',
      registered: captureShortcutRegistered
    });
  }
}

function getOcrWorker() {
  if (ocrWorker) return ocrWorker;
  const { OcrWorkerManager } = require('./services/ocr-worker');
  cleanOcrCache();
  ocrWorker = new OcrWorkerManager(OCR_ROOT, writeAppLog);
  return ocrWorker;
}

function getCaptureService() {
  if (captureService) return captureService;
  const { CaptureTranslationService } = require('./services/capture-service');
  captureService = new CaptureTranslationService({
    app,
    preloadPath: path.join(__dirname, 'capture-preload.js'),
    htmlPath: path.join(__dirname, 'renderer', 'capture.html'),
    getMainWindow: () => mainWindow,
    ocr: getOcrWorker(),
    translate: translateText,
    log: writeAppLog
  });
  return captureService;
}

function getDocumentTranslationServiceClass() {
  if (!DocumentTranslationServiceClass) {
    ({ DocumentTranslationService: DocumentTranslationServiceClass } = require('./services/document-service'));
  }
  return DocumentTranslationServiceClass;
}

function getDocumentService() {
  if (documentService) return documentService;
  const DocumentTranslationService = getDocumentTranslationServiceClass();
  documentService = new DocumentTranslationService({
    translate: translateText,
    ocr: getOcrWorker(),
    cacheDirectory: path.join(app.getPath('userData'), 'cache', 'pdf-ocr'),
    log: writeAppLog,
    onUpdate: (task) => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('document:progress', task);
    }
  });
  return documentService;
}

function registerCaptureShortcut() {
  if (captureShortcutRegistered) return;
  captureShortcutRegistered = globalShortcut.register('Alt+Q', () => {
    Promise.resolve()
      .then(() => getCaptureService().start(capturePreferences))
      .catch((error) => {
        writeAppLog(`截图快捷键启动失败: ${error?.stack || error}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('capture:error', { message: error?.message || String(error) });
        }
      });
  });
  mainWindow?.webContents.once('did-finish-load', sendCaptureShortcutStatus);
}

function sendStartupProgress(progress, detail) {
  if (!startupWindow || startupWindow.isDestroyed()) return;
  startupProgressValue = Math.max(startupProgressValue, Math.round(Number(progress) || 0));
  startupWindow.webContents.send('startup:progress', { progress: startupProgressValue, detail });
}

function maybeRevealMainWindow(reason = 'startup-ready') {
  if (!mainRendererReady || !startupPreparationComplete) return;
  revealMainWindow(reason);
}

function startStartupPreparation() {
  if (startupPreparationPromise) return startupPreparationPromise;
  startupPreparationPromise = (async () => {
    sendStartupProgress(24, '正在准备本地语言与词典资源…');
    try {
      openDictionary();
      sendStartupProgress(32, '本地词典已就绪，正在加载翻译模型…');
    } catch (error) {
      writeAppLog(`本地词典预备失败：${error?.stack || error}`);
      sendStartupProgress(32, '词典将在首次使用时加载，正在准备翻译模型…');
    }

    try {
      await ensureEngine();
      sendStartupProgress(74, '本地翻译模型已就绪，正在预热文字识别…');
    } catch (error) {
      writeAppLog(`本地模型启动预备失败：${error?.stack || error}`);
      sendStartupProgress(74, '翻译模型将在首次使用时重试，正在预热文字识别…');
    }

    try {
      await getOcrWorker().warmup(['common']);
      sendStartupProgress(88, '文字识别已就绪，正在准备截图选区…');
    } catch (error) {
      writeAppLog(`OCR 后台预热失败：${error?.stack || error}`);
      sendStartupProgress(88, '文字识别将在首次使用时重试，正在准备界面…');
    }

    try {
      if (!captureService?.active) await getCaptureService().warmup();
    } catch (error) {
      writeAppLog(`截图选区预热失败：${error?.stack || error}`);
    }

    startupPreparationComplete = true;
    sendStartupProgress(94, '本地能力准备完成，正在切换到主界面…');
    maybeRevealMainWindow('renderer-and-services-ready');
    return true;
  })();
  return startupPreparationPromise;
}

function showStartupWindow(reason = 'renderer-painted') {
  if (startupShowPromise) return startupShowPromise;
  if (!startupWindow || startupWindow.isDestroyed() || appIsQuitting) return Promise.resolve(false);
  const targetWindow = startupWindow;
  startupShowPromise = (async () => {
    // Force Chromium to commit the fully styled startup card before Windows is
    // allowed to expose this surface. This avoids the raw background frame.
    try {
      const image = await targetWindow.webContents.capturePage();
      if (image.isEmpty()) throw new Error('启动界面捕获结果为空');
    } catch (error) {
      writeAppLog(`启动界面首帧确认失败：${error?.message || error}`);
    }
    if (startupWindow !== targetWindow || targetWindow.isDestroyed() || appIsQuitting) return false;
    if (startupFallbackTimer) {
      clearTimeout(startupFallbackTimer);
      startupFallbackTimer = null;
    }
    try { targetWindow.setOpacity(0); } catch {}
    targetWindow.show();
    await new Promise((resolve) => setTimeout(resolve, 24));
    if (startupWindow !== targetWindow || targetWindow.isDestroyed() || appIsQuitting) return false;
    try { targetWindow.setOpacity(1); } catch {}
    startupWindowShownAt = performance.now();
    writeAppLog(`启动界面完整首帧可见 ${Math.round(performance.now() - STARTUP_STARTED_AT)} ms · ${reason}`);
    sendStartupProgress(20, '正在创建本地翻译工作台…');
    // Give the card entrance time to settle before model, OCR and dictionary
    // loading begin competing for CPU, disk and GPU resources.
    startupPreparationTimer = setTimeout(() => {
      startupPreparationTimer = null;
      void startStartupPreparation();
    }, 720);
    return true;
  })();
  return startupShowPromise;
}

function createStartupWindow(initialExperience, targetBounds) {
  startupProgressValue = 12;
  startupShowPromise = null;
  startupWindow = new BrowserWindow({
    x: targetBounds.x,
    y: targetBounds.y,
    width: targetBounds.width,
    height: targetBounds.height,
    minWidth: 980,
    minHeight: 720,
    show: false,
    opacity: 0,
    titleBarStyle: 'hidden',
    resizable: true,
    movable: true,
    backgroundColor: initialExperience.theme === 'light' ? '#f3f6fc' : '#070b14',
    title: '译澜正在启动',
    webPreferences: {
      preload: path.join(__dirname, 'startup-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      backgroundThrottling: false,
      paintWhenInitiallyHidden: true
    }
  });
  startupWindow.setMenuBarVisibility(false);
  startupWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  startupWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  startupWindow.once('ready-to-show', () => {
    if (startupShowPromise) return;
    // startup:ready is the normal path. This delayed path is only a safety net
    // for an unexpected preload failure and still performs an offscreen paint.
    startupFallbackTimer = setTimeout(() => {
      startupFallbackTimer = null;
      void showStartupWindow('ready-to-show-fallback');
    }, 900);
  });
  startupWindow.on('closed', () => {
    if (startupFallbackTimer) {
      clearTimeout(startupFallbackTimer);
      startupFallbackTimer = null;
    }
    if (startupPreparationTimer) {
      clearTimeout(startupPreparationTimer);
      startupPreparationTimer = null;
    }
    startupWindow = null;
    startupWindowShownAt = 0;
    if (!mainWindowReady && !appIsQuitting) app.quit();
  });
  void startupWindow.loadFile(path.join(__dirname, 'renderer', 'startup.html'), {
    query: {
      theme: initialExperience.theme === 'light' ? 'light' : 'dark',
      accent: ACCENT_IDS.has(initialExperience.accent) ? initialExperience.accent : 'orange'
    }
  }).catch((error) => writeAppLog(`启动界面加载失败: ${error?.stack || error}`));
}

function revealMainWindow(reason = 'renderer-ready') {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindowReady || appIsQuitting) return;
  mainWindowReady = true;
  if (mainWindowRevealTimer) {
    clearTimeout(mainWindowRevealTimer);
    mainWindowRevealTimer = null;
  }
  writeAppLog(`主界面就绪 ${Math.round(performance.now() - STARTUP_STARTED_AT)} ms · ${reason}`);
  const finishSwap = async () => {
    startupSwapTimer = null;
    if (!mainWindow || mainWindow.isDestroyed() || appIsQuitting) return;
    const targetWindow = mainWindow;
    try {
      const image = await targetWindow.webContents.capturePage();
      if (image.isEmpty()) throw new Error('主界面捕获结果为空');
    } catch (error) {
      writeAppLog(`主界面首帧确认失败：${error?.message || error}`);
    }
    if (mainWindow !== targetWindow || targetWindow.isDestroyed() || appIsQuitting) return;
    try { targetWindow.setOpacity(0); } catch {}
    targetWindow.show();
    await new Promise((resolve) => setTimeout(resolve, 24));
    if (mainWindow !== targetWindow || targetWindow.isDestroyed() || appIsQuitting) return;
    try { targetWindow.setOpacity(1); } catch {}
    if (focusMainWindowWhenReady) {
      focusMainWindowWhenReady = false;
      targetWindow.focus();
    }
    if (startupWindow && !startupWindow.isDestroyed()) startupWindow.destroy();
  };
  if (startupWindow && !startupWindow.isDestroyed()) {
    const elapsed = startupWindowShownAt > 0 ? performance.now() - startupWindowShownAt : 0;
    const finishDelay = Math.max(0, 1300 - elapsed);
    startupSwapTimer = setTimeout(() => {
      sendStartupProgress(96, '正在完成最后的界面交接…');
      startupWindow.webContents.send('startup:complete');
      startupSwapTimer = setTimeout(finishSwap, 360);
    }, finishDelay);
  } else {
    finishSwap();
  }
}

function registerDocumentPath(filePath) {
  const DocumentTranslationService = getDocumentTranslationServiceClass();
  const info = DocumentTranslationService.inspect(filePath);
  const token = crypto.randomUUID();
  documentTokens.set(token, { path: info.path, size: info.size, modifiedAt: info.modifiedAt, createdAt: Date.now() });
  return {
    token,
    name: info.name,
    size: info.size,
    extension: info.extension,
    format: info.format,
    directory: path.dirname(info.path)
  };
}

function resolveDocumentToken(token) {
  const entry = documentTokens.get(String(token || ''));
  if (!entry) throw new Error('文档选择已失效，请重新选择文件');
  const DocumentTranslationService = getDocumentTranslationServiceClass();
  const info = DocumentTranslationService.inspect(entry.path);
  if (info.size !== entry.size || info.modifiedAt !== entry.modifiedAt) {
    documentTokens.delete(String(token));
    throw new Error('原文档已经发生变化，请重新选择');
  }
  return info.path;
}

function createWindow() {
  const initialExperience = readExperienceState();
  mainWindowReady = false;
  mainWindowPaintReady = false;
  mainRendererReady = false;
  startupPreparationPromise = null;
  startupPreparationComplete = false;
  focusMainWindowWhenReady = false;
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 720,
    show: false,
    opacity: 0,
    backgroundColor: initialExperience.theme === 'light' ? '#f3f6fc' : '#070b14',
    title: '译澜',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      backgroundThrottling: false,
      paintWhenInitiallyHidden: true
    }
  });
  createStartupWindow(initialExperience, mainWindow.getBounds());
  mainWindow.setMenuBarVisibility(false);
  void mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html')).catch((error) => {
    writeAppLog(`主界面加载失败: ${error?.stack || error}`);
  });
  mainWindow.webContents.once('dom-ready', () => {
    sendStartupProgress(42, '正在装配语言、文档与截图组件…');
  });
  mainWindow.once('ready-to-show', () => {
    mainWindowPaintReady = true;
    sendStartupProgress(52, '主界面已经绘制，正在准备本地能力…');
  });
  // The renderer explicitly announces that its persisted theme and first
  // layout are committed. Keep a long fallback so a renderer regression can
  // never leave the application permanently invisible.
  mainWindowRevealTimer = setTimeout(() => {
    if (mainWindowPaintReady) {
      startupPreparationComplete = true;
      revealMainWindow('fallback-timeout');
    }
    else sendStartupProgress(88, '首次加载需要一点时间，马上就好…');
  }, 10000);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.on('context-menu', (event, params) => {
    if (!params.isEditable) return;
    event.preventDefault();
    const editFlags = params.editFlags || {};
    const textMenu = Menu.buildFromTemplate([
      { label: '撤销', role: 'undo', enabled: Boolean(editFlags.canUndo) },
      { label: '重做', role: 'redo', enabled: Boolean(editFlags.canRedo) },
      { type: 'separator' },
      { label: '剪切', role: 'cut', enabled: Boolean(editFlags.canCut) },
      { label: '复制', role: 'copy', enabled: Boolean(editFlags.canCopy) },
      { label: '粘贴', role: 'paste', enabled: Boolean(editFlags.canPaste) },
      { label: '删除', role: 'delete', enabled: Boolean(editFlags.canDelete) },
      { type: 'separator' },
      { label: '全选', role: 'selectAll', enabled: Boolean(editFlags.canSelectAll) }
    ]);
    textMenu.popup({ window: mainWindow });
  });
  const sendWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-state', { maximized: mainWindow.isMaximized() });
    }
  };
  mainWindow.on('maximize', sendWindowState);
  mainWindow.on('unmaximize', sendWindowState);
  mainWindow.on('closed', () => {
    mainWindow = null;
    mainWindowReady = false;
    mainWindowPaintReady = false;
    mainRendererReady = false;
    if (mainWindowRevealTimer) {
      clearTimeout(mainWindowRevealTimer);
      mainWindowRevealTimer = null;
    }
    // Screenshot overlay windows are pre-created and hidden for speed. They
    // must not keep the process and single-instance lock alive after the user
    // closes the real application window.
    if (!appIsQuitting) app.quit();
  });
}

ipcMain.handle('engine:start', () => ensureEngine());
ipcMain.handle('translate', (_event, payload) => translateText(
  payload.text,
  payload.sourceLanguage,
  payload.targetLanguage
));
ipcMain.handle('selection:translate', (_event, payload = {}) => translateText(
  payload.text,
  payload.sourceLanguage,
  payload.targetLanguage,
  { priority: 95, mode: 'selection' }
));
ipcMain.handle('capture:set-preferences', (_event, payload = {}) => {
  const colorPattern = /^#[0-9a-f]{6}$/i;
  capturePreferences = {
    sourceLanguage: payload.sourceLanguage === 'auto' || LANGUAGE_SPECS[payload.sourceLanguage] ? payload.sourceLanguage : 'auto',
    targetLanguage: LANGUAGE_SPECS[payload.targetLanguage] ? payload.targetLanguage : 'en',
    ocrMode: ['smart', 'compatible', 'specified'].includes(payload.ocrMode) ? payload.ocrMode : 'smart',
    theme: payload.theme === 'light' ? 'light' : 'dark',
    accentA: colorPattern.test(payload.accentA) ? payload.accentA : '#ffad55',
    accentB: colorPattern.test(payload.accentB) ? payload.accentB : '#ef6556'
  };
  return { ...capturePreferences, shortcutRegistered: captureShortcutRegistered };
});
ipcMain.handle('capture:start', (_event, payload = {}) => {
  capturePreferences = { ...capturePreferences, ...payload };
  return getCaptureService().start(capturePreferences);
});
ipcMain.handle('capture:image', (_event, payload = {}) => {
  capturePreferences = { ...capturePreferences, ...(payload.preferences || {}) };
  return getCaptureService().importImage(payload, capturePreferences);
});
ipcMain.handle('capture:complete', (event, payload) => getCaptureService().complete(event, payload));
ipcMain.handle('capture:cancel', (event, payload) => getCaptureService().cancel(event, payload));
ipcMain.handle('document:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择需要翻译的文档',
    properties: ['openFile'],
    filters: [
      { name: '支持的文档', extensions: ['txt', 'md', 'markdown', 'docx', 'pptx', 'xlsx', 'pdf'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return registerDocumentPath(result.filePaths[0]);
});
ipcMain.handle('document:register-path', (_event, filePath) => registerDocumentPath(filePath));
ipcMain.handle('document:read', (_event, token) => {
  const filePath = resolveDocumentToken(token);
  const DocumentTranslationService = getDocumentTranslationServiceClass();
  const info = DocumentTranslationService.inspect(filePath);
  if (info.size > 96 * 1024 * 1024) throw new Error('文档过大，阅览器暂时支持 96 MB 以内的文件');
  return {
    name: info.name,
    extension: info.extension,
    format: info.format,
    data: new Uint8Array(fs.readFileSync(filePath))
  };
});
ipcMain.handle('document:start', (_event, payload) => getDocumentService().start(
  resolveDocumentToken(payload.token),
  {
    sourceLanguage: payload.sourceLanguage === 'auto' || LANGUAGE_SPECS[payload.sourceLanguage] ? payload.sourceLanguage : 'auto',
    targetLanguage: LANGUAGE_SPECS[payload.targetLanguage] ? payload.targetLanguage : 'en',
    scannedPdf: Boolean(payload.scannedPdf)
  }
));
ipcMain.handle('document:pause', (_event, id) => documentService?.pause(id) ?? false);
ipcMain.handle('document:resume', (_event, id) => documentService?.resume(id) ?? false);
ipcMain.handle('document:cancel', (_event, id) => documentService?.cancel(id) ?? false);
ipcMain.handle('document:open-output', async (_event, outputPath) => {
  const absolute = path.resolve(String(outputPath || ''));
  if (!fs.existsSync(absolute)) throw new Error('译文文件不存在');
  const error = await shell.openPath(absolute);
  if (error) throw new Error(error);
  return true;
});
ipcMain.handle('document:show-output', (_event, outputPath) => {
  const absolute = path.resolve(String(outputPath || ''));
  if (!fs.existsSync(absolute)) throw new Error('译文文件不存在');
  shell.showItemInFolder(absolute);
  return true;
});
ipcMain.handle('dictionary:lookup', (_event, word) => lookupWord(word));
ipcMain.handle('dictionary:word-at', (_event, payload) => wordAt(payload.text, payload.offset));
ipcMain.handle('dictionary:tokenize', (_event, text) => tokenizeText(text));
ipcMain.handle('app:info', async () => ({
  installRoot: INSTALL_ROOT,
  model: 'Tencent Hy-MT2-1.8B Q6_K',
  ocr: {
    available: ocrWorker?.available ?? fs.existsSync(path.join(OCR_ROOT, 'RapidOCR-json.exe')),
    shortcut: 'Alt+Q',
    shortcutRegistered: captureShortcutRegistered
  },
  engineBackend: activeBackend?.id || 'on-demand',
  supportedBackends: BACKENDS.filter((backend) => fs.existsSync(path.join(backend.directory, 'llama-server.exe'))).map((backend) => backend.id),
  hardwareProfile: activeBackend?.id === 'cpu'
    ? { id: 'cpu', label: 'CPU' }
    : activeBackend
      ? await detectHardwareProfile()
      : { id: 'deferred', label: '离线引擎按需启动' },
  hardwareAcceleration: app.isHardwareAccelerationEnabled(),
  gpuFeatures: app.getGPUFeatureStatus(),
  versions: process.versions
}));
ipcMain.handle('app:set-theme', (_event, theme) => {
  void theme;
  return true;
});
ipcMain.on('app:experience-load', (event) => {
  event.returnValue = readExperienceState();
});
ipcMain.handle('app:experience-save', (_event, patch) => writeExperienceState(patch));
ipcMain.handle('app:set-accent', (_event, accent) => updateShortcutIcons(accent));
ipcMain.on('startup:ready', (event) => {
  if (!startupWindow || startupWindow.isDestroyed() || event.sender !== startupWindow.webContents || appIsQuitting) return;
  writeAppLog(`启动界面渲染器确认完成 ${Math.round(performance.now() - STARTUP_STARTED_AT)} ms`);
  void showStartupWindow('startup-rendered');
});
ipcMain.on('renderer:ready', (event) => {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) return;
  mainRendererReady = true;
  sendStartupProgress(56, '主界面已就绪，正在完成本地资源加载…');
  maybeRevealMainWindow('renderer-and-services-ready');
});
ipcMain.handle('window:control', (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { maximized: false };
  if (action === 'minimize') window.minimize();
  if (action === 'maximize') {
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  }
  if (action === 'close') {
    if (window === mainWindow) app.quit();
    else window.close();
  }
  return { maximized: !window.isDestroyed() && window.isMaximized() };
});
ipcMain.handle('app:open-log', () => shell.showItemInFolder(LOG_PATH));

if (hasSingleInstanceLock) {
  app.whenReady()
    .then(() => {
      writeAppLog(`启动 v${app.getVersion()} · ${process.execPath}`);
      createWindow();
      registerCaptureShortcut();
    })
    .catch((error) => {
      writeAppLog(`启动失败: ${error?.stack || error}`);
      app.quit();
    });
}

app.on('second-instance', () => {
  if (appIsQuitting) return;
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    focusMainWindowWhenReady = true;
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindowReady) {
    focusMainWindowWhenReady = true;
    if (startupWindow && !startupWindow.isDestroyed()) {
      if (startupWindow.isMinimized()) startupWindow.restore();
      if (!startupWindow.isVisible()) void showStartupWindow('second-instance');
      else startupWindow.focus();
    }
    return;
  }
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
});

app.on('window-all-closed', () => app.quit());

app.on('before-quit', () => {
  appIsQuitting = true;
  if (mainWindowRevealTimer) {
    clearTimeout(mainWindowRevealTimer);
    mainWindowRevealTimer = null;
  }
  if (startupSwapTimer) {
    clearTimeout(startupSwapTimer);
    startupSwapTimer = null;
  }
  if (startupFallbackTimer) {
    clearTimeout(startupFallbackTimer);
    startupFallbackTimer = null;
  }
  if (startupPreparationTimer) {
    clearTimeout(startupPreparationTimer);
    startupPreparationTimer = null;
  }
  globalShortcut.unregisterAll();
  captureService?.dispose();
  documentService?.dispose();
  ocrWorker?.stop();
  if (dictionary) {
    try { dictionary.close(); } catch {}
    dictionary = null;
  }
  if (serverProcess && serverProcess.exitCode === null) {
    try { serverProcess.kill(); } catch {}
  }
  if (serverLog) {
    try { serverLog.end(); } catch {}
  }
});
