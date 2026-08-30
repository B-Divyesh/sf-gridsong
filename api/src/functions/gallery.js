const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { createHash, randomBytes, randomUUID, timingSafeEqual } = require('node:crypto');
const { expiredFilter, validNickname, validSong } = require('../validation.js');
const { isSubmissionRowKey, reserveSubmissionSlot } = require('../capacity.js');

const TABLE = 'gridsonggalleries';
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
const MAX_BODY = 36_000;
const CLEANUP_LIMIT = 500;
let tablePromise;

function json(status, body) {
  return {
    status,
    jsonBody: body,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()'
    }
  };
}
function fail(status, error) { return json(status, { error }); }
function now() { return Date.now(); }
function token() { return randomBytes(32).toString('base64url'); }
function tokenHash(value) { return createHash('sha256').update(value).digest('base64url'); }
function sameToken(value, hash) {
  if (typeof value !== 'string' || typeof hash !== 'string') return false;
  const received = Buffer.from(tokenHash(value));
  const stored = Buffer.from(hash);
  return received.length === stored.length && timingSafeEqual(received, stored);
}

async function table() {
  if (!tablePromise) {
    const galleryConnection = process.env.GALLERY_STORAGE_CONNECTION;
    const connection = galleryConnection || process.env.AzureWebJobsStorage;
    if (!connection) throw new Error('Gallery storage is not configured.');
    const client = TableClient.fromConnectionString(connection, TABLE);
    // A table-scoped SAS cannot create tables, which is intentional: production
    // deploys pre-provision this one table and grant the gallery no account-wide
    // storage access. The managed fallback remains convenient for local setup.
    tablePromise = galleryConnection
      ? Promise.resolve(client)
      : client.createTable().catch(error => {
        if (error.statusCode !== 409) throw error;
      }).then(() => client);
  }
  return tablePromise;
}

async function body(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY) throw Object.assign(new Error('That submission is too large.'), { status: 413 });
  const text = await request.text();
  if (text.length > MAX_BODY) throw Object.assign(new Error('That submission is too large.'), { status: 413 });
  try { return JSON.parse(text || '{}'); }
  catch { throw Object.assign(new Error('Please send the song again.'), { status: 400 }); }
}

async function galleryFor(client, id) {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return null;
  try { return await client.getEntity(id, 'gallery'); }
  catch (error) { if (error.statusCode === 404) return null; throw error; }
}

async function activeGallery(client, id) {
  const gallery = await galleryFor(client, id);
  if (!gallery) return { gallery: null, response: fail(404, 'That class gallery was not found. Ask your teacher for a new pass.') };
  if (Number(gallery.expiresAt) <= now()) return { gallery: null, response: fail(410, 'This class gallery has closed. Ask your teacher for a new class pass.') };
  return { gallery };
}

async function galleryView(client, gallery) {
  const entries = [];
  for await (const entity of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${gallery.partitionKey}' and kind eq 'submission'` } })) {
    entries.push({ id: entity.rowKey, nickname: entity.nickname, createdAt: Number(entity.createdAt), song: entity.song });
  }
  entries.sort((a, b) => a.createdAt - b.createdAt);
  return { id: gallery.partitionKey, createdAt: Number(gallery.createdAt), expiresAt: Number(gallery.expiresAt), entries };
}

// Managed Static Web Apps Functions support HTTP triggers only. Removing expired
// rows as teachers open new boards keeps the data retention boundary enforceable
// without an unsupported timer-trigger deployment.
async function cleanExpired(client) {
  const expired = [];
  for await (const entity of client.listEntities({ queryOptions: { filter: expiredFilter(now()) } })) {
    expired.push({ partitionKey: entity.partitionKey, rowKey: entity.rowKey });
    if (expired.length >= CLEANUP_LIMIT) break;
  }
  await Promise.all(expired.map(entity => client.deleteEntity(entity.partitionKey, entity.rowKey)));
}

app.http('galleries', {
  methods: ['POST'], route: 'galleries', authLevel: 'anonymous',
  handler: async request => {
    try {
      await body(request); // Enforce a tiny, known request shape even though no fields are accepted.
      const client = await table();
      await cleanExpired(client);
      const id = randomUUID(), teacherKey = token(), studentKey = token(), createdAt = now(), expiresAt = createdAt + NINETY_DAYS;
      await client.createEntity({ partitionKey: id, rowKey: 'gallery', kind: 'gallery', createdAt, expiresAt, teacherKeyHash: tokenHash(teacherKey), studentKeyHash: tokenHash(studentKey) });
      return json(201, { id, createdAt, expiresAt, entries: [], teacherKey, studentKey });
    } catch (error) { return fail(error.status || 503, error.status ? error.message : 'The class board could not be created.'); }
  }
});

app.http('gallery-read', {
  methods: ['GET'], route: 'galleries/{id}', authLevel: 'anonymous',
  handler: async request => {
    try {
      const client = await table();
      const result = await activeGallery(client, request.params.id);
      if (result.response) return result.response;
      if (!sameToken(request.headers.get('x-gridsong-teacher-key'), result.gallery.teacherKeyHash)) return fail(404, 'That class gallery was not found.');
      return json(200, await galleryView(client, result.gallery));
    } catch (error) { return fail(503, 'The class gallery is temporarily unavailable. Please try again.'); }
  }
});

app.http('gallery-submit', {
  methods: ['POST'], route: 'galleries/{id}/submissions', authLevel: 'anonymous',
  handler: async request => {
    try {
      const data = await body(request), nickname = validNickname(data.nickname);
      if (!nickname || !validSong(data.song) || !sameToken(data.submitKey, (await galleryFor(await table(), request.params.id))?.studentKeyHash)) return fail(400, 'Use a short nickname and a song made in Gridsong, then try again.');
      const client = await table();
      const result = await activeGallery(client, request.params.id);
      if (result.response) return result.response;
      if (!sameToken(data.submitKey, result.gallery.studentKeyHash)) return fail(404, 'That class gallery was not found. Ask your teacher for a new pass.');
      const reserved = await reserveSubmissionSlot(client, result.gallery, { nickname, song: data.song, createdAt: now() });
      if (!reserved) return fail(429, 'This class gallery is full. Ask your teacher to make a new board.');
      return json(201, { ok: true });
    } catch (error) { return fail(error.status || 503, error.status ? error.message : 'The song could not be sent.'); }
  }
});

app.http('gallery-delete', {
  methods: ['DELETE'], route: 'galleries/{id}/submissions/{entryId}', authLevel: 'anonymous',
  handler: async request => {
    try {
      const client = await table(), result = await activeGallery(client, request.params.id);
      if (result.response) return result.response;
      if (!sameToken(request.headers.get('x-gridsong-teacher-key'), result.gallery.teacherKeyHash)) return fail(404, 'That class gallery was not found.');
      if (!isSubmissionRowKey(request.params.entryId)) return fail(400, 'That song could not be removed.');
      await client.deleteEntity(result.gallery.partitionKey, request.params.entryId).catch(error => { if (error.statusCode !== 404) throw error; });
      return json(200, { ok: true });
    } catch { return fail(503, 'The song could not be removed. Please try again.'); }
  }
});
