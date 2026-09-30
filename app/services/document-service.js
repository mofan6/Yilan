'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');
const fontkit = require('@pdf-lib/fontkit');
const { PDFDocument, rgb } = require('pdf-lib');

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.docx', '.pptx', '.xlsx', '.pdf']);
const PHASE_LABELS = Object.freeze({
  analyzing: '正在分析文档',
  parsing: '正在解析文档结构',
  ocr: '正在逐页识别扫描内容',
  translating: '正在调用本地模型翻译',
  writing: '正在重建译文文件',
  completed: '文档翻译完成',
  paused: '任务已暂停',
  cancelled: '任务已取消',
  failed: '任务遇到问题'
});

function extensionOf(filePath) {
  return path.extname(filePath).toLowerCase();
}

function formatLabel(extension) {
  return ({
    '.txt': '纯文本', '.md': 'Markdown', '.markdown': 'Markdown',
    '.docx': 'Word 文档', '.pptx': 'PowerPoint 演示文稿',
    '.xlsx': 'Excel 工作簿', '.pdf': 'PDF 文档'
  })[extension] || extension.slice(1).toUpperCase();
}

function decodeXml(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_all, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_all, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function encodeXml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function splitLongText(value, maximum = 1850) {
  const text = String(value || '').trim();
  if (text.length <= maximum) return text ? [text] : [];
  const chunks = [];
  let rest = text;
  while (rest.length > maximum) {
    const sample = rest.slice(0, maximum + 1);
    const sentenceBreaks = [...sample.matchAll(/[。！？!?；;\.](?:[”’"']?)(?=\s|$)/g)];
    const whitespace = sample.lastIndexOf(' ');
    const newline = sample.lastIndexOf('\n');
    let cut = sentenceBreaks.length ? sentenceBreaks.at(-1).index + sentenceBreaks.at(-1)[0].length : -1;
    cut = Math.max(cut, newline > maximum * 0.52 ? newline + 1 : -1, whitespace > maximum * 0.68 ? whitespace + 1 : -1);
    if (cut < maximum * 0.45) cut = maximum;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function protectText(text) {
  const protectedValues = [];
  const pattern = /`[^`\n]+`|https?:\/\/[^\s<>()]+|\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b|(?:[A-Za-z]:\\|\/)[^\s<>"']+/g;
  const value = String(text || '').replace(pattern, (match) => {
    const token = `⟦YILAN_NT_${String(protectedValues.length).padStart(4, '0')}_${crypto.randomBytes(2).toString('hex').toUpperCase()}⟧`;
    protectedValues.push({ token, value: match });
    return token;
  });
  return {
    value,
    restore(translated) {
      let result = String(translated || '');
      for (const item of protectedValues) result = result.replaceAll(item.token, item.value);
      return result;
    },
    valid(translated) {
      return protectedValues.every((item) => String(translated || '').includes(item.token));
    }
  };
}

function uniqueOutputPath(inputPath, targetLanguage, forcedExtension = null) {
  const directory = path.dirname(inputPath);
  const parsed = path.parse(inputPath);
  const extension = forcedExtension || parsed.ext;
  const stem = `${parsed.name}_译澜_${targetLanguage}`;
  let candidate = path.join(directory, `${stem}${extension}`);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${stem}_${index}${extension}`);
    index += 1;
  }
  return candidate;
}

function atomicWrite(filePath, data) {
  const temporary = `${filePath}.yilan-${process.pid}-${Date.now()}.tmp`;
  fs.writeFileSync(temporary, data);
  fs.renameSync(temporary, filePath);
}

function readTextFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return { text: buffer.subarray(2).toString('utf16le'), encoding: 'utf16le', bom: true };
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.allocUnsafe(buffer.length - 2);
    for (let index = 2; index + 1 < buffer.length; index += 2) {
      swapped[index - 2] = buffer[index + 1];
      swapped[index - 1] = buffer[index];
    }
    return { text: swapped.toString('utf16le'), encoding: 'utf16be', bom: true };
  }
  const hasUtf8Bom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  return { text: buffer.subarray(hasUtf8Bom ? 3 : 0).toString('utf8'), encoding: 'utf8', bom: hasUtf8Bom };
}

function encodeTextFile(value, metadata) {
  if (metadata.encoding === 'utf16le') return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(value, 'utf16le')]);
  if (metadata.encoding === 'utf16be') {
    const little = Buffer.from(value, 'utf16le');
    for (let index = 0; index + 1 < little.length; index += 2) {
      const first = little[index];
      little[index] = little[index + 1];
      little[index + 1] = first;
    }
    return Buffer.concat([Buffer.from([0xfe, 0xff]), little]);
  }
  return metadata.bom ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(value, 'utf8')]) : Buffer.from(value, 'utf8');
}

