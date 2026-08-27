import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { expiredFilter, validNickname, validSong } from '../src/validation.js';

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
  const deployment = JSON.parse(await readFile(new URL('../../swa-cli.config.json', import.meta.url), 'utf8'));
  const staticConfig = JSON.parse(await readFile(new URL('../../public/staticwebapp.config.json', import.meta.url), 'utf8'));
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
  const source = await readFile(new URL('../src/functions/gallery.js', import.meta.url), 'utf8');
  assert.match(source, /async function cleanExpired/);
  assert.match(source, /await cleanExpired\(client\)/);
  assert.doesNotMatch(source, /app\.timer\(/);
  assert.match(source, /request\.params\.id/);
  assert.doesNotMatch(source, /context\.bindingData/);
});
