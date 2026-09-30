const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const qaDirectory = path.join(projectRoot, 'qa');
app.setPath('userData', path.join(qaDirectory, 'electron-profile'));

ipcMain.handle('app:set-theme', () => true);
ipcMain.handle('app:set-accent', () => ({ updated: 0 }));
ipcMain.handle('window:control', () => ({ maximized: false }));
ipcMain.handle('app:open-log', () => true);
ipcMain.handle('app:info', () => ({
  hardwareAcceleration: true,
  gpuFeatures: { gpu_compositing: 'enabled' },
  hardwareProfile: { id: 'discrete', label: '独显' }
}));

async function capture() {
  fs.mkdirSync(qaDirectory, { recursive: true });
  const window = new BrowserWindow({
    width: 1240,
    height: 820,
    show: false,
    backgroundColor: '#080d1a',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(projectRoot, 'app', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  window.webContents.on('console-message', (_event, details) => {
    process.stdout.write(`[renderer:${details.level}] ${details.message}\n`);
  });
  await window.loadFile(path.join(projectRoot, 'app', 'renderer', 'index.html'));
  await window.webContents.executeJavaScript(`
    localStorage.setItem('yilan-onboarding-v1', 'complete');
    localStorage.setItem('yilan-theme', 'dark');
    localStorage.setItem('yilan-accent', 'jade');
    location.reload();
  `);
  await new Promise((resolve) => window.webContents.once('did-finish-load', resolve));
  window.showInactive();
  await new Promise((resolve) => setTimeout(resolve, 900));
  const mainImage = await window.webContents.capturePage();
  fs.writeFileSync(path.join(qaDirectory, 'main-multilingual-v1.8.0.png'), mainImage.toPNG());
  const openingState = await window.webContents.executeJavaScript(`(() => {
    document.getElementById('sourceLanguageButton').click();
    const picker = document.getElementById('languagePicker');
    const backdrop = document.getElementById('languagePickerBackdrop');
    const panel = picker.querySelector('.language-picker-panel');
    return JSON.stringify({
      picker: picker.className,
      backdropOpacity: getComputedStyle(backdrop).opacity,
      backdropFilter: getComputedStyle(backdrop).backdropFilter,
      panelOpacity: getComputedStyle(panel).opacity
    });
  })()`);
  process.stdout.write(`opening=${openingState}\n`);
  const openingImage = await window.webContents.capturePage();
  fs.writeFileSync(path.join(qaDirectory, 'language-picker-opening-v1.8.0.png'), openingImage.toPNG());
  await new Promise((resolve) => setTimeout(resolve, 520));
  const state = await window.webContents.executeJavaScript(`JSON.stringify({
    body: document.body.className,
    picker: document.getElementById('languagePicker').className,
    toolbarOpacity: getComputedStyle(document.getElementById('toolbarPanel')).opacity,
    errorMarker: document.getElementById('sourceLanguageLabel').textContent,
    languageCount: new Set([...document.querySelectorAll('.language-choice[data-language]')]
      .map((element) => element.dataset.language)
      .filter((code) => code !== 'auto')).size,
    missingFlagCount: [...document.querySelectorAll('.language-choice[data-language]')]
      .filter((element) => element.dataset.language !== 'auto' && !element.querySelector('.language-option-code img')).length,
    traditionalChineseFlag: document.querySelector('.language-choice[data-language="zh-Hant"] .language-option-code img')?.getAttribute('src')
  })`);
  process.stdout.write(`${state}\n`);
  const image = await window.webContents.capturePage();
  fs.writeFileSync(path.join(qaDirectory, 'language-picker-v1.8.0.png'), image.toPNG());
  window.destroy();
}

app.whenReady()
  .then(capture)
  .then(() => app.quit())
  .catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    app.exit(1);
  });
