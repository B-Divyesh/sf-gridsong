import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const liveOrigin = process.env.GRIDSONG_LIVE_URL;
test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');

test('deployed polish findings stay fixed on cold routes', async ({ browser }, testInfo) => {
  test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');
  const viewport = testInfo.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${liveOrigin}/?cold=${Date.now()}`);
    const banner = page.locator('#demo-banner');
    await expect(banner).toBeHidden();
    expect(await banner.evaluate(element => ({ display: getComputedStyle(element).display, height: element.getBoundingClientRect().height }))).toEqual({ display: 'none', height: 0 });
    await expect(page.getByText('Original synths and generated illustration.')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const realSong = await page.evaluate(() => localStorage.getItem('gridsong.song.v1'));

    await page.goto(`${liveOrigin}/?demo=1&cold=${Date.now()}#composer`);
    await expect(page).toHaveTitle('Demo — Gridsong');
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.getByLabel('Song title')).toHaveValue('Morning call and response');
    expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBe(realSong);
    await page.locator('.note-cell').first().click();
    await page.evaluate(() => localStorage.setItem('demo:gridsong.gallery.v3.active', '{"sample":true}'));
    await page.getByRole('button', { name: 'Start for real' }).click();
    await expect(page).toHaveURL(`${liveOrigin}/`);
    expect(await page.evaluate(() => localStorage.getItem('demo:gridsong.song.v1'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('demo:gridsong.gallery.v3.active'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('gridsong.song.v1'))).toBe(realSong);

    for (const route of ['/privacy/', '/terms/']) {
      await page.goto(`${liveOrigin}${route}`);
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.locator('.skip-link')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('main')).toBeFocused();
    }
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('deployed round-two copy, header, gallery route, and focus fixes hold', async ({ page }) => {
  test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');
  const expected = [
    { name: 'Try sample', href: '/demo#composer' },
    { name: 'Make music', href: '/#composer' },
    { name: 'Open class gallery', href: '/#class-gallery' },
    { name: 'Privacy', href: '/privacy/' }
  ];

  for (const route of ['/', '/demo', '/privacy/', '/terms/', `/not-found-${Date.now()}`]) {
    await page.goto(`${liveOrigin}${route}`);
    const primary = page.getByRole('navigation', { name: 'Primary' });
    const links = await primary.locator('a').evaluateAll(items => items.map(item => ({
      name: item.textContent?.trim(), href: item.getAttribute('href')
    })));
    expect(links).toEqual(expected);
    await expect(page.getByRole('link', { name: 'Gridsong home' }).locator('svg')).toHaveCount(1);
  }

  await page.goto(liveOrigin!);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make and play songs on a classroom grid');
  await expect(page.getByRole('button', { name: 'Start new song' })).toBeVisible();
  const copy = await page.locator('body').innerText();
  for (const removed of ['every student device', 'student class link', 'Classroom loop', 'Paint melody with', 'Play and celebrate together', 'Local-first classroom music']) {
    expect(copy).not.toContain(removed);
  }

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Privacy' }).click();
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Privacy, in plain language loaded');
  await page.goBack();
  await expect(page.locator('h1')).toBeFocused();

  await page.goto(`${liveOrigin}/privacy/`);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Open class gallery' }).click();
  await expect(page).toHaveURL(/\/#class-gallery$/);
  await expect(page.getByRole('dialog', { name: 'Class gallery' })).toBeVisible();
});

test('deployed unknown URL returns the accessible 404 and recovers home', async ({ page }) => {
  test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');
  const response = await page.goto(`${liveOrigin}/no-such-page?browser-check=${Date.now()}`);
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Gridsong');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('link', { name: 'Return to the composer' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make and play songs on a classroom grid');
});

test('deployed demo keeps its accessibility, privacy, keyboard, reduced-motion, and offline contracts', async ({ browser }, testInfo) => {
  test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');
  const viewport = testInfo.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', request => requests.push(request.url()));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${liveOrigin}/demo?browser-check=${Date.now()}#composer`);
    await expect(page).toHaveTitle('Demo — Gridsong');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.note-cell')).toHaveCount(256);
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();

    const first = page.locator('.note-cell').first();
    await first.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.note-cell').nth(1)).toBeFocused();
    const motion = await page.locator('.note-cell.active').first().evaluate(element => {
      const style = getComputedStyle(element);
      return { duration: style.transitionDuration, transform: style.transform };
    });
    expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.00001);
    expect(motion.transform).toBe('none');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
    const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport);
    expect(requests.every(request => new URL(request).origin === new URL(liveOrigin!).origin)).toBe(true);
    expect(errors).toEqual([]);

    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration?.active && !registration.waiting);
    })).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle('Demo — Gridsong');
    await expect(page.locator('.note-cell')).toHaveCount(256);
    await expect(page.locator('#offline-banner')).toHaveText('You’re offline — composing, local saves, and exports still work.');
    await expect(page.locator('#offline-banner')).toBeVisible();
    const offlineFirst = page.locator('.note-cell').first();
    await offlineFirst.click();
    await expect(offlineFirst).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.locator('.note-cell').first()).toHaveAttribute('aria-pressed', 'true');
    const midi = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export MIDI' }).click();
    await expect((await midi).suggestedFilename()).toMatch(/\.mid$/);
    const wav = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export WAV' }).click();
    await expect((await wav).suggestedFilename()).toMatch(/\.wav$/);
    await expect(page.getByText('WAV exported.')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('deployed site sends a student song to the live teacher gallery', async ({ page, browser }) => {
  test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(liveOrigin!);
  await page.locator('.note-cell').first().click();
  await page.getByRole('link', { name: 'Open class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByRole('button', { name: 'Copy student class pass' }).click();
  const classPass = await page.evaluate(() => navigator.clipboard.readText());

  const studentContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  try {
    const student = await studentContext.newPage();
    await student.goto(classPass);
    await student.getByRole('button', { name: 'Start composing' }).click();
    await student.locator('.note-cell').first().click();
    await student.getByRole('link', { name: 'Open class gallery', exact: true }).click();
    await student.getByLabel('Student nickname').fill('QA Blue Fox');
    await student.getByRole('button', { name: 'Send to class gallery' }).click();
    await expect(student.getByText('Song sent to the class gallery.')).toBeVisible();
  } finally {
    await studentContext.close();
  }
  await expect(page.getByText(/by QA Blue Fox/)).toBeVisible({ timeout: 10_000 });
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('0 songs', { exact: true })).toBeVisible();
});
