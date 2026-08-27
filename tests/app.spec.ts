import { expect, test } from '@playwright/test';
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

test('class pass and addressed ticket work across separate browser devices', async ({ page, browser }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('.note-cell').first().click();
  await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByRole('button', { name: 'Copy student pass' }).click();
  const classPass = await page.evaluate(() => navigator.clipboard.readText());
  expect(classPass).toContain('#gallery=GSP1.');

  const studentContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const student = await studentContext.newPage();
  try {
    await student.goto(classPass);
    await expect(student.getByText('You opened a student class pass.')).toBeVisible();
    await student.getByRole('button', { name: 'Start composing' }).click();
    await student.locator('.note-cell').first().click();
    await student.getByRole('button', { name: 'Class gallery', exact: true }).click();
    await student.getByLabel('Student nickname').fill('Blue Fox');
    await student.getByRole('button', { name: 'Copy my ticket' }).click();
    const ticket = await student.evaluate(() => navigator.clipboard.readText());
    expect(ticket).toMatch(/^GS2T\./);

    await page.getByLabel(/Paste a student’s GS2T ticket/).fill(ticket);
    await page.getByRole('button', { name: 'Add submission' }).click();
  } finally {
    await studentContext.close();
  }
  await expect(page.getByText('1 song', { exact: true })).toBeVisible();
  await expect(page.getByText(/by Blue Fox/)).toBeVisible();
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
