const origin = process.env.GRIDSONG_LIVE_URL || 'https://gridsong.sociobot.in';
const capacity = 120;
const trials = Math.max(1, Number.parseInt(process.env.GRIDSONG_CAPACITY_TRIALS || '3', 10) || 3);

function emptyCompactSong() {
  // v1, one bar, one octave, major scale, 120 BPM, no title, and 144 empty cells.
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
  return { status: response.status, body, headers: response.headers };
}

async function readBoard(board) {
  const response = await call(`/galleries/${board.id}`, { headers: { 'x-gridsong-teacher-key': board.teacherKey } });
  if (response.status !== 200 || !Array.isArray(response.body.entries)) throw new Error(`Teacher read returned ${response.status}.`);
  return response.body;
}

for (let trial = 1; trial <= trials; trial++) {
  const created = await call('/galleries', { method: 'POST', body: '{}' });
  if (created.status !== 201 || !created.body.id || !created.body.teacherKey || !created.body.studentKey) {
    throw new Error(`Board creation returned ${created.status} in trial ${trial}.`);
  }
  const board = created.body;
  let entries = [];

  try {
    // Distinct caller-supplied forwarding values reproduce the former input shape.
    // Capacity must still come solely from storage-backed admission slots.
    const responses = await Promise.all(Array.from({ length: capacity + 1 }, (_, index) => call(`/galleries/${board.id}/submissions`, {
      method: 'POST',
      headers: { 'x-forwarded-for': `198.51.100.${index + 1}` },
      body: JSON.stringify({ nickname: `QA ${index}`, submitKey: board.studentKey, song: emptyCompactSong() })
    })));
    const statuses = responses.reduce((result, response) => ({ ...result, [response.status]: (result[response.status] ?? 0) + 1 }), {});
    if (statuses[201] !== capacity || statuses[429] !== 1 || Object.keys(statuses).length !== 2) {
      throw new Error(`Trial ${trial}: expected ${capacity} accepted submissions and one full-gallery response; received ${JSON.stringify(statuses)}.`);
    }
    const full = responses.find(response => response.status === 429);
    if (!full?.headers.get('retry-after') || !/^\d+$/.test(full.headers.get('retry-after'))) {
      throw new Error(`Trial ${trial}: full-gallery 429 must include a numeric Retry-After header.`);
    }
    entries = (await readBoard(board)).entries;
    if (entries.length !== capacity) throw new Error(`Trial ${trial}: expected ${capacity} persisted submissions; found ${entries.length}.`);
  } finally {
    if (!entries.length) entries = (await readBoard(board)).entries;
    const removals = await Promise.all(entries.map(entry => call(`/galleries/${board.id}/submissions/${entry.id}`, {
      method: 'DELETE',
      headers: { 'x-gridsong-teacher-key': board.teacherKey }
    })));
    const failed = removals.filter(response => response.status !== 200);
    if (failed.length) throw new Error(`Trial ${trial}: cleanup left ${failed.length} submissions behind.`);
  }
}
console.log(`Atomic gallery capacity passed at ${origin}: ${trials} trials each accepted and persisted ${capacity} submissions; one additional submission was refused.`);
