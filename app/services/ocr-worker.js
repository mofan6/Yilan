'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { TesseractWorkerManager } = require('./tesseract-worker');

const FUSION_BATCH_SIZE = 4;
const MAX_RESIDENT_WORKERS = 6;
const AUTO_PRIMARY_GROUPS = Object.freeze(['common', 'cyrillic', 'japanese', 'korean']);
const AUTO_SECONDARY_GROUPS = Object.freeze([
  'latin', 'arabic', 'thai'
]);
const AUTO_FALLBACK_GROUPS = Object.freeze([
  'traditional', 'devanagari', 'tamil', 'telugu'
]);
const SMART_SPECIALIST_GROUPS = Object.freeze([
  'japanese', 'korean', 'marathi', 'gujarati', 'myanmar', 'khmer'
]);

const MODEL_GROUPS = Object.freeze({
  common: {
    label: '中英混合',
    det: 'ch_PP-OCRv4_det_infer.onnx',
    cls: 'ch_ppocr_mobile_v2.0_cls_infer.onnx',
    rec: 'rec_ch_PP-OCRv4_infer.onnx',
    keys: 'dict_chinese.txt'
  },
  latin: {
    label: '拉丁文字',
    det: 'ch_PP-OCRv3_det_infer.onnx',
    cls: 'ch_ppocr_mobile_v2.0_cls_infer.onnx',
    rec: 'rec_en_PP-OCRv3_infer.onnx',
    keys: 'dict_en.txt'
  },
  traditional: {
    label: '繁体中文',
    det: 'ch_PP-OCRv3_det_infer.onnx',
    cls: 'ch_ppocr_mobile_v2.0_cls_infer.onnx',
    rec: 'rec_chinese_cht_PP-OCRv3_infer.onnx',
    keys: 'dict_chinese_cht.txt'
  },
  japanese: {
    label: '日语 Paddle 增强 OCR',
    language: 'ja',
    det: 'ch_PP-OCRv3_det_infer.onnx',
    cls: 'ch_ppocr_mobile_v2.0_cls_infer.onnx',
    rec: 'rec_japan_PP-OCRv3_infer.onnx',
    keys: 'dict_japan.txt'
  },
  korean: { engine: 'tesseract', label: '韩语增强 OCR', pack: 'kor', language: 'ko', enhance: true },
  cyrillic: { engine: 'tesseract', label: '西里尔文字专项 OCR', pack: 'Cyrillic' },
  arabic: { engine: 'tesseract', label: '阿拉伯文字专项 OCR', pack: 'Arabic' },
  devanagari: { engine: 'tesseract', label: '印地语/马拉地语增强 OCR', pack: 'hin+mar', enhance: true },
  marathi: { engine: 'tesseract', label: '马拉地语增强 OCR', pack: 'mar', language: 'mr', enhance: true },
  tamil: { engine: 'tesseract', label: '泰米尔文专项 OCR', pack: 'Tamil' },
  telugu: { engine: 'tesseract', label: '泰卢固文专项 OCR', pack: 'Telugu' },
  thai: { engine: 'tesseract', label: '泰文专项 OCR', pack: 'Thai' },
  bengali: { engine: 'tesseract', label: '孟加拉文专项 OCR', pack: 'Bengali' },
  tibetan: { engine: 'tesseract', label: '藏文专项 OCR', pack: 'Tibetan' },
  gujarati: { engine: 'tesseract', label: '古吉拉特语增强 OCR', pack: 'guj', language: 'gu', enhance: true },
  hebrew: { engine: 'tesseract', label: '希伯来文专项 OCR', pack: 'Hebrew' },
  khmer: { engine: 'tesseract', label: '高棉语增强 OCR', pack: 'khm', language: 'km', enhance: true },
  myanmar: { engine: 'tesseract', label: '缅甸语增强 OCR', pack: 'mya', language: 'my', enhance: true }
});

const LATIN_LANGUAGES = new Set(['en', 'fr', 'pt', 'es', 'tr', 'it', 'de', 'vi', 'ms', 'id', 'tl', 'pl', 'cs', 'nl']);
const CYRILLIC_LANGUAGES = new Set(['ru', 'uk', 'kk', 'mn']);
const ARABIC_LANGUAGES = new Set(['ar', 'fa', 'ur', 'ug']);
const DEVANAGARI_LANGUAGES = new Set(['hi']);

function modelGroupForLanguage(language) {
  if (language === 'zh-Hant') return 'traditional';
  if (language === 'ja') return 'japanese';
  if (language === 'ko') return 'korean';
  if (CYRILLIC_LANGUAGES.has(language)) return 'cyrillic';
  if (ARABIC_LANGUAGES.has(language)) return 'arabic';
  if (language === 'mr') return 'marathi';
  if (DEVANAGARI_LANGUAGES.has(language)) return 'devanagari';
  if (language === 'ta') return 'tamil';
  if (language === 'te') return 'telugu';
  if (language === 'th') return 'thai';
  if (language === 'bn') return 'bengali';
  if (language === 'bo') return 'tibetan';
  if (language === 'gu') return 'gujarati';
  if (language === 'he') return 'hebrew';
  if (language === 'km') return 'khmer';
  if (language === 'my') return 'myanmar';
  if (LATIN_LANGUAGES.has(language)) return 'latin';
  return 'common';
}

