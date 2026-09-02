import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Claim = { id: string; where: string; test: string };

const root = process.cwd();
const documentPaths = ['README.md', 'public/privacy/index.html', 'public/terms/index.html'];

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

function claimMarkers(path: string): string[] {
  const text = readFileSync(join(root, path), 'utf8');
  const markers = [...text.matchAll(/<!--\s*claim:([a-z0-9-]+)\s*-->/gi)].map(match => match[1]);
  for (const match of text.matchAll(/data-claim="([a-z0-9 -]+)"/gi)) markers.push(...match[1].trim().split(/\s+/));
  return markers;
}

describe('documentation claim contract', () => {
  it('makes API claim commands install their package dependencies', () => {
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['pretest:api']).toBe('npm --prefix api ci --ignore-scripts');
    expect(packageJson.scripts?.['test:api']).toBe('npm --prefix api run test --');
  });

  it('@claim:documentation-claims-inventory inventories every marked README, Privacy, and Terms product claim', () => {
    const claims = JSON.parse(readFileSync(join(root, '.factory/claims.json'), 'utf8')) as Claim[];
    const markers = documentPaths.flatMap(claimMarkers);
    const markerIds = [...new Set(markers)].sort();
    const claimIds = new Set(claims.map(claim => claim.id));
    const documentedClaimIds = claims
      .filter(claim => /README|Privacy|Terms/.test(claim.where))
      .map(claim => claim.id)
      .sort();
    const testSources = ['src', 'tests', 'api/test']
      .flatMap(directory => filesUnder(join(root, directory)))
      .filter(path => /\.(test|spec)\.[cm]?[jt]sx?$/.test(path))
      .map(path => readFileSync(path, 'utf8'))
      .join('\n');

    expect(markers.length).toBeGreaterThan(0);
    expect(markerIds.every(id => claimIds.has(id))).toBe(true);
    expect(markerIds).toEqual(expect.arrayContaining(documentedClaimIds));

    // These seven assertions were the verifier's P1 evidence. Keep the exact
    // mapping here so a broad-looking inventory cannot silently omit them.
    expect(markerIds).toEqual(expect.arrayContaining([
      'composer-settings',
      'instrument-choices',
      'teacher-key-browser',
      'gallery-record-schema',
      'gallery-expiry-cleanup',
      'privacy-technical-footprint',
      'audio-user-gesture'
    ]));

    for (const id of markerIds) {
      const tag = new RegExp(`@claim:${id}\\b`, 'g');
      expect(testSources.match(tag)?.length, `expected one tagged regression for ${id}`).toBe(1);
      expect(claims.find(claim => claim.id === id)?.test).toContain(`@claim:${id}`);
    }
  });
});
