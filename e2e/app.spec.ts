import { expect, test } from '@playwright/test';

test('prompts for API key on first load when no token exists', async ({ page }) => {
  await page.goto('/dashboard');

  const main = page.getByRole('main');
  const dialog = page.getByRole('dialog');

  await expect(page).toHaveURL(/\/connect/);
  await expect(dialog.getByRole('heading', { name: 'API Key Settings' })).toBeVisible();
  await expect(dialog.getByPlaceholder('Enter your API key...')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible();

  await expect(main.getByRole('heading', { name: 'Connect to Notify' })).toBeVisible();
  await expect(main.getByRole('button', { name: 'Save' })).toBeVisible();
});

test('opens API key settings modal from the header when token already exists', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('notify.apiKey', 'playwright-test-token');
  });

  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'reporting-dashboard' })).toBeVisible();

  await page.getByRole('button', { name: 'API key settings' }).click();
  await expect(page.getByRole('heading', { name: 'API Key Settings' })).toBeVisible();
  await expect(page.getByLabel('Notify API Key')).toBeVisible();
});