function averagePoint(box, axis) {
  if (!Array.isArray(box) || box.length === 0) return 0;
  return box.reduce((sum, point) => sum + Number(point?.[axis] || 0), 0) / box.length;
}

function orderBlocks(blocks) {
  return [...blocks].sort((a, b) => {
    const ay = averagePoint(a.box, 1);
    const by = averagePoint(b.box, 1);
    const ah = Math.max(1, Math.abs(Number(a.box?.[3]?.[1] || 0) - Number(a.box?.[0]?.[1] || 0)));
    const bh = Math.max(1, Math.abs(Number(b.box?.[3]?.[1] || 0) - Number(b.box?.[0]?.[1] || 0)));
    if (Math.abs(ay - by) > Math.max(ah, bh) * 0.58) return ay - by;
    return averagePoint(a.box, 0) - averagePoint(b.box, 0);
  });
}

function fusionGroupsForLanguage(language) {
  const requested = modelGroupForLanguage(language);
  if (language === 'auto') return [...AUTO_PRIMARY_GROUPS];
  const companionGroups = ({
    common: ['common', 'latin', 'japanese'],
    latin: ['latin', 'common'],
    traditional: ['traditional', 'latin', 'japanese'],
    japanese: ['japanese', 'latin', 'common'],
    korean: ['korean', 'latin', 'common'],
    cyrillic: ['cyrillic', 'latin', 'common'],
    arabic: ['arabic', 'latin', 'common'],
    devanagari: ['devanagari', 'latin', 'common'],
    marathi: ['marathi', 'latin', 'common'],
    tamil: ['tamil', 'latin', 'common'],
    telugu: ['telugu', 'latin', 'common'],
    thai: ['thai', 'latin', 'common']
  })[requested] || [requested, 'common', 'latin'];
  return [...new Set(companionGroups)];
}

function boxBounds(box) {
  const xs = Array.isArray(box) ? box.map((point) => Number(point?.[0] || 0)) : [0];
  const ys = Array.isArray(box) ? box.map((point) => Number(point?.[1] || 0)) : [0];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return {
    left, top, right, bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2
  };
}

function sameTextRegion(first, second) {
  const a = boxBounds(first);
  const b = boxBounds(second);
  const intersectionWidth = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const intersectionHeight = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const intersection = intersectionWidth * intersectionHeight;
  const smaller = Math.min(a.width * a.height, b.width * b.height);
  if (intersection / Math.max(1, smaller) >= 0.46) return true;
  const verticalDistance = Math.abs(a.centerY - b.centerY);
  const horizontalDistance = Math.abs(a.centerX - b.centerX);
  return verticalDistance <= Math.max(a.height, b.height) * 0.42
    && horizontalDistance <= Math.max(a.width, b.width) * 0.38;
}

function countMatches(text, pattern) {
  return (String(text || '').match(pattern) || []).length;
}

function latinNoiseRatio(text) {
  const words = String(text || '').match(/[\p{Script=Latin}\p{N}]{4,}/gu) || [];
  if (words.length === 0) return 0;
  const suspicious = words.filter((word) => {
    const upper = countMatches(word, /\p{Lu}/gu);
    const lower = countMatches(word, /\p{Ll}/gu);
    const mixedDigit = /\p{L}\p{N}|\p{N}\p{L}/u.test(word);
    const brokenCase = lower > 0 && upper > 0
      && (/\p{Ll}.*\p{Lu}/u.test(word) || upper / Math.max(1, upper + lower) > 0.42);
    return mixedDigit || brokenCase;
  }).length;
  return suspicious / words.length;
}

