import { app } from '@azure/functions';
import { TableClient } from '@azure/data-tables';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const TABLE = 'gridsonggalleries';
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
const MAX_BODY = 36_000;
const MAX_SONG_BYTES = 30_000;
const MAX_SUBMISSIONS = 120;
const buckets = new Map(); // Short-lived, in-process abuse guard; no identity is persisted.
let tablePromise;

function json(status, body) { return { status, jsonBody: body, headers: { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' } }; }
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
    const connection = process.env.GALLERY_STORAGE_CONNECTION || process.env.AzureWebJobsStorage;
    if (!connection) throw new Error('Gallery storage is not configured.');
    const client = TableClient.fromConnectionString(connection, TABLE);
    tablePromise = client.createTable().catch(error => {
      if (error.statusCode !== 409) throw error;
    }).then(() => client);
  }
  return tablePromise;
}

function rateLimit(request, limit = 20) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const key = createHash('sha256').update(forwarded).digest('hex').slice(0, 16);
  const point = buckets.get(key) || { count: 0, started: now() };
  if (now() - point.started > 60_000) { point.count = 0; point.started = now(); }
  point.count++;
  buckets.set(key, point);
  if (buckets.size > 2_000) buckets.clear();
  return point.count <= limit;
}

async function body(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY) throw Object.assign(new Error('That submission is too large.'), { status: 413 });
  const text = await request.text();
  if (text.length > MAX_BODY) throw Object.assign(new Error('That submission is too large.'), { status: 413 });
  try { return JSON.parse(text || '{}'); }
  catch { throw Object.assign(new Error('Please send the song again.'), { status: 400 }); }
}

function validNickname(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 24 || /[\u0000-\u001f\u007f]/.test(name)) return null;
  return name;
}

// Validate the compact GS2S payload without retaining any extra request fields.
function validSong(value) {
  if (typeof value !== 'string' || value.length > MAX_SONG_BYTES || !/^GS2S\.[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    const bytes = Buffer.from(value.slice(5), 'base64url');
    if (bytes.length < 7 || bytes[0] !== 1) return false;
    const bars = bytes[1], octaves = bytes[2], scale = bytes[3], tempo = bytes[4] + 50;
    const titleLength = bytes[5] * 256 + bytes[6];
    if (![1, 2, 4, 8, 16, 32, 64].includes(bars) || octaves < 1 || octaves > 4 || scale > 3 || tempo < 50 || tempo > 200 || titleLength > 240) return false;
    new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(7, 7 + titleLength));
    const scaleRows = [7, 7, 5, 12][scale] * octaves + 2;
    const cells = scaleRows * bars * 16;
    const expected = 7 + titleLength + Math.ceil(cells * 3 / 8);
    if (bytes.length !== expected) return false;
    for (let cell = 0; cell < cells; cell++) {
      const bit = cell * 3, byte = Math.floor(bit / 8), offset = bit % 8;
      let code = (bytes[7 + titleLength + byte] >> offset) & 7;
      if (offset > 5) code |= (bytes[7 + titleLength + byte + 1] << (8 - offset)) & 7;
      if (code > 6) return false;
    }
    return true;
  } catch { return false; }
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

app.http('galleries', {
  methods: ['POST'], route: 'galleries', authLevel: 'anonymous',
  handler: async request => {
    if (!rateLimit(request, 5)) return fail(429, 'That is a lot of new boards at once. Wait a minute, then try again.');
    try {
      await body(request); // Enforce a tiny, known request shape even though no fields are accepted.
      const client = await table();
      const id = randomUUID(), teacherKey = token(), studentKey = token(), createdAt = now(), expiresAt = createdAt + NINETY_DAYS;
      await client.createEntity({ partitionKey: id, rowKey: 'gallery', kind: 'gallery', createdAt, expiresAt, teacherKeyHash: tokenHash(teacherKey), studentKeyHash: tokenHash(studentKey) });
      return json(201, { id, createdAt, expiresAt, entries: [], teacherKey, studentKey });
    } catch (error) { return fail(error.status || 503, error.message || 'The class board could not be created.'); }
  }
});

app.http('gallery-read', {
  methods: ['GET'], route: 'galleries/{id}', authLevel: 'anonymous',
  handler: async (request, context) => {
    if (!rateLimit(request, 60)) return fail(429, 'Please wait a minute, then try the gallery again.');
    try {
      const client = await table();
      const result = await activeGallery(client, context.bindingData.id);
      if (result.response) return result.response;
      if (!sameToken(request.headers.get('x-gridsong-teacher-key'), result.gallery.teacherKeyHash)) return fail(404, 'That class gallery was not found.');
      return json(200, await galleryView(client, result.gallery));
    } catch (error) { return fail(503, 'The class gallery is temporarily unavailable. Please try again.'); }
  }
});

app.http('gallery-submit', {
  methods: ['POST'], route: 'galleries/{id}/submissions', authLevel: 'anonymous',
  handler: async (request, context) => {
    if (!rateLimit(request, 20)) return fail(429, 'That is a lot of tries at once. Wait a minute, then try again.');
    try {
      const data = await body(request), nickname = validNickname(data.nickname);
      if (!nickname || !validSong(data.song) || !sameToken(data.submitKey, (await galleryFor(await table(), context.bindingData.id))?.studentKeyHash)) return fail(400, 'Use a short nickname and a song made in Gridsong, then try again.');
      const client = await table();
      const result = await activeGallery(client, context.bindingData.id);
      if (result.response) return result.response;
      if (!sameToken(data.submitKey, result.gallery.studentKeyHash)) return fail(404, 'That class gallery was not found. Ask your teacher for a new pass.');
      let count = 0;
      for await (const _entry of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${result.gallery.partitionKey}' and kind eq 'submission'` } })) { count++; if (count >= MAX_SUBMISSIONS) return fail(429, 'This class gallery is full. Ask your teacher to make a new board.'); }
      const createdAt = now();
      await client.createEntity({ partitionKey: result.gallery.partitionKey, rowKey: randomUUID(), kind: 'submission', nickname, song: data.song, createdAt, expiresAt: result.gallery.expiresAt });
      return json(201, { ok: true });
    } catch (error) { return fail(error.status || 503, error.message || 'The song could not be sent.'); }
  }
});

app.http('gallery-delete', {
  methods: ['DELETE'], route: 'galleries/{id}/submissions/{entryId}', authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const client = await table(), result = await activeGallery(client, context.bindingData.id);
      if (result.response) return result.response;
      if (!sameToken(request.headers.get('x-gridsong-teacher-key'), result.gallery.teacherKeyHash)) return fail(404, 'That class gallery was not found.');
      if (!/^[a-f0-9-]{36}$/i.test(context.bindingData.entryId)) return fail(400, 'That song could not be removed.');
      await client.deleteEntity(result.gallery.partitionKey, context.bindingData.entryId).catch(error => { if (error.statusCode !== 404) throw error; });
      return json(200, { ok: true });
    } catch { return fail(503, 'The song could not be removed. Please try again.'); }
  }
});

app.timer('gallery-expiry-sweep', {
  schedule: '0 15 3 * * *',
  handler: async () => {
    const client = await table();
    const expired = [];
    for await (const entity of client.listEntities({ queryOptions: { filter: `expiresAt le ${now()}` } })) expired.push({ partitionKey: entity.partitionKey, rowKey: entity.rowKey });
    await Promise.all(expired.map(entity => client.deleteEntity(entity.partitionKey, entity.rowKey)));
  }
});
