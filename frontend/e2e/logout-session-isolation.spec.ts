import { test, expect } from '@playwright/test';

test.describe('Session Isolation and Route Reset on Logout (Bug 11)', () => {
  test('Logging out DOCTOR and logging in NURSE should strictly direct NURSE to /queue', async ({ page }) => {
    // 1. Set DOCTOR session and navigate to /consultation
    await page.addInitScript(() => {
      localStorage.setItem('mc_token', 'mock_token_doctor');
      localStorage.setItem('mc_user', JSON.stringify({
        id: 'doctor-1',
        email: 'doctor@medclinik.com',
        name: 'Dr Test',
        role: 'DOCTOR'
      }));
    });

    await page.goto('/consultation');
    await expect(page).toHaveURL(/\/consultation/);

    // 2. Perform Logout (clears mc_user & mc_token and redirects to /)
    await page.evaluate(() => {
      localStorage.clear();
      window.location.href = '/';
    });

    // 3. Set NURSE session and navigate to /
    await page.evaluate(() => {
      localStorage.setItem('mc_token', 'mock_token_nurse');
      localStorage.setItem('mc_user', JSON.stringify({
        id: 'nurse-1',
        email: 'nurse@medclinik.com',
        name: 'Infirmière Test',
        role: 'NURSE'
      }));
      window.location.href = '/';
    });

    // 4. NURSE must land on /queue, NEVER stay on /consultation
    await expect(page).toHaveURL(/\/queue/);
  });
});