function candidateQuality(block, group, requestedGroup) {
  const text = String(block.text || '');
  const length = Math.max(1, [...text.replace(/\s/gu, '')].length);
  const han = countMatches(text, /[\p{Script=Han}]/gu);
  const kana = countMatches(text, /[\p{Script=Hiragana}\p{Script=Katakana}]/gu);
  const hangul = countMatches(text, /[\p{Script=Hangul}]/gu);
  const cyrillic = countMatches(text, /[\p{Script=Cyrillic}]/gu);
  const arabic = countMatches(text, /[\p{Script=Arabic}]/gu);
  const devanagari = countMatches(text, /[\p{Script=Devanagari}]/gu);
  const tamil = countMatches(text, /[\p{Script=Tamil}]/gu);
  const telugu = countMatches(text, /[\p{Script=Telugu}]/gu);
  const thai = countMatches(text, /[\p{Script=Thai}]/gu);
  const bengali = countMatches(text, /[\p{Script=Bengali}]/gu);
  const tibetan = countMatches(text, /[\p{Script=Tibetan}]/gu);
  const gujarati = countMatches(text, /[\p{Script=Gujarati}]/gu);
  const hebrew = countMatches(text, /[\p{Script=Hebrew}]/gu);
  const khmer = countMatches(text, /[\p{Script=Khmer}]/gu);
  const myanmar = countMatches(text, /[\p{Script=Myanmar}]/gu);
  const latin = countMatches(text, /[\p{Script=Latin}]/gu);
  const digits = countMatches(text, /[0-9]/g);
  const readable = han + kana + hangul + cyrillic + arabic + devanagari
    + tamil + telugu + thai + bengali + tibetan + gujarati + hebrew + khmer + myanmar + latin + digits;
  const distinctive = kana + hangul + cyrillic + arabic + devanagari + tamil + telugu + thai
    + bengali + tibetan + gujarati + hebrew + khmer + myanmar;
  let quality = Number(block.score || 0);

  if (group === 'common') {
    if (han > 0) quality += 0.12 + Math.min(0.04, han / length * 0.04);
    if (kana > 0) quality -= 0.08;
  } else if (group === 'latin') {
    quality += ((latin + digits) / length) * 0.08;
    quality -= ((han + distinctive) / length) * 0.34;
  } else if (group === 'japanese') {
    if (kana > 0) quality += 0.16 + Math.min(0.05, kana / length * 0.05);
    else if (han > 0) quality += 0.04;
    quality -= ((hangul + cyrillic + arabic + devanagari + tamil + telugu + thai) / length) * 0.26;
  } else if (group === 'traditional') {
    if (han > 0) quality += 0.14;
  } else if (group === 'korean') {
    if (hangul > 0) quality += 0.18;
  } else if (group === 'cyrillic') {
    if (cyrillic > 0) quality += 0.18;
  } else if (group === 'arabic') {
    if (arabic > 0) quality += 0.18;
  } else if (group === 'devanagari' || group === 'marathi') {
    if (devanagari > 0) quality += 0.18;
  } else if (group === 'tamil') {
    if (tamil > 0) quality += 0.18;
  } else if (group === 'telugu') {
    if (telugu > 0) quality += 0.18;
  } else if (group === 'thai') {
    if (thai > 0) quality += 0.18;
  } else if (group === 'bengali') {
    if (bengali > 0) quality += 0.18;
  } else if (group === 'tibetan') {
    if (tibetan > 0) quality += 0.18;
  } else if (group === 'gujarati') {
    if (gujarati > 0) quality += 0.18;
  } else if (group === 'hebrew') {
    if (hebrew > 0) quality += 0.18;
  } else if (group === 'khmer') {
    if (khmer > 0) quality += 0.18;
  } else if (group === 'myanmar') {
    if (myanmar > 0) quality += 0.18;
  }
  if ((group === 'latin' || group === 'common') && latin >= length * 0.64) {
    quality -= latinNoiseRatio(text) * 0.34;
  }
  if (group === requestedGroup) quality += 0.025;
  quality -= Math.max(0, (length - readable) / length - 0.34) * 0.22;
  return quality;
}

function blockMatchesModel(block) {
  const text = String(block.text || '');
  const group = block.modelGroup;
  if (group === 'common') return /[\p{Script=Han}\p{Script=Latin}]/u.test(text);
  if (group === 'latin') return /\p{Script=Latin}/u.test(text);
  if (group === 'traditional') return /\p{Script=Han}/u.test(text);
  if (group === 'japanese') return /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
  if (group === 'korean') return /\p{Script=Hangul}/u.test(text);
  if (group === 'cyrillic') return /\p{Script=Cyrillic}/u.test(text);
  if (group === 'arabic') return /\p{Script=Arabic}/u.test(text);
  if (group === 'devanagari' || group === 'marathi') return /\p{Script=Devanagari}/u.test(text);
  if (group === 'tamil') return /\p{Script=Tamil}/u.test(text);
  if (group === 'telugu') return /\p{Script=Telugu}/u.test(text);
  if (group === 'thai') return /\p{Script=Thai}/u.test(text);
  if (group === 'bengali') return /\p{Script=Bengali}/u.test(text);
  if (group === 'tibetan') return /\p{Script=Tibetan}/u.test(text);
  if (group === 'gujarati') return /\p{Script=Gujarati}/u.test(text);
  if (group === 'hebrew') return /\p{Script=Hebrew}/u.test(text);
  if (group === 'khmer') return /\p{Script=Khmer}/u.test(text);
  if (group === 'myanmar') return /\p{Script=Myanmar}/u.test(text);
  return false;
}

function recognitionLooksConfident(result) {
  const blocks = Array.isArray(result?.blocks) ? result.blocks : [];
  if (blocks.length === 0) return false;
  let weight = 0;
  let score = 0;
  let matchingWeight = 0;
  for (const block of blocks) {
    const blockWeight = Math.max(1, [...String(block.text || '').replace(/\s/gu, '')].length);
    weight += blockWeight;
    score += Math.max(0, Math.min(1, Number(block.score || 0))) * blockWeight;
    if (blockMatchesModel({ ...block, modelGroup: block.modelGroup || result?.modelGroup })) matchingWeight += blockWeight;
  }
  const text = blocks.map((block) => block.text).join(' ');
  const latinCount = countMatches(text, /\p{Script=Latin}/gu);
  const visibleCount = Math.max(1, [...text.replace(/\s/gu, '')].length);
  if (latinCount / visibleCount > 0.62 && latinNoiseRatio(text) > 0.24) return false;
  const specialistThreshold = MODEL_GROUPS[result?.modelGroup]?.engine === 'tesseract' ? 0.58 : 0.76;
  return score / Math.max(1, weight) >= specialistThreshold
    && matchingWeight / Math.max(1, weight) >= 0.72;
}

