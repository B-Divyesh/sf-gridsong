const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const { MAX_SUBMISSIONS, reserveSubmissionSlot, slotNumber } = require('../src/capacity.js');
const { FULL_GALLERY_RETRY_AFTER_SECONDS, GALLERY_RETENTION_DAYS, GALLERY_RETENTION_MS } = require('../src/policy.js');
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

test('atomically admits at most 120 concurrent gallery submissions', async () => {
  const rows = new Map();
  const client = {
    async createEntity(entity) {
      await Promise.resolve();
      if (rows.has(entity.rowKey)) {
        const error = new Error('An entity already exists in this slot.');
        error.statusCode = 409;
        throw error;
      }
      rows.set(entity.rowKey, entity);
    },
    async *listEntities() { yield* rows.values(); }
  };
  const gallery = { partitionKey: 'gallery-qa', expiresAt: Date.now() + 60_000 };
  const outcomes = await Promise.all(Array.from({ length: MAX_SUBMISSIONS + 1 }, (_, index) => reserveSubmissionSlot(client, gallery, {
    nickname: `QA ${index}`,
    song: compactSong(),
    createdAt: Date.now()
  })));

  assert.equal(outcomes.filter(Boolean).length, MAX_SUBMISSIONS);
  assert.equal(outcomes.filter(value => !value).length, 1);
  assert.equal(rows.size, MAX_SUBMISSIONS);
  assert.deepEqual([...rows.keys()].map(slotNumber).sort((left, right) => left - right), Array.from({ length: MAX_SUBMISSIONS }, (_, index) => index));
});

test('fixed slots preserve the 120-song bound for legacy UUID submissions', async () => {
  const rows = new Map(Array.from({ length: 119 }, (_, index) => [`00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, { kind: 'submission' }]));
  const client = {
    async createEntity(entity) {
      if (rows.has(entity.rowKey)) {
        const error = new Error('An entity already exists in this slot.');
        error.statusCode = 409;
        throw error;
      }
      rows.set(entity.rowKey, entity);
    },
    async *listEntities() {
      for (const [rowKey, value] of rows) yield { rowKey, ...value };
    }
  };
  const gallery = { partitionKey: 'gallery-legacy', expiresAt: Date.now() + 60_000 };
  const first = await reserveSubmissionSlot(client, gallery, { nickname: 'QA first', song: compactSong(), createdAt: Date.now() });
  const second = await reserveSubmissionSlot(client, gallery, { nickname: 'QA second', song: compactSong(), createdAt: Date.now() });

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(rows.size, MAX_SUBMISSIONS);
});

test('@claim:gallery-retention class boards retain only the documented 90-day lifetime', () => {
  assert.equal(GALLERY_RETENTION_DAYS, 90);
  assert.equal(GALLERY_RETENTION_MS, 90 * 24 * 60 * 60 * 1000);
});

test('@claim:gallery-capacity a full board returns a retryable 429 with Retry-After', () => {
  const { fullGalleryResponse } = require('../src/functions/gallery.js');
  const response = fullGalleryResponse();
  assert.equal(response.status, 429);
  assert.equal(response.jsonBody.error, 'This class gallery is full. Ask your teacher to make a new board.');
  assert.equal(response.headers['retry-after'], String(FULL_GALLERY_RETRY_AFTER_SECONDS));
  assert.equal(response.headers['cache-control'], 'no-store');
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
  const serviceWorkerRoute = staticConfig.routes.find(route => route.route === '/sw.js');
  assert.equal(serviceWorkerRoute?.headers?.['Cache-Control'], 'no-cache');
});

test('managed Static Web Apps API uses HTTP-only expiry cleanup', async () => {
  const source = await readFile(join(__dirname, '..', 'src', 'functions', 'gallery.js'), 'utf8');
  assert.match(source, /async function cleanExpired/);
  assert.match(source, /await cleanExpired\(client\)/);
  assert.doesNotMatch(source, /app\.timer\(/);
  assert.match(source, /request\.params\.id/);
  assert.doesNotMatch(source, /context\.bindingData/);
});

test('gallery admission does not trust a caller supplied forwarding header', async () => {
  const source = await readFile(join(__dirname, '..', 'src', 'functions', 'gallery.js'), 'utf8');
  assert.doesNotMatch(source, /x-forwarded-for/i);
  assert.doesNotMatch(source, /rateLimit\(/);
  assert.match(source, /reserveSubmissionSlot/);
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