function textPieces(text, markdown) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const pieces = [];
  let paragraph = [];
  let inFence = false;
  const flush = () => {
    if (paragraph.length === 0) return;
    const value = paragraph.join(newline);
    pieces.push({ translate: value.trim().length > 0, value });
    paragraph = [];
  };
  for (const line of lines) {
    const fence = markdown && /^\s*(```|~~~)/.test(line);
    if (fence) {
      flush();
      pieces.push({ translate: false, value: `${line}${newline}` });
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      pieces.push({ translate: false, value: `${line}${newline}` });
      continue;
    }
    if (line.trim() === '') {
      flush();
      pieces.push({ translate: false, value: newline });
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return pieces;
}

function replaceBlockText(block, tagPattern, replacement) {
  let first = true;
  return block.replace(tagPattern, (full, prefix, content, suffix) => {
    if (first) {
      first = false;
      return `${prefix}${replacement}${suffix}`;
    }
    return `${prefix}${suffix}`;
  });
}

function extractTextFromBlock(block, tagPattern) {
  const values = [];
  for (const match of block.matchAll(new RegExp(tagPattern.source, tagPattern.flags.includes('g') ? tagPattern.flags : `${tagPattern.flags}g`))) {
    values.push(decodeXml(match[2]));
  }
  return values.join('').replace(/\u00a0/g, ' ').trim();
}

async function prepareOfficeDocument(inputPath, extension) {
  const zip = await JSZip.loadAsync(fs.readFileSync(inputPath));
  const units = [];
  const preparedParts = new Map();
  const candidates = Object.keys(zip.files).filter((name) => {
    if (extension === '.docx') return /^word\/(document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/i.test(name);
    if (extension === '.pptx') return /^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/i.test(name);
    if (extension === '.xlsx') return /^xl\/(sharedStrings|worksheets\/sheet\d+)\.xml$/i.test(name);
    return false;
  });

  for (const partName of candidates) {
    const originalXml = await zip.file(partName)?.async('string');
    if (!originalXml) continue;
    let blockPattern;
    let textPattern;
    if (extension === '.docx') {
      blockPattern = /<w:p\b[\s\S]*?<\/w:p>/g;
      textPattern = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;
    } else if (extension === '.pptx') {
      blockPattern = /<a:p\b[\s\S]*?<\/a:p>/g;
      textPattern = /(<a:t\b[^>]*>)([\s\S]*?)(<\/a:t>)/g;
    } else if (/sharedStrings\.xml$/i.test(partName)) {
      blockPattern = /<si\b[\s\S]*?<\/si>/g;
      textPattern = /(<t\b[^>]*>)([\s\S]*?)(<\/t>)/g;
    } else {
      blockPattern = /<is\b[\s\S]*?<\/is>/g;
      textPattern = /(<t\b[^>]*>)([\s\S]*?)(<\/t>)/g;
    }
    const partUnits = [];
    const preparedXml = originalXml.replace(blockPattern, (block) => {
      const source = extractTextFromBlock(block, textPattern);
      if (!source || !/[\p{L}\p{Script=Han}]/u.test(source)) return block;
      const marker = `__YILAN_TRANSLATION_${crypto.randomUUID().replaceAll('-', '').toUpperCase()}__`;
      const unit = { id: crypto.randomUUID(), source, translation: '', marker, partName };
      units.push(unit);
      partUnits.push(unit);
      return replaceBlockText(block, textPattern, marker);
    });
    preparedParts.set(partName, { xml: preparedXml, units: partUnits });
  }

  if (units.length === 0) throw new Error('没有在文档中找到可翻译的文字');
  return {
    units,
    batchable: true,
    async write(outputPath) {
      for (const [partName, part] of preparedParts) {
        let xml = part.xml;
        for (const unit of part.units) xml = xml.replace(unit.marker, encodeXml(unit.translation || unit.source));
        zip.file(partName, xml);
      }
      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 7 } });
      atomicWrite(outputPath, buffer);
    }
  };
}

function boundsFromPoints(box) {
  const points = Array.isArray(box) ? box : [];
  const xs = points.map((point) => Number(point?.[0] || 0));
  const ys = points.map((point) => Number(point?.[1] || 0));
  const left = xs.length ? Math.min(...xs) : 0;
  const top = ys.length ? Math.min(...ys) : 0;
  const right = xs.length ? Math.max(...xs) : left + 1;
  const bottom = ys.length ? Math.max(...ys) : top + 1;
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function unionBounds(first, second) {
  const left = Math.min(first.left, second.left);
  const top = Math.min(first.top, second.top);
  const right = Math.max(first.left + first.width, second.left + second.width);
  const bottom = Math.max(first.top + first.height, second.top + second.height);
  return { left, top, width: right - left, height: bottom - top };
}

function horizontalOverlap(first, second) {
  const overlap = Math.max(0, Math.min(first.left + first.width, second.left + second.width) - Math.max(first.left, second.left));
  return overlap / Math.max(1, Math.min(first.width, second.width));
}

function mergeTextItemsIntoLines(items, pageWidth) {
  const rows = [];
  for (const item of [...items].sort((a, b) => a.top - b.top || a.left - b.left)) {
    const center = item.top + item.height / 2;
    let row = rows.find((candidate) => Math.abs(candidate.center - center) <= Math.max(candidate.height, item.height) * 0.58);
    if (!row) {
      row = { center, height: item.height, items: [] };
      rows.push(row);
    }
    row.items.push(item);
    row.center = row.items.reduce((sum, entry) => sum + entry.top + entry.height / 2, 0) / row.items.length;
    row.height = Math.max(row.height, item.height);
  }

  const lines = [];
  for (const [rowIndex, row] of rows.sort((a, b) => a.center - b.center).entries()) {
    const sorted = row.items.sort((a, b) => a.left - b.left);
    const segments = [];
    let line = null;
    for (const item of sorted) {
      const previousRight = line ? line.left + line.width : 0;
      const gap = item.left - previousRight;
      const averageGlyphWidth = item.width / Math.max(1, [...String(item.text || '')].length);
      const splitGap = Math.max(12, Math.max(line?.height || 0, item.height) * 1.82, averageGlyphWidth * 3.2, pageWidth * 0.018);
      if (!line || gap > splitGap) {
        if (line) segments.push(line);
        line = { ...item };
        continue;
      }
      const needsSpace = line.text && item.text
        && !/\s$/u.test(line.text)
        && !/^\s|^[,.;:!?，。；：！？、)\]}]/u.test(item.text)
        && gap > Math.max(0.8, item.height * 0.08);
      line.text += `${needsSpace ? ' ' : ''}${item.text}`;
      line = { ...unionBounds(line, item), text: line.text, fontSize: Math.max(line.fontSize, item.fontSize) };
    }
    if (line) segments.push(line);
    for (const [segmentIndex, segment] of segments.entries()) {
      lines.push({
        ...segment,
        rowId: rowIndex,
        rowSegmentIndex: segmentIndex,
        rowSegmentCount: segments.length
      });
    }
  }
  return lines.filter((line) => /[\p{L}\p{N}\p{Script=Han}]/u.test(line.text));
}

function groupLinesIntoParagraphs(lines) {
  const paragraphs = [];
  for (const line of [...lines].sort((a, b) => a.top - b.top || a.left - b.left)) {
    if (Number(line.rowSegmentCount || 1) > 1) {
      paragraphs.push({ lines: [line], ...line, kind: 'table-cell' });
      continue;
    }
    let selected = null;
    let selectedScore = Infinity;
    for (const paragraph of paragraphs) {
      if (paragraph.kind === 'table-cell') continue;
      const previous = paragraph.lines.at(-1);
      const gap = line.top - (previous.top + previous.height);
      const sameVisualRow = Math.abs((line.top + line.height / 2) - (previous.top + previous.height / 2)) < Math.max(line.height, previous.height) * 0.62;
      if (sameVisualRow || gap < -Math.max(line.height, previous.height) * 0.35) continue;
      if (gap > Math.max(line.height, previous.height) * 1.38 + 2.5) continue;
      if (paragraph.lines.length >= 16) continue;
      const overlap = horizontalOverlap(line, previous);
      const leftDelta = Math.abs(line.left - previous.left);
      if (overlap < 0.28 && leftDelta > Math.max(14, Math.max(line.height, previous.height) * 1.9)) continue;
      const sizeRatio = Math.min(line.fontSize, previous.fontSize) / Math.max(1, Math.max(line.fontSize, previous.fontSize));
      if (sizeRatio < 0.72) continue;
      const previousText = String(previous.text || '').trim();
      const currentText = String(line.text || '').trim();
      const paragraphBreak = gap > Math.max(line.height, previous.height) * 0.5
        && /[.!?。！？；;:]$/u.test(previousText)
        && (/^[\p{Lu}\p{Script=Han}]/u.test(currentText) || /^[-•●▪‣\d]+[.)、]/u.test(currentText));
      if (paragraphBreak) continue;
      const score = Math.max(0, gap) + leftDelta * 0.065 - overlap * 5;
      if (score < selectedScore) {
        selected = paragraph;
        selectedScore = score;
      }
    }
    if (!selected) {
      paragraphs.push({ lines: [line], ...line, kind: 'paragraph' });
      continue;
    }
    selected.lines.push(line);
    const merged = unionBounds(selected, line);
    Object.assign(selected, merged);
    selected.fontSize = Math.max(selected.fontSize, line.fontSize);
  }
  return paragraphs.map((paragraph) => ({
    ...paragraph,
    text: paragraph.lines.reduce((value, current, index) => {
      const text = String(current.text || '').trim();
      if (!text) return value;
      if (index === 0 || !value) return text;
      const separator = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(value)
        || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)
        ? ''
        : ' ';
      return `${value}${separator}${text}`;
    }, '').trim()
  })).filter((paragraph) => paragraph.text);
}

function assignParagraphFlowSpace(paragraphs, pageHeight) {
  for (const paragraph of paragraphs) {
    paragraph.drawHeight = paragraph.height;
    if (paragraph.kind === 'table-cell') continue;
    const bottom = paragraph.top + paragraph.height;
    let nextTop = Math.min(pageHeight - 5, paragraph.top + paragraph.height * 2.55);
    for (const candidate of paragraphs) {
      if (candidate === paragraph || candidate.top < bottom - 1) continue;
      if (horizontalOverlap(paragraph, candidate) < .22) continue;
      nextTop = Math.min(nextTop, candidate.top - 1.5);
    }
    paragraph.drawHeight = Math.max(paragraph.height, nextTop - paragraph.top);
  }
  return paragraphs;
}

function sampleCanvasBackground(context, bounds, scale = 1) {
  const canvas = context.canvas;
  const margin = Math.max(2, Math.round(2.5 * scale));
  const left = Math.max(0, Math.floor(bounds.left * scale) - margin);
  const top = Math.max(0, Math.floor(bounds.top * scale) - margin);
  const right = Math.min(canvas.width, Math.ceil((bounds.left + bounds.width) * scale) + margin);
  const bottom = Math.min(canvas.height, Math.ceil((bounds.top + bounds.height) * scale) + margin);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const pixels = context.getImageData(left, top, width, height).data;
  const buckets = new Map();
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 1800)));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const offset = (y * width + x) * 4;
      if (pixels[offset + 3] < 220) continue;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const key = `${red >> 4},${green >> 4},${blue >> 4}`;
      const bucket = buckets.get(key) || { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += 1;
      bucket.red += red;
      bucket.green += green;
      bucket.blue += blue;
      buckets.set(key, bucket);
    }
  }
  const selected = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  if (!selected) return [1, 1, 1];
  return [selected.red, selected.green, selected.blue].map((value) => value / selected.count / 255);
}

function layoutUnit(paragraph, pageNumber, pageWidth, pageHeight, index, background = null) {
  return {
    id: `page-${pageNumber}-block-${index + 1}`,
    pageNumber,
    source: paragraph.text,
    translation: '',
    kind: paragraph.kind || 'paragraph',
    layout: {
      left: Math.max(0, paragraph.left / Math.max(1, pageWidth)),
      top: Math.max(0, paragraph.top / Math.max(1, pageHeight)),
      width: Math.min(1, paragraph.width / Math.max(1, pageWidth)),
      height: Math.min(1, paragraph.height / Math.max(1, pageHeight)),
      drawHeight: Math.min(1, Math.max(paragraph.height, paragraph.drawHeight || paragraph.height) / Math.max(1, pageHeight)),
      fontSize: Math.max(0.004, paragraph.fontSize / Math.max(1, pageHeight)),
      background,
      kind: paragraph.kind || 'paragraph',
      lineCount: Array.isArray(paragraph.lines) ? paragraph.lines.length : 1
    }
  };
}

const PDF_FONT_CANDIDATES = Object.freeze({
  zh: ['simhei.ttf', 'segoeui.ttf'],
  'zh-Hant': ['simhei.ttf', 'segoeui.ttf'],
  yue: ['simhei.ttf', 'segoeui.ttf'],
  ja: ['simhei.ttf', 'segoeui.ttf'],
  ko: ['malgun.ttf', 'simhei.ttf'],
  th: ['LeelawUI.ttf', 'tahoma.ttf'],
  my: ['mmrtext.ttf', 'segoeui.ttf'],
  bo: ['himalaya.ttf', 'simhei.ttf'],
  mn: ['monbaiti.ttf', 'segoeui.ttf'],
  hi: ['NirmalaS.ttf', 'Nirmala.ttf', 'segoeui.ttf'],
  bn: ['NirmalaS.ttf', 'Nirmala.ttf', 'segoeui.ttf'],
  gu: ['NirmalaS.ttf', 'Nirmala.ttf', 'segoeui.ttf'],
  te: ['NirmalaS.ttf', 'Nirmala.ttf', 'segoeui.ttf'],
  mr: ['NirmalaS.ttf', 'Nirmala.ttf', 'segoeui.ttf'],
  ta: ['NirmalaS.ttf', 'Nirmala.ttf', 'segoeui.ttf'],
  km: ['LeelawUI.ttf', 'segoeui.ttf']
});

function resolvePdfFont(targetLanguage) {
  const fontDirectory = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts');
  const candidates = PDF_FONT_CANDIDATES[targetLanguage] || ['segoeui.ttf', 'arial.ttf'];
  for (const fileName of candidates) {
    const candidate = path.join(fontDirectory, fileName);
    if (fs.existsSync(candidate)) return candidate;
  }
  const fallback = path.join(fontDirectory, 'arial.ttf');
  if (fs.existsSync(fallback)) return fallback;
  throw new Error('系统中没有找到可用于生成译文 PDF 的字体');
}

function safeFontText(font, value) {
  let output = '';
  for (const character of String(value || '').normalize('NFC')) {
    if (character === '\r') continue;
    if (character === '\n') {
      output += character;
      continue;
    }
    try {
      font.encodeText(character);
      output += character;
    } catch {
      output += '□';
    }
  }
  return output;
}

function wrapPdfText(value, font, size, maximumWidth) {
  const lines = [];
  let current = '';
  let lastBreak = -1;
  const pushCurrent = () => {
    lines.push(current.trimEnd());
    current = '';
    lastBreak = -1;
  };
  for (const character of `${value}\n`) {
    if (character === '\n') {
      pushCurrent();
      continue;
    }
    const candidate = current + character;
    if (!current || font.widthOfTextAtSize(candidate, size) <= maximumWidth) {
      current = candidate;
      if (/\s/u.test(character)) lastBreak = current.length - 1;
      continue;
    }
    if (lastBreak > 0) {
      lines.push(current.slice(0, lastBreak).trimEnd());
      current = `${current.slice(lastBreak + 1)}${character}`.trimStart();
    } else {
      pushCurrent();
      current = character;
    }
    lastBreak = -1;
    for (let index = 0; index < current.length; index += 1) {
      if (/\s/u.test(current[index])) lastBreak = index;
    }
  }
  return lines.length ? lines : [''];
}

function fitPdfText(value, font, preferredSize, width, height) {
  let size = Math.max(4.2, Math.min(22, preferredSize));
  let lines = [];
  while (size >= 3.2) {
    lines = wrapPdfText(value, font, size, width);
    if (lines.length * size * 1.16 <= height) return { size, lines, lineHeight: size * 1.16 };
    size -= 0.35;
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    lines = wrapPdfText(value, font, size, width);
    size = Math.max(2.2, Math.min(size, height / Math.max(1, lines.length * 1.16)));
  }
  lines = wrapPdfText(value, font, size, width);
  return { size, lines, lineHeight: size * 1.16 };
}

function scrubCanvasTextUnit(context, unit, pageWidth, pageHeight) {
  if (!unit.layout) return;
  const scaleX = context.canvas.width / Math.max(1, pageWidth);
  const scaleY = context.canvas.height / Math.max(1, pageHeight);
  const fontSize = unit.layout.fontSize * pageHeight;
  const tableCell = unit.layout.kind === 'table-cell';
  const horizontalPadding = tableCell
    ? Math.max(.35, Math.min(1.15, fontSize * .06))
    : Math.max(1.5, Math.min(4.4, fontSize * 0.2));
  const verticalPadding = tableCell
    ? Math.max(.25, Math.min(.85, fontSize * .045))
    : Math.max(1.2, Math.min(3.5, fontSize * 0.16));
  const left = (unit.layout.left * pageWidth - horizontalPadding) * scaleX;
  const top = (unit.layout.top * pageHeight - verticalPadding) * scaleY;
  const width = (unit.layout.width * pageWidth + horizontalPadding * 2) * scaleX;
  const height = (unit.layout.height * pageHeight + verticalPadding * 2) * scaleY;
  const background = Array.isArray(unit.layout.background) ? unit.layout.background : [1, 1, 1];
  const channels = background.map((value) => Math.max(0, Math.min(255, Math.round(value * 255))));
  context.save();
  context.fillStyle = `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
  context.fillRect(left, top, width, height);
  context.restore();
}

function drawPdfTextUnit(page, unit, font) {
  if (!unit.layout) return;
  const text = String(unit.translation || unit.source).trim();
  if (!text) return;
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const drawHeight = Math.max(unit.layout.height, Number(unit.layout.drawHeight || 0));
  const box = {
    x: unit.layout.left * pageWidth,
    y: pageHeight - (unit.layout.top + drawHeight) * pageHeight,
    width: Math.max(8, unit.layout.width * pageWidth),
    height: Math.max(6, drawHeight * pageHeight)
  };
  const drawable = safeFontText(font, text);
  const fitted = fitPdfText(
    drawable,
    font,
    unit.layout.fontSize * pageHeight * 0.96,
    Math.max(4, box.width),
    Math.max(4, box.height)
  );
  let baseline = box.y + box.height - fitted.size;
  for (const line of fitted.lines) {
    if (line) {
      page.drawText(line, {
        x: box.x,
        y: baseline,
        size: fitted.size,
        font,
        color: rgb(0.075, 0.12, 0.21),
        opacity: 1,
        maxWidth: box.width
      });
    }
    baseline -= fitted.lineHeight;
  }
}

function createPdfPreparedDocument(inputPath, units, mode = 'text') {
  return {
    units,
    async write(outputPath, metadata) {
      const { createCanvas } = require('@napi-rs/canvas');
      const pdf = await PDFDocument.create();
      pdf.registerFontkit(fontkit);
      const fontPath = resolvePdfFont(metadata.targetLanguage);
      const font = await pdf.embedFont(fs.readFileSync(fontPath), { subset: true });
      const { loadingTask, document } = await openPdf(inputPath);
      try {
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const sourcePage = await document.getPage(pageNumber);
          const baseViewport = sourcePage.getViewport({ scale: 1 });
          const renderScale = Math.max(1.5, Math.min(2.25, 3000 / Math.max(baseViewport.width, baseViewport.height)));
          const renderViewport = sourcePage.getViewport({ scale: renderScale });
          const canvas = createCanvas(Math.ceil(renderViewport.width), Math.ceil(renderViewport.height));
          const context = canvas.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await sourcePage.render({ canvas, canvasContext: context, viewport: renderViewport, background: '#ffffff' }).promise;
          const pageUnits = units.filter((unit) => unit.pageNumber === pageNumber);
          for (const unit of pageUnits) scrubCanvasTextUnit(context, unit, baseViewport.width, baseViewport.height);
          const pageImage = await pdf.embedPng(canvas.toBuffer('image/png'));
          const outputPage = pdf.addPage([baseViewport.width, baseViewport.height]);
          outputPage.drawImage(pageImage, {
            x: 0,
            y: 0,
            width: baseViewport.width,
            height: baseViewport.height
          });
          for (const unit of pageUnits) drawPdfTextUnit(outputPage, unit, font);
          sourcePage.cleanup();
        }
      } finally {
        await loadingTask.destroy();
      }
      pdf.setTitle(`${metadata.name} · 译澜译文`);
      pdf.setSubject(`${metadata.direction} · ${mode === 'ocr' ? '扫描页 OCR' : '原版式文本层'}翻译`);
      pdf.setProducer('译澜 Yilan Offline Translation');
      const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
      atomicWrite(outputPath, Buffer.from(bytes));
    }
  };
}

