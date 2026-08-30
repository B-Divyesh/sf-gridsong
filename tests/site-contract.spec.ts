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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make classroom songs together');
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
