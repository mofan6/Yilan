const endpoint = process.env.YILAN_TEST_ENDPOINT || 'http://127.0.0.1:18082/v1/chat/completions';
const apiKey = process.env.YILAN_TEST_API_KEY || 'yilan-test-local';

const languages = {
  zh: ['Chinese (Simplified)', '中文（简体）'], en: ['English', '英语'], fr: ['French', '法语'],
  pt: ['Portuguese', '葡萄牙语'], es: ['Spanish', '西班牙语'], ja: ['Japanese', '日语'],
  tr: ['Turkish', '土耳其语'], ru: ['Russian', '俄语'], ar: ['Arabic', '阿拉伯语'],
  ko: ['Korean', '韩语'], th: ['Thai', '泰语'], it: ['Italian', '意大利语'],
  de: ['German', '德语'], vi: ['Vietnamese', '越南语'], ms: ['Malay', '马来语'],
  id: ['Indonesian', '印尼语'], tl: ['Filipino', '菲律宾语'], hi: ['Hindi', '印地语'],
  'zh-Hant': ['Chinese (Traditional)', '繁体中文'], pl: ['Polish', '波兰语'], cs: ['Czech', '捷克语'],
  nl: ['Dutch', '荷兰语'], km: ['Khmer', '高棉语'], my: ['Burmese', '缅甸语'],
  fa: ['Persian', '波斯语'], gu: ['Gujarati', '古吉拉特语'], ur: ['Urdu', '乌尔都语'],
  te: ['Telugu', '泰卢固语'], mr: ['Marathi', '马拉地语'], he: ['Hebrew', '希伯来语'],
  bn: ['Bengali', '孟加拉语'], ta: ['Tamil', '泰米尔语'], uk: ['Ukrainian', '乌克兰语'],
  bo: ['Tibetan', '藏语'], kk: ['Kazakh', '哈萨克语'], mn: ['Mongolian', '蒙古语'],
  ug: ['Uyghur', '维吾尔语'], yue: ['Cantonese', '粤语']
};

async function complete(prompt, maxTokens, temperature = 0.7) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
      top_k: temperature === 0 ? 1 : 20,
      top_p: temperature === 0 ? 1 : 0.6,
      repeat_penalty: 1.05,
      stream: false
    })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() || '';
}

async function detect(text) {
  if (/[\u3040-\u30ff]/u.test(text)) return 'ja';
  if (/[\u0600-\u06ff]/u.test(text)) return 'ar';
  if (/[\u3400-\u4dbf\u4e00-\u9fff]/u.test(text)) return 'zh';
  const { franc } = await import('../app/node_modules/franc-min/index.js');
  const iso = franc(text, { minLength: 3, only: ['eng', 'fra', 'por', 'spa', 'tur', 'rus', 'ita', 'deu', 'vie', 'zlm', 'ind', 'tgl', 'pol', 'ces', 'nld'] });
  return ({ eng: 'en', fra: 'fr', por: 'pt', spa: 'es', tur: 'tr', rus: 'ru', ita: 'it', deu: 'de', vie: 'vi', zlm: 'ms', ind: 'id', tgl: 'tl', pol: 'pl', ces: 'cs', nld: 'nl' })[iso] || 'en';
}

async function translate(text, sourceCode, targetCode) {
  const [sourceName, sourceLabel] = languages[sourceCode];
  const [targetName, targetLabel] = languages[targetCode];
  return complete([
    `Source language: ${sourceName} (${sourceLabel})`,
    `Target language: ${targetName} (${targetLabel})`,
    `Translate the following segment into ${targetName}, without additional explanation.`,
    '',
    text
  ].join('\n'), 256);
}

async function main() {
  const cases = [
    { expected: 'fr', target: 'zh', text: 'Bonjour, comment allez-vous aujourd’hui ?' },
    { expected: 'ja', target: 'en', text: '今日は静かな一日です。' },
    { expected: 'zh', target: 'de', text: '这是一款完全离线运行的翻译软件。' },
    { expected: 'ar', target: 'en', text: 'هذا المترجم يعمل دون اتصال بالإنترنت.' }
  ];
  for (const sample of cases) {
    const detected = await detect(sample.text);
    const output = await translate(sample.text, sample.expected, sample.target);
    process.stdout.write(`${sample.expected}->${sample.target}\tdetect=${detected}\tresult=${output.replace(/\s+/g, ' ')}\n`);
    if (detected !== sample.expected) {
      throw new Error(`Detection mismatch for ${sample.expected}: ${detected}`);
    }
    if (!output) throw new Error(`Empty translation for ${sample.expected}->${sample.target}`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