async function openPdf(inputPath) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buffer = fs.readFileSync(inputPath);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: false
  });
  return { pdfjs, loadingTask, document: await loadingTask.promise };
}

async function preparePdfDocument(inputPath) {
  const { pdfjs, loadingTask, document } = await openPdf(inputPath);
  const { createCanvas } = require('@napi-rs/canvas');
  const units = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = (content.items || []).map((item) => {
        const text = String(item.str || '').trim();
        if (!text) return null;
        const transform = pdfjs.Util.transform(viewport.transform, item.transform);
        const fontSize = Math.max(4, Math.hypot(transform[2], transform[3]) || Number(item.height) || 8);
        return {
          text,
          left: transform[4],
          top: transform[5] - fontSize * 0.88,
          width: Math.max(fontSize * 0.3, Math.abs(Number(item.width || 0) * viewport.scale)),
          height: fontSize * 1.05,
          fontSize
        };
      }).filter(Boolean);
      const lines = mergeTextItemsIntoLines(items, viewport.width);
      const paragraphs = assignParagraphFlowSpace(groupLinesIntoParagraphs(lines), viewport.height);
      const sampleScale = 1.25;
      const renderViewport = page.getViewport({ scale: sampleScale });
      const canvas = createCanvas(Math.ceil(renderViewport.width), Math.ceil(renderViewport.height));
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport: renderViewport, background: '#ffffff' }).promise;
      units.push(...paragraphs.map((paragraph, index) => layoutUnit(
        paragraph,
        pageNumber,
        viewport.width,
        viewport.height,
        index,
        sampleCanvasBackground(context, paragraph, sampleScale)
      )));
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  if (units.length === 0) throw new Error('这个 PDF 没有可读取的文本层，请重新导入并勾选“扫描型 PDF”');
  return createPdfPreparedDocument(inputPath, units, 'text');
}