function scriptCoverageForGroup(text, group) {
  const source = String(text || '');
  const visible = Math.max(1, countMatches(source, /[\p{L}\p{N}]/gu));
  const patterns = {
    japanese: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu,
    korean: /\p{Script=Hangul}/gu,
    marathi: /\p{Script=Devanagari}/gu,
    gujarati: /\p{Script=Gujarati}/gu,
    myanmar: /\p{Script=Myanmar}/gu,
    khmer: /\p{Script=Khmer}/gu
  };
  return Math.min(1, countMatches(source, patterns[group] || /$a/gu) / visible);
}

function weightedRecognitionConfidence(result) {
  const blocks = Array.isArray(result?.blocks) ? result.blocks : [];
  let weight = 0;
  let score = 0;
  for (const block of blocks) {
    const blockWeight = Math.max(1, [...String(block.text || '').replace(/\s/gu, '')].length);
    weight += blockWeight;
    score += Math.max(0, Math.min(1, Number(block.score || 0))) * blockWeight;
  }
  return score / Math.max(1, weight);
}

function specialistProbeMetrics(result) {
  const group = result?.modelGroup;
  const text = String(result?.text || '');
  const confidence = weightedRecognitionConfidence(result);
  const coverage = scriptCoverageForGroup(text, group);
  const length = countMatches(text, /[\p{L}\p{N}]/gu);
  return {
    confidence,
    coverage,
    length,
    score: confidence * .76 + coverage * .24 - latinNoiseRatio(text) * .08
  };
}

function strongSpecialistResult(result) {
  const metrics = specialistProbeMetrics(result);
  return metrics.length >= 2 && metrics.confidence >= .82 && metrics.coverage >= .72;
}

function fuseRecognitionResults(results, sourceLanguage, started) {
  const requestedGroup = sourceLanguage === 'auto' ? null : modelGroupForLanguage(sourceLanguage);
  const clusters = [];
  for (const result of results) {
    for (const block of result.blocks) {
      let cluster = clusters.find((item) => sameTextRegion(item.anchor.box, block.box));
      if (!cluster) {
        cluster = { anchor: block, candidates: [] };
        clusters.push(cluster);
      }
      cluster.candidates.push({
        block,
        group: result.modelGroup,
        quality: candidateQuality(block, result.modelGroup, requestedGroup)
      });
    }
  }
  const blocks = orderBlocks(clusters.map((cluster) => {
    const selected = cluster.candidates.sort((a, b) => b.quality - a.quality)[0];
    return { ...selected.block, modelGroup: selected.group };
  }).filter((block) => block.text));
  const text = blocks.map((block) => block.text).join('\n').trim();
  if (!text) throw new Error('选区中没有识别到文字');
  return {
    text,
    blocks,
    modelGroup: 'fusion',
    modelGroups: results.map((result) => result.modelGroup),
    modelLabel: '多语融合 OCR',
    elapsedMs: Math.round(performance.now() - started)
  };
}

function parseRecognitionPayload(payload, group, started) {
  if (payload?.code !== 100 || !Array.isArray(payload.data) || payload.data.length === 0) {
    throw new Error(payload?.data || '选区中没有识别到文字');
  }
  const blocks = orderBlocks(payload.data.map((item) => ({
    text: String(item.text || '').trim(),
    score: Number(item.score || 0),
    box: item.box
  })).filter((item) => item.text));
  const text = blocks.map((item) => item.text).join('\n').trim();
  if (!text) throw new Error('选区中没有识别到文字');
  return {
    text,
    blocks,
    modelGroup: group,
    modelLabel: MODEL_GROUPS[group].label,
    elapsedMs: Math.round(performance.now() - started)
  };
}

function notifyOcrProgress(callback, progress, detail) {
  if (typeof callback !== 'function') return;
  try {
    callback({
      progress: Math.max(0, Math.min(1, Number(progress) || 0)),
      detail
    });
  } catch {}
}

class OcrWorkerManager {
  constructor(root, log = () => {}) {
    this.root = root;
    this.log = log;
    this.workers = new Map();
    this.serial = Promise.resolve();
    this.tesseract = new TesseractWorkerManager(path.join(path.dirname(root), 'tessdata'), log);
    this.lastSpecialistGroup = null;
  }

  get available() {
    return fs.existsSync(path.join(this.root, 'RapidOCR-json.exe'));
  }

