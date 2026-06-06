import { expect, test } from '@playwright/test';

test('renders the dashboard shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'reporting-dashboard' })).toBeVisible();
});

test('increments the report count via the SignalStore (zoneless)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add report' }).click();
  await expect(page.getByTestId('report-count')).toHaveText('1');
});
