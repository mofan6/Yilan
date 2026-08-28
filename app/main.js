const { app, BrowserWindow, ipcMain, shell, nativeImage } = require('electron');
const { spawn } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

app.setName('译澜');

const DEV_ROOT = path.resolve(__dirname, '..', 'base-unpacked', 'resources');
const BUNDLED_ROOT = process.resourcesPath;
const INSTALL_ROOT = app.isPackaged && fs.existsSync(path.join(BUNDLED_ROOT, 'models')) ? BUNDLED_ROOT : DEV_ROOT;
const MODEL_PATH = path.join(INSTALL_ROOT, 'models', 'HY-MT1.5-1.8B-Q4_K_M.gguf');
const DATABASE_PATH = path.join(INSTALL_ROOT, 'data', 'dictionary.sqlite3');
const LOG_PATH = path.join(app.getPath('userData'), 'logs', 'yilan-engine.log');
const APP_LOG_PATH = path.join(app.getPath('userData'), 'logs', 'yilan-app.log');
const SERVER_URL = 'http://127.0.0.1:18081';
const API_KEY = 'offline-translator-local-only';
const MAX_INPUT_CHARS = 3000;

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('force-color-profile', 'srgb');

let mainWindow = null;
let dictionary = null;
let lookupStatement = null;
let maxChineseWordLength = 12;
let serverProcess = null;
let serverLog = null;
let enginePromise = null;
let engineReady = false;
let activeBackend = null;
let hardwareProfilePromise = null;

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
  const selected = ACCENT_IDS.has(accent) ? accent : 'aurora';
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
        description: '译澜 · 离线中英翻译',
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
  dictionary = new DatabaseSync(DATABASE_PATH, { readOnly: true });
  lookupStatement = dictionary.prepare(
    'SELECT word, lang, definition FROM entries WHERE word = ? LIMIT 1'
  );
  const row = dictionary
    .prepare("SELECT value FROM meta WHERE key = 'max_zh_len'")
    .get();
  if (row) maxChineseWordLength = Math.min(Number(row.value) || 12, 16);
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

function detectDirection(text, mode) {
  if (mode === 'zh-en' || mode === 'en-zh') return mode;
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(text) ? 'zh-en' : 'en-zh';
}

async function translateText(text, mode) {
  const source = String(text || '').trim();
  if (!source) throw new Error('请输入需要翻译的句子');
  if (source.length > MAX_INPUT_CHARS) {
    throw new Error(`单次最多翻译 ${MAX_INPUT_CHARS} 个字符，请分段翻译`);
  }
  await ensureEngine();
  const direction = detectDirection(source, mode);
  const target = direction === 'zh-en' ? '英语' : '中文';
  const prompt = `将以下文本翻译为${target}，注意只需要输出翻译后的结果，不要额外解释：\n\n${source}`;
  const started = performance.now();
  const response = await fetch(`${SERVER_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.2,
      top_k: 20,
      top_p: 0.6,
      repeat_penalty: 1.05,
      stream: false
    }),
    signal: AbortSignal.timeout(180000)
  });
  if (!response.ok) throw new Error(`翻译引擎返回 HTTP ${response.status}`);
  const result = await response.json();
  const translated = result?.choices?.[0]?.message?.content?.trim();
  if (!translated) throw new Error('模型返回了空结果');
  return {
    text: translated,
    direction,
    elapsedMs: Math.round(performance.now() - started)
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 720,
    show: false,
    backgroundColor: '#080d1a',
    title: '译澜',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      backgroundThrottling: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    setTimeout(() => ensureEngine().catch(() => {}), 450);
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  const sendWindowState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-state', { maximized: mainWindow.isMaximized() });
    }
  };
  mainWindow.on('maximize', sendWindowState);
  mainWindow.on('unmaximize', sendWindowState);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('engine:start', () => ensureEngine());
ipcMain.handle('translate', (_event, payload) => translateText(payload.text, payload.mode));
ipcMain.handle('dictionary:lookup', (_event, word) => lookupWord(word));
ipcMain.handle('dictionary:word-at', (_event, payload) => wordAt(payload.text, payload.offset));
ipcMain.handle('dictionary:tokenize', (_event, text) => tokenizeText(text));
ipcMain.handle('app:info', async () => ({
  installRoot: INSTALL_ROOT,
  model: 'Tencent HY-MT1.5-1.8B Q4_K_M',
  engineBackend: activeBackend?.id || 'on-demand',
  supportedBackends: BACKENDS.filter((backend) => fs.existsSync(path.join(backend.directory, 'llama-server.exe'))).map((backend) => backend.id),
  hardwareProfile: activeBackend?.id === 'cpu' ? { id: 'cpu', label: 'CPU' } : await detectHardwareProfile(),
  hardwareAcceleration: app.isHardwareAccelerationEnabled(),
  gpuFeatures: app.getGPUFeatureStatus(),
  versions: process.versions
}));
ipcMain.handle('app:set-theme', (_event, theme) => {
  void theme;
  return true;
});
ipcMain.handle('app:set-accent', (_event, accent) => updateShortcutIcons(accent));
ipcMain.handle('window:control', (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return { maximized: false };
  if (action === 'minimize') window.minimize();
  if (action === 'maximize') {
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  }
  if (action === 'close') window.close();
  return { maximized: !window.isDestroyed() && window.isMaximized() };
});
ipcMain.handle('app:open-log', () => shell.showItemInFolder(LOG_PATH));

app.whenReady()
  .then(() => {
    writeAppLog(`启动 v${app.getVersion()} · ${process.execPath}`);
    openDictionary();
    createWindow();
  })
  .catch((error) => {
    writeAppLog(`启动失败: ${error?.stack || error}`);
    app.quit();
  });

app.on('window-all-closed', () => app.quit());

app.on('before-quit', () => {
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
