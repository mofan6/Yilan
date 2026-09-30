'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { createWorker, OEM, PSM } = require('tesseract.js');

const SCRIPT_ROUTES = Object.freeze({
  arabic: { engine: 'rapid', group: 'arabic' },
  bengali: { engine: 'tesseract', group: 'bengali', language: 'bn' },
  cyrillic: { engine: 'rapid', group: 'cyrillic' },
  devanagari: { engine: 'tesseract', group: 'devanagari' },
  gujarati: { engine: 'tesseract', group: 'gujarati', language: 'guj' },
  han: { engine: 'rapid', group: 'common' },
  hangul: { engine: 'tesseract', group: 'korean', language: 'kor' },
  hebrew: { engine: 'tesseract', group: 'hebrew', language: 'he' },
  japanese: { engine: 'rapid', group: 'japanese', language: 'ja' },
  katakana: { engine: 'rapid', group: 'japanese', language: 'ja' },
  khmer: { engine: 'tesseract', group: 'khmer', language: 'khm' },
  latin: { engine: 'rapid', group: 'latin' },
  myanmar: { engine: 'tesseract', group: 'myanmar', language: 'mya' },
  tamil: { engine: 'rapid', group: 'tamil' },
  telugu: { engine: 'rapid', group: 'telugu' },
  thai: { engine: 'rapid', group: 'thai' },
  tibetan: { engine: 'tesseract', group: 'tibetan', language: 'bo' }
});

function normalizeScriptName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^a-z]+/gi, '')
    .toLowerCase();
}

function routeForScript(value) {
  const normalized = normalizeScriptName(value);
  if (!normalized) return null;
  if (SCRIPT_ROUTES[normalized]) return { ...SCRIPT_ROUTES[normalized] };
  const partial = Object.keys(SCRIPT_ROUTES).find((script) => normalized.includes(script));
  return partial ? { ...SCRIPT_ROUTES[partial] } : null;
}

function sourceCoordinate(value, scale, border, maximum) {
  return Math.max(0, Math.min(maximum, (Number(value || 0) - border) / scale));
}

function boxFromBounds(bounds = {}, transform = null) {
  const scale = Number(transform?.scale || 1);
  const border = Number(transform?.border || 0);
  const maximumWidth = Number(transform?.width || Number.MAX_SAFE_INTEGER);
  const maximumHeight = Number(transform?.height || Number.MAX_SAFE_INTEGER);
  const left = sourceCoordinate(bounds.x0, scale, border, maximumWidth);
  const top = sourceCoordinate(bounds.y0, scale, border, maximumHeight);
  const right = Math.max(left + 1, sourceCoordinate(bounds.x1, scale, border, maximumWidth));
  const bottom = Math.max(top + 1, sourceCoordinate(bounds.y1, scale, border, maximumHeight));
  return [[left, top], [right, top], [right, bottom], [left, bottom]];
}

function linesFromBlocks(blocks, transform = null) {
  const lines = [];
  for (const block of Array.isArray(blocks) ? blocks : []) {
    for (const paragraph of Array.isArray(block?.paragraphs) ? block.paragraphs : []) {
      for (const line of Array.isArray(paragraph?.lines) ? paragraph.lines : []) {
        const text = String(line?.text || '').trim();
        if (!text) continue;
        lines.push({
          text,
          score: Math.max(0, Math.min(1, Number(line.confidence || 0) / 100)),
          box: boxFromBounds(line.bbox, transform)
        });
      }
    }
  }
  return lines;
}

function averageEdgeLuminance(data, width, height) {
  let total = 0;
  let samples = 0;
  const stepX = Math.max(1, Math.floor(width / 80));
  const stepY = Math.max(1, Math.floor(height / 80));
  const sample = (x, y) => {
    const offset = (y * width + x) * 4;
    total += data[offset] * .2126 + data[offset + 1] * .7152 + data[offset + 2] * .0722;
    samples += 1;
  };
  for (let x = 0; x < width; x += stepX) {
    sample(x, 0);
    if (height > 1) sample(x, height - 1);
  }
  for (let y = stepY; y < height - 1; y += stepY) {
    sample(0, y);
    if (width > 1) sample(width - 1, y);
  }
  return samples > 0 ? total / samples : 255;
}

