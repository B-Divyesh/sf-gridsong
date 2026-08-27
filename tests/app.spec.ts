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

test('creates a gallery and adds the current song', async ({ page }) => {
  await page.goto('/');
  await page.locator('.note-cell').first().click();
  await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create a gallery' }).click();
  await page.getByLabel('Student nickname').fill('Blue Fox');
  await page.getByRole('button', { name: 'Add here' }).click();
  await expect(page.getByText('1 song', { exact: true })).toBeVisible();
  await expect(page.getByText(/by Blue Fox/)).toBeVisible();
});

test('keeps the page frame within a 390px viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const widths = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});
