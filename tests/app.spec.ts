import { expect, test, type BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loads without console errors and passes accessibility scan', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle(/Gridsong/);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.note-cell')).toHaveCount(256);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('skip link moves keyboard focus to the main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('puts the teacher audience and sample action on the cold first screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make and play songs on a classroom grid');
  await expect(page.getByText(/For K–8 music teachers and students/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', '/demo#composer');
  const sampleAction = await page.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
  expect(sampleAction).not.toBeNull();
  expect(sampleAction!.y + sampleAction!.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
  const banner = page.locator('#demo-banner');
  await expect(banner).toBeHidden();
  expect(await banner.evaluate(element => ({ display: getComputedStyle(element).display, height: element.getBoundingClientRect().height }))).toEqual({ display: 'none', height: 0 });
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeHidden();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo#composer$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByLabel('Song title')).toHaveValue('Morning call and response');
});

test('demo banner actions have 44px targets and visible keyboard focus', async ({ page }) => {
  await page.goto('/demo#composer');
  for (const name of ['Reset demo', 'Start for real']) {
    const action = page.getByRole('button', { name });
    const box = await action.boundingBox();
    expect(box, `${name} must have a rendered hit area`).not.toBeNull();
    expect(box!.height, `${name} must be at least 44px high`).toBeGreaterThanOrEqual(44);
    await action.focus();
    await expect(action).toBeFocused();
    const focus = await action.evaluate(element => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) };
    });
    expect(focus.outlineStyle).not.toBe('none');
    expect(focus.outlineWidth).toBeGreaterThanOrEqual(3);
  }
});

test('@claim:demo-sandbox keeps the sample out of real-song storage and can reset it', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.note-cell').first();
  await first.click();
  const realSong = await page.evaluate(() => localStorage.getItem('gridsong.song.v1'));

  await page.goto('/demo#composer');
  await expect(page).toHaveTitle('Demo — Gridsong');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.getElementById('composer')!.getBoundingClientRect().top < 120)).toBe(true);
  await expect(page.locator('.note-cell.active')).toHaveCount(12);
  await expect(page.getByLabel('Song title')).toHaveValue('Morning call and response');
  expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBe(realSong);
  expect(await page.evaluate(() => localStorage.getItem('demo:gridsong.song.v1'))).not.toBeNull();

  await page.locator('.note-cell').first().click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Song title')).toHaveValue('Morning call and response');
  await expect(page.locator('.note-cell.active')).toHaveCount(12);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('demo:gridsong.song.v1') ?? '{}').notes?.length)).toBe(48);
  expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBe(realSong);

  await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
  await expect(page.getByText('This sample stays on this device.')).toBeVisible();

  await page.goto('/?demo=1#composer');
  await expect(page).toHaveTitle('Demo — Gridsong');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByLabel('Song title')).toHaveValue('Morning call and response');
  expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBe(realSong);
});

test('@claim:classroom-sequencer @claim:local-save creates and restores a demo song without touching real storage', async ({ page }) => {
  await page.goto('/demo#composer');
  const first = page.locator('.note-cell').first();
  const before = await first.getAttribute('aria-pressed');
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('.note-cell').first()).toHaveAttribute('aria-pressed', 'true');
  expect(before).toBe('false');
  expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBeNull();
});

test('@claim:browser-exports @claim:keyboard-grid supports keyboard grid editing and browser MIDI/WAV downloads', async ({ page }) => {
  await page.goto('/demo#composer');
  const first = page.locator('.note-cell').first();
  await first.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.note-cell').nth(1)).toBeFocused();
  const midi = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export MIDI' }).click();
  await expect((await midi).suggestedFilename()).toMatch(/\.mid$/);
  const wav = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export WAV' }).click();
  await expect((await wav).suggestedFilename()).toMatch(/\.wav$/);
  await expect(page.getByText('WAV exported.')).toBeVisible();
});

