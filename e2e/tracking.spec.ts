import { expect, test } from '@playwright/test';

/** Stable, fast target for Playwright-based captures in CI (not the real Play Store). */
const LISTING_URL = process.env.E2E_LISTING_URL ?? 'https://example.com';

test.describe('Tracked apps & monitoring', () => {
  test('lists apps, adds a listing, opens monitoring, manual capture produces a screenshot', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Tracked apps' })).toBeVisible();

    await page.getByRole('textbox', { name: /google play url/i }).fill(LISTING_URL);
    await page.getByRole('button', { name: 'Add', exact: true }).click();

    await expect(page.getByText(LISTING_URL, { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible();

    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page).toHaveURL(/\/apps\/\d+/);
    await expect(page.getByRole('link', { name: LISTING_URL })).toBeVisible();

    await expect(page.getByText('No screenshots yet.').first()).toBeVisible();

    const capture = page.getByRole('button', { name: /capture now/i });
    await capture.click();

    await expect(page.getByRole('button', { name: /capturing/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /capture now/i })).toBeEnabled({ timeout: 120_000 });

    const shot = page.getByRole('img', { name: /screenshot captured at/i }).first();
    await expect(shot).toBeVisible();
    await expect(
      shot.evaluate((img: HTMLImageElement) => img.naturalWidth > 0 && img.naturalHeight > 0)
    ).resolves.toBeTruthy();
  });

  test('API health', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:4000/health');
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toMatchObject({ status: 'ok' });
  });
});
