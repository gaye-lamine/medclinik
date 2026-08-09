import { test, expect } from '@playwright/test';

test.describe('Post-login Auto-redirection by Role (Bugs 8 & 9)', () => {
  test('NURSE role accessing / should auto-redirect to /queue', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mc_token', 'mock_token_nurse');
      localStorage.setItem('mc_user', JSON.stringify({
        id: 'nurse-1',
        email: 'nurse@medclinik.com',
        name: 'Infirmière Test',
        role: 'NURSE'
      }));
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/queue/);
  });

  test('CASHIER role accessing / should auto-redirect to /caisse', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mc_token', 'mock_token_cashier');
      localStorage.setItem('mc_user', JSON.stringify({
        id: 'cashier-1',
        email: 'caisse@medclinik.com',
        name: 'Caissier Test',
        role: 'CASHIER'
      }));
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/caisse/);
  });

  test('DOCTOR role accessing / should auto-redirect to /consultation', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mc_token', 'mock_token_doctor');
      localStorage.setItem('mc_user', JSON.stringify({
        id: 'doctor-1',
        email: 'doctor@medclinik.com',
        name: 'Dr Test',
        role: 'DOCTOR'
      }));
    });

    await page.goto('/');
    await expect(page).toHaveURL(/\/consultation/);
  });
});