async function prepareScannedPdfDocument(inputPath, options) {
  if (!options.ocr) throw new Error('扫描 PDF OCR 组件未就绪');
  const { createCanvas } = require('@napi-rs/canvas');
  fs.mkdirSync(options.cacheDirectory, { recursive: true });
  const taskDirectory = fs.mkdtempSync(path.join(options.cacheDirectory, 'scan-'));
  const { loadingTask, document } = await openPdf(inputPath);
  const units = [];
  try {
    options.onStart?.(document.numPages);
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      await options.waitIfPaused?.();
      if (options.signal?.aborted) throw options.signal.reason || new Error('扫描 PDF 任务已取消');
      const page = await document.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.max(1.8, Math.min(3.2, 2400 / Math.max(1, baseViewport.width)));
      const viewport = page.getViewport({ scale });
      const width = Math.max(1, Math.ceil(viewport.width));
      const height = Math.max(1, Math.ceil(viewport.height));
      const canvas = createCanvas(width, height);
      const context = canvas.getContext('2d');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      await page.render({ canvas, canvasContext: context, viewport, background: '#ffffff' }).promise;
      const imagePath = path.join(taskDirectory, `page-${String(pageNumber).padStart(4, '0')}.png`);
      fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
      let ocrResult = null;
      try {
        ocrResult = await options.ocr.recognize(
          imagePath,
          options.sourceLanguage,
          options.signal,
          { fusion: options.sourceLanguage === 'auto' }
        );
      } catch (error) {
        if (!/没有识别到文字|没有找到文字|empty/i.test(String(error?.message || error))) throw error;
        options.onWarning?.(`第 ${pageNumber} 页没有识别到文字，已保留原页`);
      } finally {
        try { fs.unlinkSync(imagePath); } catch {}
      }
      const blocks = (ocrResult?.blocks || []).map((block) => {
        const bounds = boundsFromPoints(block.box);
        return {
          ...bounds,
          text: String(block.text || '').trim(),
          fontSize: Math.max(6, bounds.height * 0.82)
        };
      }).filter((block) => block.text);
      const paragraphs = assignParagraphFlowSpace(groupLinesIntoParagraphs(blocks), height);
      units.push(...paragraphs.map((paragraph, index) => layoutUnit(
        paragraph,
        pageNumber,
        width,
        height,
        index,
        sampleCanvasBackground(context, paragraph)
      )));
      const source = paragraphs.map((paragraph) => paragraph.text).join('\n').trim();
      page.cleanup();
      options.onPage?.({
        pageNumber,
        totalPages: document.numPages,
        source,
        modelLabel: ocrResult?.modelLabel || '本地 OCR'
      });
    }
  } finally {
    await loadingTask.destroy();
    try { fs.rmdirSync(taskDirectory); } catch {}
  }
  if (units.length === 0) throw new Error('扫描 PDF 中没有识别到可翻译文字，请确认语言方向或文档清晰度');
  return createPdfPreparedDocument(inputPath, units, 'ocr');
}

