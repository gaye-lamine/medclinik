import { test, expect } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-session';

test.describe('Cookie-backed authentication', () => {
  test('restores the session on reload and returns to public state when the cookie disappears', async ({ page }) => {
    await mockAuthenticatedSession(page, {
      id: 'nurse-1', email: 'nurse@medclinik.com', name: 'Infirmière Test', role: 'NURSE',
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/queue/);

    await page.reload();
    await expect(page).toHaveURL(/\/queue/);

    await page.context().clearCookies();
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('mc_token'))).toBeNull();
  });
});
