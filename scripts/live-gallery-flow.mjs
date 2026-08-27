const origin = process.env.GRIDSONG_LIVE_URL || 'https://gridsong.sociobot.in';

function emptyCompactSong() {
  // v1, one bar, one octave, major scale, 120 BPM, no title, 144 empty cells.
  const bytes = Buffer.alloc(61);
  bytes.set([1, 1, 1, 0, 70, 0, 0]);
  return `GS2S.${bytes.toString('base64url')}`;
}

async function call(path, init = {}) {
  const response = await fetch(new URL(`/api${path}`, origin), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} returned ${response.status}: ${body.error ?? 'unexpected response'}`);
  if (response.headers.get('cache-control') !== 'no-store') throw new Error(`${path} must return Cache-Control: no-store.`);
  return body;
}

const board = await call('/galleries', { method: 'POST', body: '{}' });
if (!board.id || !board.teacherKey || !board.studentKey) throw new Error('Create board returned an incomplete capability set.');
const before = await call(`/galleries/${board.id}`, { headers: { 'x-gridsong-teacher-key': board.teacherKey } });
if (before.entries.length !== 0) throw new Error('A new board must be empty.');
await call(`/galleries/${board.id}/submissions`, {
  method: 'POST',
  body: JSON.stringify({ nickname: 'QA Blue Fox', submitKey: board.studentKey, song: emptyCompactSong() })
});
const after = await call(`/galleries/${board.id}`, { headers: { 'x-gridsong-teacher-key': board.teacherKey } });
if (after.entries.length !== 1 || after.entries[0].nickname !== 'QA Blue Fox') throw new Error('Student submission did not appear in the teacher view.');
await call(`/galleries/${board.id}/submissions/${after.entries[0].id}`, { method: 'DELETE', headers: { 'x-gridsong-teacher-key': board.teacherKey } });
const cleared = await call(`/galleries/${board.id}`, { headers: { 'x-gridsong-teacher-key': board.teacherKey } });
if (cleared.entries.length !== 0) throw new Error('Teacher deletion did not remove the submission.');
console.log(`Gallery create → submit → teacher read → delete passed at ${origin}.`);
