import { test, expect } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-session';

test.describe('Session Isolation and Route Reset on Logout (Bug 11)', () => {
  test('Logging out DOCTOR and logging in NURSE should strictly direct NURSE to /queue', async ({ page }) => {
    // 1. Set the DOCTOR cookie-backed session and navigate to /consultation
    const session = await mockAuthenticatedSession(page, {
      id: 'doctor-1', email: 'doctor@medclinik.com', name: 'Dr Test', role: 'DOCTOR',
    });

    await page.goto('/consultation');
    await expect(page).toHaveURL(/\/consultation/);

    // 2. Perform logout and wait for the public page before switching sessions.
    await Promise.all([
      page.waitForURL(/\/$/),
      page.getByRole('button', { name: /connexion/i }).click(),
    ]);
    await page.waitForLoadState('domcontentloaded');

    // 3. Set NURSE cookie-backed session and navigate to /
    await session.loginAs({
      id: 'nurse-1', email: 'nurse@medclinik.com', name: 'Infirmière Test', role: 'NURSE',
    });
    await page.goto('/');

    // 4. NURSE must land on /queue, NEVER stay on /consultation
    await expect(page).toHaveURL(/\/queue/);
  });
});