function prepareTextDocument(inputPath, markdown) {
  const metadata = readTextFile(inputPath);
  const pieces = textPieces(metadata.text, markdown);
  const units = pieces.filter((piece) => piece.translate).map((piece) => ({
    id: crypto.randomUUID(), source: piece.value.trim(), translation: '', piece
  }));
  if (units.length === 0) throw new Error('文档中没有可翻译的文字');
  return {
    units,
    async write(outputPath) {
      const content = pieces.map((piece) => {
        if (!piece.translate) return piece.value;
        const unit = units.find((item) => item.piece === piece);
        const leading = piece.value.match(/^\s*/)?.[0] || '';
        const trailing = piece.value.match(/\s*$/)?.[0] || '';
        return `${leading}${unit?.translation || unit?.source || piece.value.trim()}${trailing}`;
      }).join('');
      atomicWrite(outputPath, encodeTextFile(content, metadata));
    }
  };
}

class DocumentTranslationService {
  constructor(options) {
    this.translate = options.translate;
    this.ocr = options.ocr || null;
    this.cacheDirectory = options.cacheDirectory || path.join(require('node:os').tmpdir(), 'yilan-pdf-ocr');
    this.onUpdate = options.onUpdate || (() => {});
    this.log = options.log || (() => {});
    this.tasks = new Map();
  }

