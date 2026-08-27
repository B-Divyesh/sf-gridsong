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

test('creates and locally restores a note', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.note-cell').first();
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('.note-cell').first()).toHaveAttribute('aria-pressed', 'true');
});

test('supports keyboard grid editing and MIDI download', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.note-cell').first();
  await first.focus();
  await page.keyboard.press('Space');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.note-cell').nth(1)).toBeFocused();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export MIDI' }).click();
  await expect((await download).suggestedFilename()).toMatch(/\.mid$/);
});

test('renders a WAV entirely in the browser', async ({ page }) => {
  await page.goto('/');
  await page.locator('.note-cell').first().click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export WAV' }).click();
  await expect((await download).suggestedFilename()).toMatch(/\.wav$/);
  await expect(page.getByText('WAV exported.')).toBeVisible();
});

test('student submits directly to the teacher gallery across separate devices', async ({ page, browser }) => {
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

test('opens the cached composer shell while offline', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.context().setOffline(true);
  try {
    await page.reload();
    await expect(page).toHaveTitle(/Gridsong/);
    await expect(page.locator('.note-cell')).toHaveCount(256);
  } finally {
    await page.context().setOffline(false);
  }
});

test('keeps the page frame within a 390px viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