async function prepareImageForRecognition(imagePath) {
  const image = await loadImage(path.resolve(imagePath));
  const width = Math.max(1, Number(image.width || 1));
  const height = Math.max(1, Number(image.height || 1));
  const scale = Math.max(1, Math.min(2, 2400 / width, 1600 / height));
  const scaledWidth = Math.max(1, Math.round(width * scale));
  const scaledHeight = Math.max(1, Math.round(height * scale));
  const border = Math.max(14, Math.round(18 * scale));
  const canvas = createCanvas(scaledWidth + border * 2, scaledHeight + border * 2);
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, border, border, scaledWidth, scaledHeight);

  const pixels = context.getImageData(border, border, scaledWidth, scaledHeight);
  const darkBackground = averageEdgeLuminance(pixels.data, scaledWidth, scaledHeight) < 118;
  for (let index = 0; index < pixels.data.length; index += 4) {
    let gray = pixels.data[index] * .2126 + pixels.data[index + 1] * .7152 + pixels.data[index + 2] * .0722;
    if (darkBackground) gray = 255 - gray;
    gray = Math.max(0, Math.min(255, (gray - 128) * 1.14 + 128));
    pixels.data[index] = gray;
    pixels.data[index + 1] = gray;
    pixels.data[index + 2] = gray;
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, border, border);
  const temporaryPath = path.join(os.tmpdir(), `yilan-ocr-enhanced-${randomUUID()}.png`);
  await fs.promises.writeFile(temporaryPath, canvas.toBuffer('image/png'));
  return {
    path: temporaryPath,
    scale,
    border,
    width,
    height,
    cleanup: () => fs.promises.unlink(temporaryPath).catch(() => {})
  };
}

function pageSegmentationForImage(transform) {
  const width = Number(transform?.width || 0);
  const height = Number(transform?.height || 0);
  if (height > 0 && height <= 190 && width / height >= 3.2) return PSM.SINGLE_LINE;
  if (height > 0 && height <= 720) return PSM.SINGLE_BLOCK;
  return PSM.SPARSE_TEXT;
}

class TesseractWorkerManager {
  constructor(tessdataRoot, log = () => {}) {
    this.tessdataRoot = tessdataRoot;
    this.log = log;
    this.osdWorker = null;
    this.osdPromise = null;
    this.recognitionWorker = null;
    this.recognitionPromise = null;
    this.loadedRecognitionLanguages = new Set();
    this.activeRecognitionLanguages = '';
    this.serial = Promise.resolve();
    this.currentProgress = null;
  }

  get available() {
    return fs.existsSync(path.join(this.tessdataRoot, 'osd.traineddata'));
  }

  supports(pack) {
    return Boolean(pack && String(pack).split('+').every((language) => (
      fs.existsSync(path.join(this.tessdataRoot, `${language}.traineddata`))
    )));
  }

  workerOptions(logger = null, legacy = false) {
    return {
      langPath: this.tessdataRoot,
      cacheMethod: 'none',
      gzip: false,
      legacyCore: legacy,
      legacyLang: legacy,
      logger: typeof logger === 'function' ? logger : () => {}
    };
  }

  async ensureOsdWorker() {
    if (!this.available) throw new Error('文字体系检测组件缺失');
    if (this.osdWorker) return this.osdWorker;
    if (!this.osdPromise) {
      this.osdPromise = createWorker(
        'osd',
        OEM.TESSERACT_ONLY,
        this.workerOptions(null, true)
      ).then(async (worker) => {
        await worker.setParameters({
          min_characters_to_try: '8',
          user_defined_dpi: '160'
        });
        this.osdWorker = worker;
        return worker;
      }).catch((error) => {
        this.osdPromise = null;
        throw error;
      });
    }
    return this.osdPromise;
  }

  async warmupOsd() {
    if (!this.available) return false;
    try {
      await this.ensureOsdWorker();
      return true;
    } catch (error) {
      this.log(`OCR 文字体系探测器预热失败，将在使用时重试：${error?.message || error}`);
      return false;
    }
  }