  static inspect(filePath) {
    const absolute = path.resolve(String(filePath || ''));
    const extension = extensionOf(absolute);
    if (!SUPPORTED_EXTENSIONS.has(extension)) throw new Error('目前支持 TXT、Markdown、DOCX、PPTX、XLSX 和 PDF');
    const stat = fs.statSync(absolute);
    if (!stat.isFile()) throw new Error('请选择一个文档文件');
    return {
      path: absolute,
      name: path.basename(absolute),
      size: stat.size,
      modifiedAt: stat.mtimeMs,
      extension,
      format: formatLabel(extension)
    };
  }

  start(filePath, options) {
    const file = DocumentTranslationService.inspect(filePath);
    const task = {
      id: crypto.randomUUID(),
      file,
      sourceLanguage: options.sourceLanguage || 'auto',
      targetLanguage: options.targetLanguage || 'en',
      scannedPdf: file.extension === '.pdf' && Boolean(options.scannedPdf),
      status: 'running',
      phase: 'analyzing',
      phaseLabel: PHASE_LABELS.analyzing,
      total: 0,
      completed: 0,
      progress: 0,
      startedAt: Date.now(),
      outputPath: null,
      error: null,
      warnings: [],
      preview: [],
      paused: false,
      resumeWaiters: [],
      controller: new AbortController()
    };
    this.tasks.set(task.id, task);
    this.emit(task);
    void this.run(task);
    return this.snapshot(task);
  }