test('@claim:composer-settings exposes every documented scale, size, and tempo boundary', async ({ page }) => {
  await page.goto('/demo#composer');
  await expect(page.locator('#scale option')).toHaveText(['Major', 'Minor', 'Pentatonic', 'Chromatic']);
  await expect(page.locator('#bars option')).toHaveText(['1', '2', '4', '8', '16', '32', '64']);
  await expect(page.locator('#octaves option')).toHaveText(['1', '2', '3', '4']);
  await expect(page.locator('#tempo')).toHaveAttribute('min', '50');
  await expect(page.locator('#tempo')).toHaveAttribute('max', '200');

  await page.locator('#scale').selectOption('chromatic');
  await page.locator('#octaves').selectOption('4');
  await page.locator('#bars').selectOption('64');
  await page.locator('#tempo').evaluate((element: HTMLInputElement) => {
    element.value = '200';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#tempo-output')).toHaveText('200 BPM');
  await expect(page.getByText('Bar 1 of 64')).toBeVisible();
  await expect(page.locator('.note-cell')).toHaveCount(800);

  await page.locator('#tempo').evaluate((element: HTMLInputElement) => {
    element.value = '50';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#tempo-output')).toHaveText('50 BPM');
});

test('@claim:instrument-choices offers four melody sounds and dedicated kick and clap rows', async ({ page }) => {
  await page.goto('/demo#composer');
  for (const sound of ['Lantern', 'Reed', 'Bell', 'Pluck']) {
    await expect(page.getByRole('button', { name: sound, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Pluck', exact: true }).click();
  await page.locator('.note-cell').first().click();
  await expect(page.locator('.note-cell').first()).toHaveAttribute('aria-label', /on with pluck/);

  const kick = page.locator('.note-cell').nth(225);
  const clap = page.locator('.note-cell').nth(241);
  await kick.click();
  await clap.click();
  await expect(kick).toHaveAttribute('aria-label', /Kick drum.*on with kick/);
  await expect(clap).toHaveAttribute('aria-label', /Clap.*on with clap/);
});

test('@claim:audio-user-gesture does not construct audio until the user presses Play', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    Object.defineProperty(window, '__gridsongAudioContexts', { value: 0, writable: true, configurable: true });
    if (!NativeAudioContext) return;
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: new Proxy(NativeAudioContext, {
        construct(target, args) {
          (window as Window & { __gridsongAudioContexts: number }).__gridsongAudioContexts += 1;
          return Reflect.construct(target, args);
        }
      })
    });
  });
  const page = await context.newPage();
  try {
    await page.goto('/demo#composer');
    expect(await page.evaluate(() => (window as Window & { __gridsongAudioContexts: number }).__gridsongAudioContexts)).toBe(0);
    await page.getByRole('button', { name: 'Play song' }).click();
    await expect.poll(() => page.evaluate(() => (window as Window & { __gridsongAudioContexts: number }).__gridsongAudioContexts)).toBe(1);
    await page.getByRole('button', { name: 'Stop', exact: true }).click();
  } finally {
    await context.close();
  }
});

test('@claim:complete-song-links opens the complete sample song from a copied demo link', async ({ browser }) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  try {
    await page.goto('/demo#composer');
    await page.getByRole('button', { name: 'Copy song link' }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('/demo#song=GS2S.');
    const opened = await context.newPage();
    await opened.goto(copied);
    await expect(opened.getByLabel('Song title')).toHaveValue('Morning call and response');
    await expect(opened.locator('#scale')).toHaveValue('major');
    await expect(opened.locator('#bars')).toHaveValue('4');
    await expect(opened.locator('#octaves')).toHaveValue('2');
    await expect(opened.locator('#tempo')).toHaveValue('104');
    await expect(opened.locator('.note-cell.active')).toHaveCount(12);
    expect(await opened.evaluate(() => JSON.parse(localStorage.getItem('demo:gridsong.song.v1') ?? '{}').notes?.length)).toBe(48);
  } finally {
    await context.close();
  }
});

test('@claim:teacher-key-browser stores teacher access locally but excludes it from the copied student pass', async ({ page }) => {
  const teacherKey = 'teacher-key-0123456789_abcdef0123456789';
  const studentKey = 'student-key-0123456789_abcdef0123456789';
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'POST' && url.pathname === '/api/galleries') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '12345678-1234-4234-9234-123456789abc',
          createdAt: 100,
          expiresAt: Date.now() + 90 * 86_400_000,
          teacherKey,
          studentKey,
          entries: []
        })
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Not found' }) });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByRole('button', { name: 'Copy student class pass' }).click();
  const result = await page.evaluate(async () => {
    const copied = await navigator.clipboard.readText();
    const encoded = new URL(copied).hash.match(/gallery=(GSP1\.[^&]+)/)?.[1].slice(5) ?? '';
    const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4);
    const binary = atob(padded);
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0))));
    return { access: JSON.parse(localStorage.getItem('gridsong.gallery.v3.active') ?? '{}'), decoded };
  });
  expect(result.access).toMatchObject({ teacherKey, studentKey, id: '12345678-1234-4234-9234-123456789abc' });
  expect(result.decoded).toEqual({ v: 1, galleryId: '12345678-1234-4234-9234-123456789abc', submitKey: studentKey, expiresAt: expect.any(Number) });
  expect(result.decoded).not.toHaveProperty('teacherKey');
});

