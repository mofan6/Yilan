'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { BrowserWindow, desktopCapturer, nativeImage, screen } = require('electron');

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

class CaptureTranslationService {
  constructor(options) {
    this.app = options.app;
    this.preloadPath = options.preloadPath;
    this.htmlPath = options.htmlPath;
    this.getMainWindow = options.getMainWindow;
    this.ocr = options.ocr;
    this.translate = options.translate;
    this.log = options.log || (() => {});
    this.active = null;
    this.overlayPool = new Map();
    this.warmupPromise = null;
  }

  createOverlay(display) {
    const displayId = String(display.id);
    const overlay = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: false,
      backgroundColor: '#05070b',
      show: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: false,
      webPreferences: {
        preload: this.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        spellcheck: false,
        backgroundThrottling: false
      }
    });
    const entry = { displayId, display, overlay, readyPromise: null };
    entry.readyPromise = new Promise((resolve, reject) => {
      overlay.webContents.once('did-finish-load', () => resolve(entry));
      overlay.webContents.once('did-fail-load', (_event, code, description) => {
        reject(new Error(`截图窗口预载失败（${code}: ${description}）`));
      });
    });
    this.overlayPool.set(displayId, entry);
    overlay.setAlwaysOnTop(true, 'screen-saver');
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    overlay.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    overlay.webContents.on('will-navigate', (event) => event.preventDefault());
    overlay.once('closed', () => {
      if (this.overlayPool.get(displayId) === entry) this.overlayPool.delete(displayId);
    });
    void overlay.loadFile(this.htmlPath).catch((error) => {
      this.log(`截图窗口预载失败: ${error?.stack || error}`);
    });
    return entry;
  }

  async ensureOverlays(displays = screen.getAllDisplays()) {
    const activeIds = new Set(displays.map((display) => String(display.id)));
    for (const [displayId, entry] of this.overlayPool) {
      if (activeIds.has(displayId)) continue;
      this.overlayPool.delete(displayId);
      if (!entry.overlay.isDestroyed()) entry.overlay.destroy();
    }
    const entries = displays.map((display) => {
      const displayId = String(display.id);
      let entry = this.overlayPool.get(displayId);
      if (!entry || entry.overlay.isDestroyed()) entry = this.createOverlay(display);
      entry.display = display;
      entry.overlay.setBounds(display.bounds, false);
      return entry;
    });
    await Promise.all(entries.map((entry) => entry.readyPromise));
    return entries;
  }

  warmup() {
    if (!this.warmupPromise) {
      this.warmupPromise = this.ensureOverlays().catch((error) => {
        this.log(`截图窗口预热失败: ${error?.stack || error}`);
      }).finally(() => {
        this.warmupPromise = null;
      });
    }
    return this.warmupPromise;
  }

  async start(preferences = {}) {
    if (this.active) throw new Error('已有截图任务正在进行');
    const mainWindow = this.getMainWindow();
    const session = {
      id: crypto.randomUUID(),
      preferences: {
        sourceLanguage: preferences.sourceLanguage || 'auto',
        targetLanguage: preferences.targetLanguage || 'en',
        ocrMode: ['smart', 'compatible', 'specified'].includes(preferences.ocrMode) ? preferences.ocrMode : 'smart',
        theme: preferences.theme === 'light' ? 'light' : 'dark',
        accentA: preferences.accentA || '#ffad55',
        accentB: preferences.accentB || '#ef6556'
      },
      overlays: [],
      displayImages: new Map(),
      controller: new AbortController(),
      mainWindow
    };
    this.active = session;

    try {
      const displays = screen.getAllDisplays();
      const overlayEntries = await this.ensureOverlays(displays);
      session.overlays = overlayEntries.map((entry) => entry.overlay);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
      await delay(48);
      const maximumPhysicalWidth = Math.max(...displays.map((display) => Math.ceil(display.bounds.width * display.scaleFactor)));
      const maximumPhysicalHeight = Math.max(...displays.map((display) => Math.ceil(display.bounds.height * display.scaleFactor)));
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: maximumPhysicalWidth, height: maximumPhysicalHeight },
        fetchWindowIcons: false
      });
      if (sources.length === 0) throw new Error('系统没有返回可捕获的屏幕');

      for (const [index, display] of displays.entries()) {
        const source = sources.find((item) => String(item.display_id) === String(display.id)) || sources[index] || sources[0];
        const image = source.thumbnail;
        session.displayImages.set(String(display.id), { image, display });
        const overlay = overlayEntries[index].overlay;
        overlay.webContents.send('capture-overlay:init', {
          sessionId: session.id,
          displayId: String(display.id),
          width: display.bounds.width,
          height: display.bounds.height,
          imageDataUrl: image.toDataURL(),
          ...session.preferences
        });
        overlay.showInactive();
      }

      const cursor = screen.getCursorScreenPoint();
      const activeDisplay = screen.getDisplayNearestPoint(cursor);
      const activeIndex = displays.findIndex((display) => String(display.id) === String(activeDisplay.id));
      const focusWindow = session.overlays[Math.max(0, activeIndex)];
      if (focusWindow && !focusWindow.isDestroyed()) focusWindow.focus();
      return { sessionId: session.id, shortcut: 'Alt+Q' };
    } catch (error) {
      this.closeOverlays(session);
      this.restoreMainWindow(session);
      this.active = null;
      throw error;
    }
  }

  async complete(event, payload) {
    const session = this.active;
    if (!session || payload?.sessionId !== session.id) throw new Error('截图会话已经结束');
    const overlay = BrowserWindow.fromWebContents(event.sender);
    if (!overlay || !session.overlays.includes(overlay)) throw new Error('无效的截图窗口');
    const entry = session.displayImages.get(String(payload.displayId));
    if (!entry) throw new Error('找不到所选屏幕');
    const rect = payload.rect || {};
    const cssWidth = Math.max(1, Number(payload.viewportWidth || entry.display.bounds.width));
    const cssHeight = Math.max(1, Number(payload.viewportHeight || entry.display.bounds.height));
    const imageSize = entry.image.getSize();
    const crop = {
      x: Math.max(0, Math.round(Number(rect.x || 0) * imageSize.width / cssWidth)),
      y: Math.max(0, Math.round(Number(rect.y || 0) * imageSize.height / cssHeight)),
      width: Math.max(1, Math.round(Number(rect.width || 0) * imageSize.width / cssWidth)),
      height: Math.max(1, Math.round(Number(rect.height || 0) * imageSize.height / cssHeight))
    };
    crop.width = Math.min(crop.width, imageSize.width - crop.x);
    crop.height = Math.min(crop.height, imageSize.height - crop.y);
    if (crop.width < 8 || crop.height < 8) throw new Error('选区太小，请重新框选');

    const cropped = entry.image.crop(crop);
    this.closeOverlays(session);
    this.restoreMainWindow(session);
    return this.processImage(session, cropped, '选区已截取，正在准备本地识别…');
  }

  async importImage(payload = {}, preferences = {}) {
    if (this.active) throw new Error('已有截图或图片识别任务正在进行');
    const session = {
      id: crypto.randomUUID(),
      preferences: {
        sourceLanguage: preferences.sourceLanguage || 'auto',
        targetLanguage: preferences.targetLanguage || 'en',
        ocrMode: ['smart', 'compatible', 'specified'].includes(preferences.ocrMode) ? preferences.ocrMode : 'smart',
        theme: preferences.theme === 'light' ? 'light' : 'dark',
        accentA: preferences.accentA || '#ffad55',
        accentB: preferences.accentB || '#ef6556'
      },
      overlays: [],
      displayImages: new Map(),
      controller: new AbortController(),
      mainWindow: this.getMainWindow()
    };
    this.active = session;

    try {
      let image = null;
      if (payload.filePath) {
        const imagePath = path.resolve(String(payload.filePath));
        if (!fs.existsSync(imagePath)) throw new Error('找不到所选图片，请重新添加');
        image = nativeImage.createFromPath(imagePath);
      } else if (payload.bytes) {
        const bytes = payload.bytes instanceof ArrayBuffer
          ? Buffer.from(payload.bytes)
          : Buffer.from(payload.bytes);
        image = nativeImage.createFromBuffer(bytes);
      } else if (payload.imageDataUrl) {
        image = nativeImage.createFromDataURL(String(payload.imageDataUrl));
      }
      if (!image || image.isEmpty()) throw new Error('图片格式无法读取，请选择 PNG、JPG、WEBP 或 BMP 图片');
      const size = image.getSize();
      if (size.width < 8 || size.height < 8) throw new Error('图片尺寸太小，无法进行文字识别');
      return await this.processImage(session, image, '图片已载入，正在准备本地识别…');
    } catch (error) {
      this.log(`图片翻译失败: ${error?.stack || error}`);
      this.sendMain('capture:error', { message: error?.message || String(error) });
      if (this.active === session) this.active = null;
      return { ok: false, error: error?.message || String(error) };
    }
  }

  async processImage(session, cropped, preparingDetail) {
    const previewSize = cropped.getSize();
    const preview = previewSize.width > 720
      ? cropped.resize({ width: 720, quality: 'good' })
      : cropped;
    this.sendMain('capture:status', {
      status: 'preparing',
      progress: 7,
      detail: preparingDetail || '正在准备本地识别…'
    });

    const cacheDirectory = path.join(this.app.getPath('userData'), 'cache', 'ocr');
    fs.mkdirSync(cacheDirectory, { recursive: true });
    const temporaryImage = path.join(cacheDirectory, `${session.id}.png`);
    fs.writeFileSync(temporaryImage, cropped.toPNG());

    try {
      this.sendMain('capture:status', {
        status: 'recognizing',
        progress: 13,
        detail: '正在分析画面中的文字与语种…'
      });
      const ocrResult = await this.ocr.recognize(
        temporaryImage,
        session.preferences.sourceLanguage,
        session.controller.signal,
        {
          mode: session.preferences.ocrMode,
          onProgress: ({ progress, detail }) => {
            if (this.active !== session) return;
            this.sendMain('capture:status', {
              status: 'recognizing',
              progress: Math.round(13 + Math.max(0, Math.min(1, Number(progress) || 0)) * 55),
              detail: detail || '正在识别选区文字…'
            });
          }
        }
      );
      this.sendMain('capture:status', {
        status: 'translating',
        progress: 72,
        detail: `已识别 ${ocrResult.blocks.length} 个文本块，正在调用本地模型…`
      });
      const translationSourceLanguage = session.preferences.sourceLanguage === 'auto'
        ? (ocrResult.detectedLanguage || 'auto')
        : session.preferences.sourceLanguage;
      const translation = await this.translate(
        ocrResult.text,
        translationSourceLanguage,
        session.preferences.targetLanguage,
        {
          priority: 90,
          signal: session.controller.signal,
          mode: 'ocr',
          onProgress: ({ progress, detail }) => {
            if (this.active !== session) return;
            this.sendMain('capture:status', {
              status: 'translating',
              progress: Math.round(72 + Math.max(0, Math.min(1, Number(progress) || 0)) * 25),
              detail: detail || '正在生成离线译文…'
            });
          }
        }
      );
      this.sendMain('capture:status', {
        status: 'translating',
        progress: 98,
        detail: '翻译完成，正在整理结果…'
      });
      this.sendMain('capture:result', {
        id: session.id,
        imageDataUrl: preview.toDataURL(),
        imageWidth: previewSize.width,
        imageHeight: previewSize.height,
        sourceText: ocrResult.text,
        translatedText: translation.text,
        blocks: ocrResult.blocks,
        sourceLanguage: translation.detectedSourceLanguage || translation.sourceLanguage,
        targetLanguage: translation.targetLanguage,
        ocrModel: ocrResult.modelLabel,
        ocrElapsedMs: ocrResult.elapsedMs,
        translationElapsedMs: translation.elapsedMs
      });
      return { ok: true };
    } catch (error) {
      this.log(`截图翻译失败: ${error?.stack || error}`);
      this.sendMain('capture:error', { message: error?.message || String(error) });
      return { ok: false, error: error?.message || String(error) };
    } finally {
      try { fs.unlinkSync(temporaryImage); } catch {}
      if (this.active === session) this.active = null;
    }
  }

  cancel(event, payload = {}) {
    const session = this.active;
    if (!session || (payload.sessionId && payload.sessionId !== session.id)) return { ok: true };
    const overlay = BrowserWindow.fromWebContents(event.sender);
    if (overlay && !session.overlays.includes(overlay)) return { ok: false };
    session.controller.abort(new Error('截图已取消'));
    this.closeOverlays(session);
    this.restoreMainWindow(session);
    this.sendMain('capture:status', { status: 'cancelled', detail: '已取消截图' });
    this.active = null;
    return { ok: true };
  }

  closeOverlays(session) {
    for (const window of session.overlays.splice(0)) {
      if (!window.isDestroyed()) window.hide();
    }
  }

  restoreMainWindow(session) {
    const window = session.mainWindow || this.getMainWindow();
    if (!window || window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  }

  sendMain(channel, payload) {
    const window = this.getMainWindow();
    if (window && !window.isDestroyed()) window.webContents.send(channel, payload);
  }

  dispose() {
    const session = this.active;
    if (session) {
      session.controller.abort(new Error('应用正在退出'));
      this.closeOverlays(session);
      this.active = null;
    }
    for (const entry of this.overlayPool.values()) {
      if (!entry.overlay.isDestroyed()) entry.overlay.destroy();
    }
    this.overlayPool.clear();
  }
}

module.exports = { CaptureTranslationService };