  pause(id) {
    const task = this.requireTask(id);
    if (task.status !== 'running') return this.snapshot(task);
    task.paused = true;
    task.status = 'paused';
    task.phaseLabel = PHASE_LABELS.paused;
    this.emit(task);
    return this.snapshot(task);
  }

  resume(id) {
    const task = this.requireTask(id);
    if (task.status !== 'paused') return this.snapshot(task);
    task.paused = false;
    task.status = 'running';
    task.phaseLabel = PHASE_LABELS[task.phase] || '继续翻译';
    for (const resolve of task.resumeWaiters.splice(0)) resolve();
    this.emit(task);
    return this.snapshot(task);
  }

  cancel(id) {
    const task = this.requireTask(id);
    if (['completed', 'failed', 'cancelled'].includes(task.status)) return this.snapshot(task);
    task.controller.abort(new Error('文档任务已取消'));
    task.paused = false;
    for (const resolve of task.resumeWaiters.splice(0)) resolve();
    task.status = 'cancelled';
    task.phase = 'cancelled';
    task.phaseLabel = PHASE_LABELS.cancelled;
    this.emit(task);
    return this.snapshot(task);
  }

  get(id) {
    return this.snapshot(this.requireTask(id));
  }

  requireTask(id) {
    const task = this.tasks.get(id);
    if (!task) throw new Error('没有找到这个文档任务');
    return task;
  }

  async waitIfPaused(task) {
    while (task.paused && !task.controller.signal.aborted) {
      await new Promise((resolve) => task.resumeWaiters.push(resolve));
    }
    if (task.controller.signal.aborted) throw task.controller.signal.reason || new Error('文档任务已取消');
  }

  setPhase(task, phase) {
    task.phase = phase;
    task.phaseLabel = PHASE_LABELS[phase] || phase;
    this.emit(task);
  }

  async prepare(task) {
    const extension = task.file.extension;
    if (extension === '.txt') return prepareTextDocument(task.file.path, false);
    if (extension === '.md' || extension === '.markdown') return prepareTextDocument(task.file.path, true);
    if (['.docx', '.pptx', '.xlsx'].includes(extension)) return prepareOfficeDocument(task.file.path, extension);
    if (extension === '.pdf' && task.scannedPdf) {
      this.setPhase(task, 'ocr');
      return prepareScannedPdfDocument(task.file.path, {
        ocr: this.ocr,
        cacheDirectory: this.cacheDirectory,
        sourceLanguage: task.sourceLanguage,
        signal: task.controller.signal,
        waitIfPaused: () => this.waitIfPaused(task),
        onStart: (totalPages) => {
          task.total = totalPages;
          task.completed = 0;
          task.progress = 0.02;
          this.emit(task);
        },
        onPage: ({ pageNumber, totalPages, source, modelLabel }) => {
          task.completed = pageNumber;
          task.progress = 0.02 + (pageNumber / Math.max(1, totalPages)) * 0.28;
          if (source) {
            task.preview = [...task.preview, {
              source,
              translation: `第 ${pageNumber} 页 OCR 完成 · ${modelLabel}`
            }].slice(-12);
          }
          this.emit(task);
        },
        onWarning: (warning) => {
          task.warnings = [...task.warnings, warning].slice(-20);
          this.emit(task);
        }
      });
    }
    if (extension === '.pdf') return preparePdfDocument(task.file.path);
    throw new Error('暂不支持这个文档格式');
  }

  async translateUnit(task, source) {
    const chunks = splitLongText(source);
    const translations = [];
    for (const chunk of chunks) {
      await this.waitIfPaused(task);
      const protectedText = protectText(chunk);
      let result = await this.translate(protectedText.value, task.sourceLanguage, task.targetLanguage, {
        priority: 10,
        signal: task.controller.signal,
        mode: 'document'
      });
      let translated = String(result.text || '').trim();
      if (!protectedText.valid(translated)) {
        result = await this.translate(protectedText.value, task.sourceLanguage, task.targetLanguage, {
          priority: 10,
          signal: task.controller.signal,
          mode: 'document-strict'
        });
        translated = String(result.text || '').trim();
      }
      translations.push(protectedText.restore(translated));
    }
    return translations.join('\n');
  }