test('@claim:gallery-direct-submit student submits directly to the teacher gallery across separate devices', async ({ page, browser }) => {
  const galleries = new Map<string, { id: string; createdAt: number; expiresAt: number; teacherKey: string; studentKey: string; entries: Array<{ id: string; nickname: string; createdAt: number; song: string }> }>();
  let expired = false;
  const installGalleryApi = async (context: BrowserContext) => {
    await context.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/^\/api\/galleries(?:\/([^/]+)(?:\/submissions(?:\/([^/]+))?)?)?$/);
      const method = route.request().method();
      const reply = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify(body) });
      if (!match) return reply(404, { error: 'Not found' });
      if (method === 'POST' && !match[1]) {
        const id = '12345678-1234-4234-9234-123456789abc';
        const gallery = { id, createdAt: Date.now(), expiresAt: Date.now() + 90 * 86400000, teacherKey: 'teacher-key-0123456789_abcdef0123456789', studentKey: 'student-key-0123456789_abcdef0123456789', entries: [] as Array<{ id: string; nickname: string; createdAt: number; song: string }> };
        galleries.set(id, gallery);
        return reply(201, gallery);
      }
      const gallery = galleries.get(match[1]);
      if (!gallery) return reply(404, { error: 'That class gallery was not found.' });
      if (expired) return reply(410, { error: 'This class gallery has closed. Ask your teacher for a new student class pass.' });
      if (method === 'GET') return reply(200, gallery);
      if (method === 'POST' && !match[2]) {
        const submitted = route.request().postDataJSON() as { nickname: string; song: string; submitKey: string };
        if (submitted.submitKey !== gallery.studentKey) return reply(404, { error: 'That class gallery was not found.' });
        gallery.entries.push({ id: `00000000-0000-4000-8000-${String(gallery.entries.length + 1).padStart(12, '0')}`, nickname: submitted.nickname, createdAt: Date.now(), song: submitted.song });
        return reply(201, { ok: true });
      }
      return reply(404, { error: 'Not found' });
    });
  };
  await installGalleryApi(page.context());
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('.note-cell').first().click();
  await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByRole('button', { name: 'Copy student class pass' }).click();
  const classPass = await page.evaluate(() => navigator.clipboard.readText());
  expect(classPass).toContain('#gallery=GSP1.');

  const studentContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  await installGalleryApi(studentContext);
  const student = await studentContext.newPage();
  try {
    await student.goto(classPass);
    await expect(student.getByText('You opened a student class pass.')).toBeVisible();
    await student.getByRole('button', { name: 'Start composing' }).click();
    await student.locator('.note-cell').first().click();
    await student.getByRole('link', { name: 'Open class gallery', exact: true }).click();
    await student.getByLabel('Student nickname').fill('Blue Fox');
    await student.getByRole('button', { name: 'Send to class gallery' }).click();
    await expect(student.getByText('Song sent to the class gallery.')).toBeVisible();
  } finally {
    await studentContext.close();
  }
  await expect.poll(() => galleries.get('12345678-1234-4234-9234-123456789abc')?.entries.length).toBe(1);
  // The projector polls the same-origin gallery; no ticket is copied or pasted.
  await expect(page.getByText('1 song', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/by Blue Fox/)).toBeVisible();

  expired = true;
  await page.waitForTimeout(5_100);
  await expect(page.getByText('This class gallery has closed.')).toBeVisible();
});