  recognize(imagePath, sourceLanguage = 'auto', signal = null, options = {}) {
    const operation = async () => {
      const mode = ['smart', 'compatible', 'specified'].includes(options.mode) ? options.mode : 'smart';
      if (sourceLanguage !== 'auto') {
        notifyOcrProgress(options.onProgress, .08, '正在启动文字识别模型…');
        const result = await this.runGroupWithRecovery(
          imagePath,
          modelGroupForLanguage(sourceLanguage),
          signal,
          options.onProgress
        );
        notifyOcrProgress(options.onProgress, .98, '文字识别完成，正在整理文本…');
        return result;
      }
      if (mode === 'specified') {
        throw new Error('当前为「仅指定语言」模式，请先在左上角选择源语言后再截图');
      }
      if (options.fusion === false) {
        return this.runGroupWithRecovery(imagePath, 'common', signal, options.onProgress);
      }
      if (mode === 'compatible') {
        try {
          const routed = await this.runSmartRecognition(imagePath, signal, options.onProgress);
          if (recognitionLooksConfident(routed)) return routed;
        } catch (error) {
          if (signal?.aborted) throw error;
          this.log(`智能 OCR 路由未得到稳定结果，进入兼容融合：${error?.message || error}`);
        }
        return this.runFusionRecognition(imagePath, sourceLanguage, signal, options.onProgress);
      }
      return this.runSmartRecognition(imagePath, signal, options.onProgress);
    };
    const result = this.serial.then(operation, operation);
    this.serial = result.catch(() => {});
    return result;
  }

  isRecoverableWorkerError(error) {
    return /识别引擎已退出|识别引擎未就绪|EPIPE|broken pipe|初始化超时|进程已结束/i.test(String(error?.message || error));
  }

