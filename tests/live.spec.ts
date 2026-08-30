import { expect, test } from '@playwright/test';

const liveOrigin = process.env.GRIDSONG_LIVE_URL;

test('deployed site sends a student song to the live teacher gallery', async ({ page, browser }) => {
  test.skip(!liveOrigin, 'Set GRIDSONG_LIVE_URL to run against a deployed Static Web App.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(liveOrigin!);
  await page.locator('.note-cell').first().click();
  await page.getByRole('button', { name: 'Class gallery', exact: true }).click();
  await page.getByRole('button', { name: 'Create class board' }).click();
  await page.getByRole('button', { name: 'Copy student pass' }).click();
  const classPass = await page.evaluate(() => navigator.clipboard.readText());

  const studentContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  try {
    const student = await studentContext.newPage();
    await student.goto(classPass);
    await student.getByRole('button', { name: 'Start composing' }).click();
    await student.locator('.note-cell').first().click();
    await student.getByRole('button', { name: 'Class gallery', exact: true }).click();
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