  async translateBatch(task, units) {
    if (units.length < 2) return false;
    const markerPrefix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const markers = units.slice(1).map((_unit, index) => `⟦YILAN_SEG_${markerPrefix}_${String(index + 1).padStart(3, '0')}⟧`);
    const combined = units.map((unit, index) => `${index ? `${markers[index - 1]}\n` : ''}${unit.source}`).join('\n');
    const protectedText = protectText(combined);
    const request = async (mode) => {
      const result = await this.translate(protectedText.value, task.sourceLanguage, task.targetLanguage, {
        priority: 10,
        signal: task.controller.signal,
        mode
      });
      return String(result.text || '').trim();
    };
    await this.waitIfPaused(task);
    let translated = await request('document');
    if (!protectedText.valid(translated) || markers.some((marker) => !translated.includes(marker))) {
      translated = await request('document-strict');
    }
    if (!protectedText.valid(translated) || markers.some((marker) => !translated.includes(marker))) return false;
    const restored = protectedText.restore(translated);
    const pieces = [];
    let cursor = 0;
    for (const marker of markers) {
      const boundary = restored.indexOf(marker, cursor);
      if (boundary < 0) return false;
      pieces.push(restored.slice(cursor, boundary).trim());
      cursor = boundary + marker.length;
    }
    pieces.push(restored.slice(cursor).trim());
    if (pieces.length !== units.length || pieces.some((piece) => !piece)) return false;
    units.forEach((unit, index) => { unit.translation = pieces[index]; });
    return true;
  }

  translationBatches(units) {
    const batches = [];
    let current = [];
    let length = 0;
    const flush = () => {
      if (current.length) batches.push(current);
      current = [];
      length = 0;
    };
    for (const unit of units) {
      const unitLength = String(unit.source || '').length;
      if (unitLength > 1250) {
        flush();
        batches.push([unit]);
        continue;
      }
      if (current.length >= 10 || length + (current.length ? 32 : 0) + unitLength > 1550) flush();
      const markerAllowance = current.length ? 32 : 0;
      current.push(unit);
      length += markerAllowance + unitLength;
    }
    flush();
    return batches;
  }

  recordTranslatedUnits(task, units, translationBase, translationSpan) {
    for (const unit of units) {
      task.completed += 1;
      task.preview = [...task.preview, { source: unit.source, translation: unit.translation }].slice(-100);
    }
    task.progress = translationBase + (task.completed / Math.max(1, task.total)) * translationSpan;
    this.emit(task);
  }

  async run(task) {
    try {
      this.setPhase(task, 'parsing');
      const prepared = await this.prepare(task);
      task.total = prepared.units.length;
      task.completed = 0;
      task.preview = [];
      const translationBase = task.scannedPdf ? 0.32 : 0.04;
      const translationSpan = task.scannedPdf ? 0.63 : 0.9;
      task.progress = translationBase;
      this.setPhase(task, 'translating');
      const batches = prepared.batchable ? this.translationBatches(prepared.units) : prepared.units.map((unit) => [unit]);
      for (const batch of batches) {
        await this.waitIfPaused(task);
        const translatedAsBatch = batch.length > 1 && await this.translateBatch(task, batch);
        if (!translatedAsBatch) {
          for (const unit of batch) {
            await this.waitIfPaused(task);
            unit.translation = await this.translateUnit(task, unit.source);
          }
        }
        this.recordTranslatedUnits(task, batch, translationBase, translationSpan);
      }

      await this.waitIfPaused(task);
      this.setPhase(task, 'writing');
      const forcedExtension = task.file.extension === '.pdf' ? '.pdf' : task.file.extension;
      task.outputPath = uniqueOutputPath(task.file.path, task.targetLanguage, forcedExtension);
      await prepared.write(task.outputPath, {
        name: task.file.name,
        direction: `${task.sourceLanguage === 'auto' ? '自动检测' : task.sourceLanguage} → ${task.targetLanguage}`,
        targetLanguage: task.targetLanguage
      });
      task.status = 'completed';
      task.phase = 'completed';
      task.phaseLabel = PHASE_LABELS.completed;
      task.progress = 1;
      this.emit(task);
    } catch (error) {
      if (task.status === 'cancelled' || task.controller.signal.aborted) return;
      task.status = 'failed';
      task.phase = 'failed';
      task.phaseLabel = PHASE_LABELS.failed;
      task.error = error?.message || String(error);
      this.log(`文档任务失败 ${task.id}: ${error?.stack || error}`);
      this.emit(task);
    }
  }

  snapshot(task) {
    if (!task) return null;
    return {
      id: task.id,
      file: {
        name: task.file.name,
        size: task.file.size,
        extension: task.file.extension,
        format: task.file.format
      },
      sourceLanguage: task.sourceLanguage,
      targetLanguage: task.targetLanguage,
      scannedPdf: task.scannedPdf,
      status: task.status,
      phase: task.phase,
      phaseLabel: task.phaseLabel,
      total: task.total,
      completed: task.completed,
      progress: task.progress,
      elapsedMs: Date.now() - task.startedAt,
      outputPath: task.outputPath,
      error: task.error,
      warnings: task.warnings,
      preview: task.preview
    };
  }

  emit(task) {
    this.onUpdate(this.snapshot(task));
  }

  dispose() {
    for (const task of this.tasks.values()) {
      if (!['completed', 'failed', 'cancelled'].includes(task.status)) this.cancel(task.id);
    }
  }
}

module.exports = { DocumentTranslationService, SUPPORTED_EXTENSIONS };