  async runGroupWithRecovery(imagePath, group, signal, onProgress = null) {
    const config = MODEL_GROUPS[group] || MODEL_GROUPS.common;
    if (config.engine === 'tesseract') {
      return this.tesseract.recognize(imagePath, config.pack, signal, {
        enhance: config.enhance === true,
        onProgress: (progress) => notifyOcrProgress(
          onProgress,
          .2 + Math.max(0, Math.min(1, Number(progress) || 0)) * .72,
          `正在识别${config.label.replace(/专项 OCR$/u, '')}…`
        )
      }).then((result) => ({
        ...result,
        modelGroup: group,
        modelLabel: config.label,
        detectedLanguage: config.language || null
      }));
    }
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await this.runRecognitionForGroup(imagePath, group, signal);
        return { ...result, detectedLanguage: config.language || null };
      } catch (error) {
        lastError = error;
        if (signal?.aborted || !this.isRecoverableWorkerError(error)) throw error;
        this.stopWorker(this.workers.get(group));
        if (attempt === 0) this.log(`OCR[${group}] 异常，正在自动重启：${error?.message || error}`);
      }
    }
    this.log(`OCR[${group}] 常驻进程不可用，切换到单次识别：${lastError?.message || lastError}`);
    return this.runOneShotRecognition(imagePath, group, signal)
      .then((result) => ({ ...result, detectedLanguage: config.language || null }));
  }

  async warmup(groups = ['common']) {
    if (!this.available) return false;
    const normalized = [...new Set(groups
      .map((group) => MODEL_GROUPS[group] ? group : 'common')
      .filter((group) => MODEL_GROUPS[group].engine !== 'tesseract'))];
    const osdWarmup = this.tesseract.warmupOsd();
    for (let index = 0; index < normalized.length; index += FUSION_BATCH_SIZE) {
      const batch = normalized.slice(index, index + FUSION_BATCH_SIZE);
      const settled = await Promise.allSettled(batch.map((group) => this.ensureWorker(group)));
      settled.forEach((result, resultIndex) => {
        if (result.status === 'rejected') {
          this.log(`OCR[${batch[resultIndex]}] 预热失败，将在使用时重试：${result.reason?.message || result.reason}`);
        }
      });
    }
    await osdWarmup;
    return true;
  }

  trimIdleWorkers(limit = MAX_RESIDENT_WORKERS) {
    const idle = [...this.workers.values()]
      .filter((worker) => !worker.pending)
      .sort((a, b) => {
        const primaryDelta = Number(AUTO_PRIMARY_GROUPS.includes(a.group)) - Number(AUTO_PRIMARY_GROUPS.includes(b.group));
        return primaryDelta || Number(a.lastUsedAt || 0) - Number(b.lastUsedAt || 0);
      });
    while (this.workers.size > limit && idle.length > 0) {
      this.stopWorker(idle.shift());
    }
  }

  async runSpecialistProbe(imagePath, signal, onProgress = null, existingResults = [], preferredGroup = null) {
    const groups = [...new Set([
      this.lastSpecialistGroup,
      preferredGroup,
      ...SMART_SPECIALIST_GROUPS
    ].filter((group) => SMART_SPECIALIST_GROUPS.includes(group)))];
    const results = existingResults.filter(Boolean);
    const completedGroups = new Set(results.map((result) => result.modelGroup));
    for (let index = 0; index < groups.length; index += 1) {
      if (signal?.aborted) throw signal.reason || new Error('识别已取消');
      const group = groups[index];
      if (completedGroups.has(group)) continue;
      notifyOcrProgress(
        onProgress,
        .58 + (index / Math.max(1, groups.length)) * .34,
        `短文字体系不明确，正在校验${MODEL_GROUPS[group].label.replace(/\s*OCR$/u, '')}…`
      );
      try {
        const result = await this.runGroupWithRecovery(imagePath, group, signal);
        results.push(result);
        completedGroups.add(group);
        if (strongSpecialistResult(result)) {
          this.lastSpecialistGroup = group;
          return result;
        }
      } catch (error) {
        if (signal?.aborted) throw error;
        this.log(`OCR[${group}] 短文校验未返回结果：${error?.message || error}`);
      }
    }

    const ranked = results
      .filter((result) => SMART_SPECIALIST_GROUPS.includes(result?.modelGroup))
      .map((result) => ({ result, ...specialistProbeMetrics(result) }))
      .sort((a, b) => b.score - a.score);
    if (ranked.length === 0) return null;
    const best = ranked[0];
    const runnerUp = ranked[1];
    if (best.score >= .68 && (!runnerUp || best.score - runnerUp.score >= .08)) {
      this.lastSpecialistGroup = best.result.modelGroup;
      return best.result;
    }
    return null;
  }

  async runSmartRecognition(imagePath, signal, onProgress = null) {
    if (!this.available) throw new Error('截图识别组件缺失，请重新安装译澜完整组件');
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    const started = performance.now();
    notifyOcrProgress(onProgress, .04, '正在快速判断画面中的文字体系…');

    let route = null;
    try {
      route = await this.tesseract.detectScript(imagePath, signal);
    } catch (error) {
      if (signal?.aborted) throw error;
      this.log(`OCR 文字体系探测未返回结果，改用通用模型：${error?.message || error}`);
    }

    const routedGroup = route?.group && MODEL_GROUPS[route.group] ? route.group : 'common';
    notifyOcrProgress(
      onProgress,
      .22,
      route
        ? `已定位${MODEL_GROUPS[routedGroup].label.replace(/PP-OCRv5\s*/u, '').replace(/专项 OCR$/u, '')}，正在识别…`
        : '文字体系不够明确，正在使用通用模型…'
    );
    let primary = null;
    let primaryError = null;
    try {
      primary = await this.runGroupWithRecovery(imagePath, routedGroup, signal, (update) => {
        notifyOcrProgress(
          onProgress,
          .22 + Math.max(0, Math.min(1, Number(update?.progress) || 0)) * .34,
          update?.detail || '正在识别选区文字…'
        );
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      primaryError = error;
    }
    if (primary && recognitionLooksConfident(primary)) {
      notifyOcrProgress(onProgress, .98, '文字与语种识别完成…');
      return { ...primary, elapsedMs: Math.round(performance.now() - started) };
    }

    const shouldProbeSpecialists = !route
      || routedGroup === 'common'
      || routedGroup === 'latin'
      || SMART_SPECIALIST_GROUPS.includes(routedGroup);
    if (shouldProbeSpecialists) {
      const specialist = await this.runSpecialistProbe(
        imagePath,
        signal,
        onProgress,
        primary ? [primary] : [],
        SMART_SPECIALIST_GROUPS.includes(routedGroup) ? routedGroup : null
      );
      if (specialist) {
        notifyOcrProgress(onProgress, .98, '已确认文字体系，正在整理文本…');
        return { ...specialist, elapsedMs: Math.round(performance.now() - started) };
      }
    }

    if (!primary) throw primaryError || new Error('选区中没有识别到文字');

    if (!route) {
      const commonText = String(primary?.text || '');
      const looksReadable = /[\p{Script=Han}\p{Script=Latin}]/u.test(commonText)
        && latinNoiseRatio(commonText) <= .2;
      if (!looksReadable) {
        throw new Error('无法可靠判断截图中的文字体系，请在左上角选择源语言后重试');
      }
      notifyOcrProgress(onProgress, .98, '通用文字识别完成…');
      return { ...primary, elapsedMs: Math.round(performance.now() - started) };
    }

    const companionGroup = routedGroup === 'common'
      ? 'latin'
      : routedGroup === 'latin'
        ? 'common'
        : 'common';
    if (companionGroup === routedGroup) return primary;
    notifyOcrProgress(onProgress, .72, '置信度偏低，正在进行一次轻量校正…');
    let companion = null;
    try {
      companion = await this.runGroupWithRecovery(imagePath, companionGroup, signal);
    } catch (error) {
      if (signal?.aborted) throw error;
    }
    if (!companion) return primary;
    const fused = fuseRecognitionResults([primary, companion], 'auto', started);
    notifyOcrProgress(onProgress, .98, '文字识别与校正完成…');
    return fused;
  }

  async runFusionRecognition(imagePath, sourceLanguage, signal, onProgress = null) {
    if (!this.available) throw new Error('截图识别组件缺失，请重新安装译澜完整组件');
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    const started = performance.now();
    notifyOcrProgress(onProgress, .03, sourceLanguage === 'auto' ? '正在启动多语融合 OCR…' : '正在启动文字识别模型…');
    const runGroups = async (groups, rangeStart, rangeEnd, label) => {
      const settled = [];
      let completed = 0;
      for (let index = 0; index < groups.length; index += FUSION_BATCH_SIZE) {
        if (signal?.aborted) throw signal.reason || new Error('识别已取消');
        const batch = groups.slice(index, index + FUSION_BATCH_SIZE);
        settled.push(...await Promise.allSettled(
          batch.map(async (group) => {
            try {
              return await this.runGroupWithRecovery(imagePath, group, signal);
            } finally {
              completed += 1;
              const ratio = completed / Math.max(1, groups.length);
              notifyOcrProgress(
                onProgress,
                rangeStart + (rangeEnd - rangeStart) * ratio,
                `${label}（${completed}/${groups.length}）…`
              );
            }
          })
        ));
        this.trimIdleWorkers();
      }
      return settled;
    };
    if (sourceLanguage !== 'auto') {
      notifyOcrProgress(onProgress, .16, '正在识别选区文字…');
      const result = await this.runGroupWithRecovery(imagePath, modelGroupForLanguage(sourceLanguage), signal);
      notifyOcrProgress(onProgress, .98, '文字识别完成，正在整理文本…');
      return result;
    }

    const settled = await runGroups(AUTO_PRIMARY_GROUPS, .08, .58, '正在比对常用文字模型');
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    let results = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    let fused = results.length === 1 ? results[0] : results.length > 1 ? fuseRecognitionResults(results, sourceLanguage, started) : null;
    if (fused && recognitionLooksConfident(fused)) {
      notifyOcrProgress(onProgress, .98, '文字与语种识别完成…');
      return fused;
    }

    const secondarySettled = await runGroups(AUTO_SECONDARY_GROUPS, .58, .8, '正在补充比对其他语种');
    results = results.concat(
      secondarySettled.filter((item) => item.status === 'fulfilled').map((item) => item.value)
    );
    if (results.length === 0) {
      const firstError = [...settled, ...secondarySettled].find((item) => item.status === 'rejected')?.reason;
      throw firstError || new Error('选区中没有识别到文字');
    }
    fused = results.length === 1 ? results[0] : fuseRecognitionResults(results, sourceLanguage, started);
    if (recognitionLooksConfident(fused)) {
      notifyOcrProgress(onProgress, .98, '多语文字融合完成…');
      return fused;
    }

    const fallbackSettled = await runGroups(AUTO_FALLBACK_GROUPS, .8, .96, '正在完成多语融合识别');
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    results = results.concat(
      fallbackSettled.filter((item) => item.status === 'fulfilled').map((item) => item.value)
    );
    if (results.length === 1) {
      notifyOcrProgress(onProgress, .98, '文字识别完成，正在整理文本…');
      return results[0];
    }
    fused = fuseRecognitionResults(results, sourceLanguage, started);
    notifyOcrProgress(onProgress, .98, '多语文字融合完成…');
    return fused;
  }

  async runRecognitionForGroup(imagePath, group, signal) {
    if (!this.available) throw new Error('截图识别组件缺失，请重新安装译澜完整组件');
    if (signal?.aborted) throw signal.reason || new Error('识别已取消');
    const worker = await this.ensureWorker(group);
    if (!worker || this.workers.get(group) !== worker || worker.child.exitCode !== null) {
      throw new Error('截图识别引擎未就绪');
    }
    worker.lastUsedAt = Date.now();
    const started = performance.now();

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
        if (worker.pending === pending) worker.pending = null;
        if (error) reject(error);
        else resolve(value);
      };
      const abortHandler = signal ? () => {
        const error = signal.reason || new Error('识别已取消');
        this.stopWorker(worker, error);
        finish(error);
      } : null;
      if (signal) signal.addEventListener('abort', abortHandler, { once: true });
      const pending = {
        resolve: (payload) => {
          try {
            finish(null, parseRecognitionPayload(payload, group, started));
          } catch (error) {
            finish(error);
          }
        },
        reject: (error) => finish(error)
      };
      worker.pending = pending;
      try {
        worker.child.stdin.write(`${JSON.stringify({ image_path: path.resolve(imagePath) })}\n`, 'utf8');
      } catch (error) {
        finish(error);
      }
    });
  }

  workerArguments(group) {
    const config = MODEL_GROUPS[group] || MODEL_GROUPS.common;
    return [
      '--models=models',
      `--det=${config.det}`,
      `--cls=${config.cls}`,
      `--rec=${config.rec}`,
      `--keys=${config.keys}`,
      '--ensureAscii=0',
      '--padding=36',
      '--maxSideLen=2560',
      '--boxScoreThresh=0.5',
      '--boxThresh=0.3',
      '--unClipRatio=1.6',
      '--doAngle=1',
      '--mostAngle=1',
      `--numThread=${Math.max(1, Math.min(2, Math.floor(require('node:os').availableParallelism() / 3)))}`
    ];
  }

  runOneShotRecognition(imagePath, group, signal) {
    if (!this.available) return Promise.reject(new Error('截图识别组件缺失，请重新安装译澜完整组件'));
    if (signal?.aborted) return Promise.reject(signal.reason || new Error('识别已取消'));
    const started = performance.now();
    const executable = path.join(this.root, 'RapidOCR-json.exe');
    const child = spawn(executable, [...this.workerArguments(group), `--image=${path.resolve(imagePath)}`], {
      cwd: this.root,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return new Promise((resolve, reject) => {
      let settled = false;
      let stdout = '';
      let stderr = '';
      const timeout = setTimeout(() => finish(new Error('截图识别超时，请缩小选区后重试')), 90000);
      timeout.unref?.();
      const abortHandler = signal ? () => finish(signal.reason || new Error('识别已取消')) : null;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
        if (error && child.exitCode === null) {
          try { child.kill(); } catch {}
        }
        if (error) reject(error);
        else resolve(value);
      };
      if (signal) signal.addEventListener('abort', abortHandler, { once: true });
      child.stdout.on('data', (chunk) => { stdout += String(chunk); });
      child.stderr.on('data', (chunk) => { stderr += String(chunk); });
      child.once('error', (error) => finish(error));
      child.once('close', (code, closeSignal) => {
        if (settled) return;
        const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.startsWith('{'));
        if (code !== 0 || lines.length === 0) {
          const detail = stderr.trim() || stdout.trim() || code || closeSignal || 'unknown';
          finish(new Error(`截图识别引擎已退出（${detail}）`));
          return;
        }
        try {
          finish(null, parseRecognitionPayload(JSON.parse(lines.at(-1)), group, started));
        } catch (error) {
          finish(error);
        }
      });
    });
  }

  async ensureWorker(group) {
    const existing = this.workers.get(group);
    if (existing && existing.child.exitCode === null) {
      existing.lastUsedAt = Date.now();
      await existing.readyPromise;
      return existing;
    }
    if (existing) this.stopWorker(existing);
    const executable = path.join(this.root, 'RapidOCR-json.exe');
    const args = this.workerArguments(group);
    const child = spawn(executable, args, {
      cwd: this.root,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const worker = {
      child,
      group,
      pending: null,
      intentionalStop: false,
      readySettled: false,
      resolveReady: null,
      rejectReady: null,
      readyTimer: null,
      readyPromise: null,
      lastUsedAt: Date.now()
    };
    worker.readyPromise = new Promise((resolve, reject) => {
      worker.resolveReady = resolve;
      worker.rejectReady = reject;
    });
    worker.readyTimer = setTimeout(() => {
      const error = new Error('截图识别引擎初始化超时');
      this.failWorker(worker, error);
      this.stopWorker(worker, error);
    }, 30000);
    worker.readyTimer.unref?.();
    this.workers.set(group, worker);
    const output = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
    output.on('line', (line) => this.handleLine(worker, line));
    child.stderr.on('data', (chunk) => this.log(`OCR[${group}]: ${String(chunk).trim()}`));
    child.once('error', (error) => {
      if (!worker.intentionalStop) this.failWorker(worker, error);
    });
    child.once('exit', (code, signal) => {
      clearTimeout(worker.readyTimer);
      if (this.workers.get(group) === worker) this.workers.delete(group);
      if (worker.intentionalStop) return;
      const detail = code ?? signal ?? 'unknown';
      this.failWorker(worker, new Error(`截图识别引擎已退出（${detail}）`));
    });
    await worker.readyPromise;
    return worker;
  }

  settleWorkerReady(worker, error = null) {
    if (worker.readySettled) return;
    worker.readySettled = true;
    clearTimeout(worker.readyTimer);
    if (error) worker.rejectReady(error);
    else worker.resolveReady(true);
  }

  failWorker(worker, error) {
    this.settleWorkerReady(worker, error);
    const pending = worker.pending;
    worker.pending = null;
    pending?.reject(error);
    if (this.workers.get(worker.group) === worker) this.workers.delete(worker.group);
  }

  handleLine(worker, rawLine) {
    const line = String(rawLine || '').trim();
    if (!line) return;
    if (/OCR init completed/i.test(line)) {
      this.settleWorkerReady(worker);
      return;
    }
    if (!line.startsWith('{')) return;
    try {
      worker.pending?.resolve(JSON.parse(line));
    } catch (error) {
      this.log(`OCR JSON 解析失败: ${error.message}`);
    }
  }

  stopWorker(worker, reason = null) {
    if (!worker) return;
    worker.intentionalStop = true;
    if (this.workers.get(worker.group) === worker) this.workers.delete(worker.group);
    const error = reason || new Error('截图识别引擎已重启');
    this.settleWorkerReady(worker, error);
    const pending = worker.pending;
    worker.pending = null;
    pending?.reject(error);
    if (worker.child.exitCode === null) {
      try { worker.child.kill(); } catch {}
    }
  }

  stop() {
    for (const worker of [...this.workers.values()]) this.stopWorker(worker);
    void this.tesseract.stop();
  }
}

module.exports = { OcrWorkerManager, modelGroupForLanguage };
