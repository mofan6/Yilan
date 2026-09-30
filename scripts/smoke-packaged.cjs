const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const executable = path.join(projectRoot, 'app', 'dist', 'win-unpacked', 'Yilan.exe');
const debuggingPort = 18084;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForPage() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
      const pages = await response.json();
      const page = pages.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch {}
    await delay(250);
  }
  throw new Error('Packaged renderer did not expose a debugging page');
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  return {
    call(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() { socket.close(); }
  };
}

async function main() {
  const child = spawn(executable, [`--remote-debugging-port=${debuggingPort}`], {
    cwd: path.dirname(executable),
    windowsHide: true,
    stdio: 'ignore'
  });
  let client;
  try {
    const page = await waitForPage();
    client = await connect(page.webSocketDebuggerUrl);
    const expression = `(async () => window.offlineTranslator.translate(${JSON.stringify({
      text: 'Bonjour, ce logiciel fonctionne entièrement hors ligne.',
      sourceLanguage: 'auto',
      targetLanguage: 'zh'
    })}))()`;
    const response = await client.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || 'Renderer exception');
    const result = response.result?.value;
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result?.detectedSourceLanguage !== 'fr') throw new Error(`Expected fr, received ${result?.detectedSourceLanguage}`);
    if (!/[\u3400-\u9fff]/u.test(result?.text || '')) throw new Error('Packaged model did not return Chinese text');
    await client.call('Runtime.evaluate', {
      expression: `window.offlineTranslator.windowControl('close')`,
      awaitPromise: false
    }).catch(() => {});
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      delay(10000)
    ]);
  } finally {
    client?.close();
    if (child.exitCode === null) child.kill();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
