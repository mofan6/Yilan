const fs = require('node:fs');
const path = require('node:path');

async function pipeFile(source, destination) {
  await new Promise((resolve, reject) => {
    const input = fs.createReadStream(source);
    input.once('error', reject);
    destination.once('error', reject);
    input.once('end', resolve);
    input.pipe(destination, { end: false });
  });
}

async function main() {
  const [, , stubPath, payloadPath, outputPath] = process.argv;
  if (!stubPath || !payloadPath || !outputPath) throw new Error('Usage: node compose-installer.cjs <stub> <payload> <output>');
  const stub = path.resolve(stubPath);
  const payload = path.resolve(payloadPath);
  const output = path.resolve(outputPath);
  const stubSize = fs.statSync(stub).size;
  const payloadSize = fs.statSync(payload).size;
  const footer = Buffer.alloc(32);
  footer.write('YILANPAYLOAD180!', 0, 'ascii');
  footer.writeBigInt64LE(BigInt(stubSize), 16);
  footer.writeBigInt64LE(BigInt(payloadSize), 24);
  const outputDirectory = path.dirname(output);
  if (!fs.existsSync(outputDirectory)) {
    await fs.promises.mkdir(outputDirectory, { recursive: true });
  }
  const destination = fs.createWriteStream(output, { flags: 'w' });
  await pipeFile(stub, destination);
  await pipeFile(payload, destination);
  await new Promise((resolve, reject) => destination.end(footer, (error) => error ? reject(error) : resolve()));
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