  async detectScript(imagePath, signal = null) {
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    const worker = await this.ensureOsdWorker();
    const detect = async (candidatePath) => {
      const abort = signal ? new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason || new Error('识别已取消')), { once: true });
      }) : null;
      const operation = worker.detect(path.resolve(candidatePath));
      const result = abort ? await Promise.race([operation, abort]) : await operation;
      const script = result?.data?.script;
      const route = routeForScript(script);
      return route ? {
        ...route,
        script: String(script || ''),
        confidence: Number(result?.data?.script_confidence || 0),
        orientation: Number(result?.data?.orientation_degrees || 0)
      } : null;
    };

    const primary = await detect(imagePath);
    if (primary && primary.confidence >= 4) return primary;
    let prepared = null;
    try {
      prepared = await prepareImageForRecognition(imagePath);
      const enhanced = await detect(prepared.path);
      if (!primary) return enhanced;
      if (!enhanced) return primary;
      return enhanced.confidence >= primary.confidence ? enhanced : primary;
    } finally {
      await prepared?.cleanup?.();
    }
  }

  async ensureRecognitionWorker(pack, progress = null) {
    if (!this.supports(pack)) throw new Error(`缺少 ${pack} 的离线 OCR 语言包`);
    const packLanguages = String(pack).split('+');
    const requested = [...new Set([...packLanguages, 'eng'])].join('+');
    const allPackLanguagesLoaded = packLanguages.every((language) => this.loadedRecognitionLanguages.has(language));
    if (this.recognitionWorker && !allPackLanguagesLoaded && this.loadedRecognitionLanguages.size >= 5) {
      await this.recognitionWorker.terminate();
      this.recognitionWorker = null;
      this.recognitionPromise = null;
      this.loadedRecognitionLanguages.clear();
      this.activeRecognitionLanguages = '';
    }
    if (this.recognitionWorker) {
      if (this.activeRecognitionLanguages !== requested) {
        try {
          await this.recognitionWorker.reinitialize(requested, OEM.LSTM_ONLY);
        } catch (error) {
          await this.recognitionWorker.terminate().catch(() => {});
          this.recognitionWorker = null;
          this.recognitionPromise = null;
          this.loadedRecognitionLanguages.clear();
          this.activeRecognitionLanguages = '';
          throw error;
        }
        requested.split('+').forEach((language) => this.loadedRecognitionLanguages.add(language));
        this.activeRecognitionLanguages = requested;
      }
      return this.recognitionWorker;
    }
    if (!this.recognitionPromise) {
      this.recognitionPromise = createWorker(
        requested,
        OEM.LSTM_ONLY,
        this.workerOptions((message) => {
          if (typeof this.currentProgress !== 'function') return;
          if (message?.status === 'loading language traineddata') this.currentProgress(0.18 + Number(message.progress || 0) * 0.2);
          if (message?.status === 'recognizing text') this.currentProgress(0.42 + Number(message.progress || 0) * 0.5);
        })
      ).then(async (worker) => {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          preserve_interword_spaces: '1'
        });
        this.recognitionWorker = worker;
        requested.split('+').forEach((language) => this.loadedRecognitionLanguages.add(language));
        this.activeRecognitionLanguages = requested;
        return worker;
      }).catch((error) => {
        this.recognitionPromise = null;
        throw error;
      });
    }
    return this.recognitionPromise;
  }

  recognize(imagePath, pack, signal = null, options = {}) {
    const operation = () => this.runRecognition(imagePath, pack, signal, options);
    const result = this.serial.then(operation, operation);
    this.serial = result.catch(() => {});
    return result;
  }

  async runRecognition(imagePath, pack, signal = null, options = {}) {
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    const started = performance.now();
    const progress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    this.currentProgress = progress;
    progress(0.08);
    const worker = await this.ensureRecognitionWorker(pack, progress);
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    const abort = signal ? new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason || new Error('识别已取消')), { once: true });
    }) : null;
    let prepared = null;
    const recognizeOnce = async (recognitionPath, transform = null, psm = PSM.SPARSE_TEXT) => {
      await worker.setParameters({
        tessedit_pageseg_mode: psm,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300'
      });
      const operation = worker.recognize(recognitionPath, {}, { text: true, blocks: true });
      const result = abort ? await Promise.race([operation, abort]) : await operation;
      const text = String(result?.data?.text || '').trim();
      let blocks = linesFromBlocks(result?.data?.blocks, transform);
      const confidence = Math.max(0, Math.min(1, Number(result?.data?.confidence || 0) / 100));
      if (text && blocks.length === 0) {
        blocks = [{ text, score: confidence, box: [[0, 0], [1, 0], [1, 1], [0, 1]] }];
      }
      const weightedConfidence = blocks.length === 0
        ? confidence
        : blocks.reduce((total, block) => {
          const weight = Math.max(1, [...String(block.text || '').replace(/\s/gu, '')].length);
          return total + Number(block.score || 0) * weight;
        }, 0) / blocks.reduce((total, block) => (
          total + Math.max(1, [...String(block.text || '').replace(/\s/gu, '')].length)
        ), 0);
      return { text, blocks, confidence: Math.max(confidence, weightedConfidence) };
    };
    try {
      let selected = null;
      try {
        selected = await recognizeOnce(path.resolve(imagePath));
      } catch (error) {
        if (signal?.aborted || !options.enhance) throw error;
      }
      if (options.enhance && (!selected?.text || selected.confidence < .72)) {
        progress(0.24);
        prepared = await prepareImageForRecognition(imagePath);
        const enhanced = await recognizeOnce(
          prepared.path,
          prepared,
          pageSegmentationForImage(prepared)
        );
        if (!selected?.text || enhanced.confidence > selected.confidence + .015) selected = enhanced;
      }
      if (!selected?.text) throw new Error('选区中没有识别到文字');
      progress(0.98);
      return {
        text: selected.text,
        blocks: selected.blocks,
        modelGroup: String(pack || '').toLowerCase(),
        modelLabel: `Tesseract Fast · ${pack}`,
        elapsedMs: Math.round(performance.now() - started)
      };
    } finally {
      await prepared?.cleanup?.();
      if (this.currentProgress === progress) this.currentProgress = null;
    }
  }

  async stop() {
    const osd = this.osdWorker;
    const recognition = this.recognitionWorker;
    this.osdWorker = null;
    this.osdPromise = null;
    this.recognitionWorker = null;
    this.recognitionPromise = null;
    this.activeRecognitionLanguages = '';
    await Promise.allSettled([osd?.terminate(), recognition?.terminate()].filter(Boolean));
  }
}

module.exports = { TesseractWorkerManager, routeForScript };
