const origin = process.env.GRIDSONG_LIVE_URL || 'https://gridsong.sociobot.in';
const response = await fetch(new URL('/api/galleries', origin), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  // A malformed body reaches the Function but never creates a board. A static-only
  // deployment instead returns 405, which is the regression this catches.
  body: '{'
});
const payload = await response.json().catch(() => ({}));

if (response.status !== 400 || typeof payload.error !== 'string') {
  throw new Error(`Gallery API smoke check failed: expected Function 400, received ${response.status}.`);
}
if (response.headers.get('cache-control') !== 'no-store') {
  throw new Error('Gallery API smoke check failed: Function response must be no-store.');
}
const headers = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};
for (const [name, expected] of Object.entries(headers)) {
  if (response.headers.get(name) !== expected) throw new Error(`Gallery API smoke check failed: ${name} is missing or incorrect.`);
}
console.log(`Gallery API is live at ${origin} (malformed request correctly returned 400).`);
