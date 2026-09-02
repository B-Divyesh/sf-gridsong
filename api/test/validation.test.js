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

test('@claim:student-pass-submit-only a submit key cannot satisfy the teacher-board read guard', async () => {
  const { activeGallery, galleryEntity, sameToken } = require('../src/functions/gallery.js');
  const teacherKey = 'teacher-key-0123456789_abcdef0123456789';
  const studentKey = 'student-key-0123456789_abcdef0123456789';
  const entity = galleryEntity('12345678-1234-4234-9234-123456789abc', 100, Date.now() + 60_000, teacherKey, studentKey);
  assert.equal(sameToken(teacherKey, entity.teacherKeyHash), true);
  assert.equal(sameToken(studentKey, entity.teacherKeyHash), false);

  const active = await activeGallery({ getEntity: async () => entity }, entity.partitionKey);
  assert.equal(active.response, undefined);
  const source = await readFile(join(__dirname, '..', 'src', 'functions', 'gallery.js'), 'utf8');
  assert.match(source, /sameToken\(request\.headers\.get\('x-gridsong-teacher-key'\), result\.gallery\.teacherKeyHash\)/);
});

test('@claim:gallery-record-schema persists only documented gallery fields and hashed capabilities', async () => {
  const { galleryEntity, tokenHash } = require('../src/functions/gallery.js');
  const teacherKey = 'teacher-key-0123456789_abcdef0123456789';
  const studentKey = 'student-key-0123456789_abcdef0123456789';
  const gallery = galleryEntity('12345678-1234-4234-9234-123456789abc', 100, 200, teacherKey, studentKey);
  assert.deepEqual(gallery, {
    partitionKey: '12345678-1234-4234-9234-123456789abc',
    rowKey: 'gallery',
    kind: 'gallery',
    createdAt: 100,
    expiresAt: 200,
    teacherKeyHash: tokenHash(teacherKey),
    studentKeyHash: tokenHash(studentKey)
  });
  assert.equal(Object.values(gallery).includes(teacherKey), false);
  assert.equal(Object.values(gallery).includes(studentKey), false);

  let stored;
  const client = {
    async createEntity(entity) { stored = entity; },
    async *listEntities() {}
  };
  await reserveSubmissionSlot(client, gallery, { nickname: 'Blue Fox', song: compactSong(), createdAt: 150 });
  assert.deepEqual(stored, {
    partitionKey: gallery.partitionKey,
    rowKey: stored.rowKey,
    kind: 'submission',
    nickname: 'Blue Fox',
    song: compactSong(),
    createdAt: 150,
    expiresAt: 200
  });
});

test('@claim:gallery-expiry-cleanup rejects expired boards and deletes no more than 500 expired records', async () => {
  const { activeGallery, cleanExpired } = require('../src/functions/gallery.js');
  const expiredId = '12345678-1234-4234-9234-123456789abc';
  const expired = await activeGallery({ getEntity: async () => ({ partitionKey: expiredId, expiresAt: 100 }) }, expiredId);
  assert.equal(expired.response.status, 410);
  assert.equal(expired.response.jsonBody.error, 'This class gallery has closed. Ask your teacher for a new class pass.');

  const deleted = [];
  let filter;
  const client = {
    async *listEntities(options) {
      filter = options.queryOptions.filter;
      for (let index = 0; index < 501; index++) yield { partitionKey: `old-${index}`, rowKey: 'gallery' };
    },
    async deleteEntity(partitionKey, rowKey) { deleted.push({ partitionKey, rowKey }); }
  };
  await cleanExpired(client, 1234);
  assert.equal(filter, 'expiresAt le 1234L');
  assert.equal(deleted.length, 500);
  assert.deepEqual(deleted.at(-1), { partitionKey: 'old-499', rowKey: 'gallery' });
});

test('@claim:gallery-capacity a full board returns a retryable 429 with Retry-After', () => {
  const { fullGalleryResponse } = require('../src/functions/gallery.js');
  const response = fullGalleryResponse();
  assert.equal(response.status, 429);
  assert.equal(response.jsonBody.error, 'This class gallery is full. Ask your teacher to make a new board.');
  assert.equal(response.headers['retry-after'], String(FULL_GALLERY_RETRY_AFTER_SECONDS));
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('@claim:developer-runtime production deployment contract ships the Node 22 Function API with the static app', async () => {
  const deployment = JSON.parse(await readFile(join(root, 'swa-cli.config.json'), 'utf8'));
  const staticConfig = JSON.parse(await readFile(join(root, 'public/staticwebapp.config.json'), 'utf8'));
  const apiManifest = JSON.parse(await readFile(join(root, 'api', 'package.json'), 'utf8'));
  const notFoundPage = await readFile(join(root, 'public/404.html'), 'utf8');
  const production = deployment.configurations.production;
  assert.deepEqual(
    { appLocation: production.appLocation, outputLocation: production.outputLocation, apiLocation: production.apiLocation },
    { appLocation: '.', outputLocation: 'dist', apiLocation: 'api' }
  );
  assert.equal(production.appName, 'sf-gridsong');
  assert.equal(production.apiVersion, '22');
  assert.equal(apiManifest.engines.node, '>=22');
  assert.equal(staticConfig.platform.apiRuntime, 'node:22');
  assert.equal(staticConfig.navigationFallback, undefined);
  assert.deepEqual(staticConfig.responseOverrides['404'], { rewrite: '/404.html' });
  assert.ok(staticConfig.routes.some(route => route.route === '/demo' && route.rewrite === '/index.html'));
  assert.match(notFoundPage, /<h1>Page not found<\/h1>/);
  assert.match(notFoundPage, /href="\/">Return to the composer<\/a>/);
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
