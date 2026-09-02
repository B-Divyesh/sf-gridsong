import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, 'utf8');

describe('polish round 2 copy contract', () => {
  it('keeps unsupported and inconsistent wording out of visitor-facing copy', () => {
    const productCopy = [
      read('src/main.ts'),
      read('README.md'),
      read('public/privacy/index.html'),
      read('public/terms/index.html')
    ].join('\n');

    for (const removed of [
      'every student device',
      'student class link',
      'shareable student class link',
      'Classroom loop',
      'Paint melody with',
      'light notes below',
      'Play and celebrate together',
      'Local-first classroom music',
      'My night-market song',
      'hashed access keys',
      'opaque board reference',
      'submit-only capability',
      'bounded cleanup'
    ]) expect(productCopy).not.toContain(removed);

    expect(read('src/main.ts')).toContain('>Start new song</button>');
    expect(read('src/main.ts')).toContain('>Open class gallery</a>');
    expect(read('src/state.ts')).toContain("title: 'My classroom song'");
  });

  it('keeps the catalog description verb-first and within 120 characters', () => {
    const description = read('.factory/catalog-description.txt').trim();
    expect(description.length).toBeLessThanOrEqual(120);
    expect(description).toMatch(/^Make\b/);
  });
});