test('@claim:gallery-submission-data sends only the class pass, nickname, and song', async ({ page }) => {
  let submitted: unknown;
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const response = (status: number, body: unknown) => route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'cache-control': 'no-store' },
      body: JSON.stringify(body)
    });
    if (request.method() === 'POST' && url.pathname === '/api/galleries') {
      return response(201, {
        id: '12345678-1234-4234-9234-123456789abc',
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * 86_400_000,
        teacherKey: 'teacher-key-0123456789_abcdef0123456789',
        studentKey: 'student-key-0123456789_abcdef0123456789',
        entries: []
      });
    }
    if (request.method() === 'POST' && url.pathname.endsWith('/submissions')) {
      submitted = request.postDataJSON();
      return response(201, { ok: true });
    }
    if (request.method() === 'GET') {
      return response(200, {
        id: '12345678-1234-4234-9234-123456789abc',
        createdAt: Date.now(),
        expiresAt: Date.now() + 90 * 86_400_000,
        entries: []
      });
    }
    return response(404, { error: 'Not found' });
  });

  await page.goto('/');
  await page.locator('.note-cell').first().click();
  await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByText('Add this device’s song to the board').click();
  await page.getByLabel('Nickname or label').fill('Blue Fox');
  await page.getByRole('button', { name: 'Add to board' }).click();
  await expect.poll(() => submitted).toBeTruthy();
  expect(Object.keys(submitted as Record<string, unknown>).sort()).toEqual(['nickname', 'song', 'submitKey']);
  expect(submitted).toEqual(expect.objectContaining({
    nickname: 'Blue Fox',
    submitKey: 'student-key-0123456789_abcdef0123456789',
    song: expect.stringMatching(/^GS2S\./)
  }));
});

test('@claim:teacher-removes-submissions lets a teacher remove a submission with the private board key', async ({ page }) => {
  const id = '12345678-1234-4234-9234-123456789abc';
  const teacherKey = 'teacher-key-0123456789_abcdef0123456789';
  const studentKey = 'student-key-0123456789_abcdef0123456789';
  const gallery = {
    id,
    createdAt: 100,
    expiresAt: Date.now() + 90 * 86_400_000,
    teacherKey,
    studentKey,
    entries: [{
      id: 'submission-000',
      nickname: 'Blue Fox',
      createdAt: 200,
      song: 'GS2S.AQEBAEYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    }]
  };
  let deleteRequest: { path: string; teacherKey: string | null } | undefined;
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const response = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (request.method() === 'POST' && url.pathname === '/api/galleries') {
      return response(201, gallery);
    }
    if (request.method() === 'GET' && url.pathname.endsWith(`/${id}`)) {
      return response(200, gallery);
    }
    if (request.method() === 'DELETE' && url.pathname === `/api/galleries/${id}/submissions/submission-000`) {
      deleteRequest = { path: url.pathname, teacherKey: await request.headerValue('x-gridsong-teacher-key') };
      gallery.entries.length = 0;
      return response(200, { ok: true });
    }
    return response(404, { error: 'Not found' });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await expect(page.getByText(/by Blue Fox/)).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect.poll(() => deleteRequest).toEqual({ path: `/api/galleries/${id}/submissions/submission-000`, teacherKey });
  await expect.poll(() => gallery.entries.length).toBe(0);
  await expect(page.getByText('Submission removed.')).toBeVisible();
});

test('@claim:offline-reload opens the cached demo composer shell while offline', async ({ browser }) => {
  // This must own its context: closing/reusing the shared context would make
  // later browser tests fail and would not prove a clean offline reload.
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('/demo#composer');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
      return Boolean(registration?.active && !registration.waiting);
    })).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Demo — Gridsong');
    await expect(page.locator('.note-cell')).toHaveCount(256);
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:privacy-local-demo @claim:privacy-technical-footprint makes no third-party requests, cookies, or account prompts', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: string[] = [];
  const responseHeaders: Record<string, string>[] = [];
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => responseHeaders.push(response.headers()));
  try {
    await page.goto('/demo#composer');
    await page.locator('.note-cell').first().click();
    await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
    const origin = new URL(baseURL!).origin;
    expect(requests.every(url => new URL(url).origin === origin)).toBe(true);
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
    expect(resources.every(url => new URL(url).origin === origin)).toBe(true);
    expect(responseHeaders.some(headers => 'set-cookie' in headers)).toBe(false);
    expect(await context.cookies()).toEqual([]);
    await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('@claim:no-account-backup keeps a composed real song in local storage without an account or gallery request', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  try {
    await page.goto('/');
    await page.locator('.note-cell').first().click();
    expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).not.toBeNull();
    expect(requests.some(url => new URL(url).pathname.startsWith('/api/'))).toBe(false);
    expect(requests.every(url => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);
    await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('@claim:mobile-390 keeps the page frame within a 390px viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
