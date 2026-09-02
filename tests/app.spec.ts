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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make classroom songs together');
  await expect(page.getByText(/For K–8 music teachers and students/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', '/demo#composer');
  const banner = page.locator('#demo-banner');
  await expect(banner).toBeHidden();
  expect(await banner.evaluate(element => ({ display: getComputedStyle(element).display, height: element.getBoundingClientRect().height }))).toEqual({ display: 'none', height: 0 });
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeHidden();
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

  await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
  await expect(page.getByText('This sample stays on this device.')).toBeVisible();

  await page.goto('/?demo=1#composer');
  await expect(page).toHaveTitle('Demo — Gridsong');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByLabel('Song title')).toHaveValue('Morning call and response');
  expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBe(realSong);
});

test('@claim:local-save creates and restores a demo song without touching real storage', async ({ page }) => {
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

test('@claim:browser-exports supports keyboard grid editing and browser MIDI/WAV downloads', async ({ page }) => {
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
    await expect(opened.locator('.note-cell.active')).toHaveCount(12);
    expect(await opened.evaluate(() => JSON.parse(localStorage.getItem('demo:gridsong.song.v1') ?? '{}').notes?.length)).toBe(48);
  } finally {
    await context.close();
  }
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
      if (expired) return reply(410, { error: 'This class gallery has closed. Ask your teacher for a new class pass.' });
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
  await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByRole('button', { name: 'Copy student pass' }).click();
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
    await student.getByRole('button', { name: 'Class gallery', exact: true }).click();
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
  await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
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

test('@claim:privacy-local-demo makes no third-party requests or account prompts', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  try {
    await page.goto('/demo#composer');
    await page.locator('.note-cell').first().click();
    await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
    const origin = new URL(baseURL!).origin;
    expect(requests.every(url => new URL(url).origin === origin)).toBe(true);
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
