import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:unknown-route-recovery unknown URLs return the accessible product 404 and recover home', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Gridsong');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('link', { name: 'Return to the composer' })).toHaveAttribute('href', '/');
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);

  await page.getByRole('link', { name: 'Return to the composer' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make and play songs on a classroom grid');
});

test('published routes expose canonical and social metadata with a 1200 by 630 image', async ({ page }) => {
  const routes = [
    ['/', 'https://gridsong.sociobot.in/'],
    ['/demo', 'https://gridsong.sociobot.in/demo'],
    ['/privacy/', 'https://gridsong.sociobot.in/privacy/'],
    ['/terms/', 'https://gridsong.sociobot.in/terms/']
  ] as const;

  for (const [route, canonical] of routes) {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Gridsong/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://gridsong.sociobot.in/assets/gridsong-social.jpg');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  }

  const dimensions = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/assets/gridsong-social.jpg';
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(dimensions).toEqual({ width: 1200, height: 630 });
  const appleIcon = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/apple-touch-icon.png';
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(appleIcon).toEqual({ width: 180, height: 180 });
});

test('every route uses the same complete product header', async ({ page }) => {
  const expected = [
    { name: 'Try sample', href: '/demo#composer' },
    { name: 'Make music', href: '/#composer' },
    { name: 'Open class gallery', href: '/#class-gallery' },
    { name: 'Privacy', href: '/privacy/' }
  ];

  for (const route of ['/', '/demo', '/privacy/', '/terms/', '/no-such-page']) {
    await page.goto(route);
    const primary = page.getByRole('navigation', { name: 'Primary' });
    await expect(primary).toBeVisible();
    const links = await primary.locator('a').evaluateAll(items => items.map(item => ({
      name: item.textContent?.trim(), href: item.getAttribute('href')
    })));
    expect(links).toEqual(expected);
    await expect(page.getByRole('link', { name: 'Gridsong home' }).locator('svg')).toHaveCount(1);
  }
});

test('legal routes retain skip-link behavior and the complete footer', async ({ page }) => {
  for (const route of ['/privacy/', '/terms/']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
    await expect(page.getByText(/Gridsong · Songs stay on this device until shared · v1\.0\.0/)).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('forward and back route changes focus and announce the page heading', async ({ page }) => {
  await page.goto('/');
  const primary = page.getByRole('navigation', { name: 'Primary' });
  await primary.getByRole('link', { name: 'Privacy' }).click();
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Privacy, in plain language loaded');

  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Make and play songs on a classroom grid');
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Make and play songs on a classroom grid loaded');

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Try sample' }).click();
  await expect(page).toHaveTitle('Demo — Gridsong');
  await expect(page.locator('h1')).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Make and play songs on a classroom grid loaded');
});

test('the shared class-gallery destination opens the real gallery', async ({ page }) => {
  await page.goto('/privacy/');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Open class gallery' }).click();
  await expect(page).toHaveURL(/\/#class-gallery$/);
  await expect(page.getByRole('dialog', { name: 'Class gallery' })).toBeVisible();
});

test('Static Web Apps preserves 404 status while serving the 404 document', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as {
    navigationFallback?: unknown;
    responseOverrides?: Record<string, { rewrite?: string; statusCode?: number }>;
    routes?: Array<{ route?: string; rewrite?: string; statusCode?: number }>;
  };

  expect(config.navigationFallback).toBeUndefined();
  expect(config.responseOverrides?.['404']).toEqual({ rewrite: '/404.html' });
  expect(config.responseOverrides?.['404']?.statusCode).toBeUndefined();
  expect(config.routes).toContainEqual({ route: '/demo', rewrite: '/index.html' });
  expect(config.routes?.every(route => !(route.rewrite && route.statusCode))).toBe(true);
});
