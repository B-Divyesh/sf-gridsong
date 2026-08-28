const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { expiredFilter, validNickname, validSong } = require('../src/validation.js');
const root = join(__dirname, '..', '..');

function compactSong() {
  // v1, one bar, one octave, major scale, 120 BPM, no title, and 144 empty cells.
  const bytes = Buffer.alloc(61);
  bytes.set([1, 1, 1, 0, 70, 0, 0]);
  return `GS2S.${bytes.toString('base64url')}`;
}

test('accepts only a structurally complete compact Gridsong payload', () => {
  const song = compactSong();
  assert.equal(validSong(song), true);
  assert.equal(validSong(`${song}x`), false);
  assert.equal(validSong('GS2S.not-a-song'), false);
  assert.equal(validSong(''), false);
});

test('normalizes classroom aliases without retaining unsafe names', () => {
  assert.equal(validNickname('  Blue   Fox  '), 'Blue Fox');
  assert.equal(validNickname(''), null);
  assert.equal(validNickname('A\u0000B'), null);
  assert.equal(validNickname('x'.repeat(25)), null);
});

test('writes expiry filters as Azure Table Int64 literals', () => {
  assert.equal(expiredFilter(1_787_869_704_215.9), 'expiresAt le 1787869704215L');
});

test('production deployment contract ships the Function API with the static app', async () => {
  const deployment = JSON.parse(await readFile(join(root, 'swa-cli.config.json'), 'utf8'));
  const staticConfig = JSON.parse(await readFile(join(root, 'public/staticwebapp.config.json'), 'utf8'));
  const production = deployment.configurations.production;
  assert.deepEqual(
    { appLocation: production.appLocation, outputLocation: production.outputLocation, apiLocation: production.apiLocation },
    { appLocation: '.', outputLocation: 'dist', apiLocation: 'api' }
  );
  assert.equal(production.appName, 'sf-gridsong');
  assert.equal(production.apiVersion, '22');
  assert.equal(staticConfig.platform.apiRuntime, 'node:22');
});

test('managed Static Web Apps API uses HTTP-only expiry cleanup', async () => {
  const source = await readFile(join(__dirname, '..', 'src', 'functions', 'gallery.js'), 'utf8');
  assert.match(source, /async function cleanExpired/);
  assert.match(source, /await cleanExpired\(client\)/);
  assert.doesNotMatch(source, /app\.timer\(/);
  assert.match(source, /request\.params\.id/);
  assert.doesNotMatch(source, /context\.bindingData/);
});

test('the managed Functions entry is an explicit CommonJS bootstrap', async () => {
  const manifest = JSON.parse(await readFile(join(__dirname, '..', 'package.json'), 'utf8'));
  const entry = join(__dirname, '..', manifest.main);
  const source = await readFile(entry, 'utf8');
  assert.equal(manifest.type, undefined);
  assert.equal(manifest.main, 'src/index.js');
  assert.match(source, /require\('\.\/functions\/gallery\.js'\)/);
  assert.doesNotMatch(source, /^\s*import\s/m);
  const boot = spawnSync(process.execPath, ['-e', "require('./src/index.js')"], {
    cwd: join(__dirname, '..'),
    encoding: 'utf8'
  });
  assert.equal(boot.status, 0, boot.stderr);
});
