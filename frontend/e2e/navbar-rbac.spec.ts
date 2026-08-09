import { test, expect } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-session';

test.describe('Navbar RBAC Visual Controls', () => {
  test('NURSE role should NOT see Consultation link or Tableau de bord link in Navbar', async ({ page }) => {
    await mockAuthenticatedSession(page, {
      id: 'nurse-1', email: 'nurse@medclinik.com', name: 'Infirmière Test', role: 'NURSE',
    });

    await page.goto('/queue');
    await page.waitForLoadState('domcontentloaded');

    // Link "File d'attente" should be visible
    const queueLink = page.locator('nav a', { hasText: "File d'attente" });
    await expect(queueLink).toBeVisible();

    // Link "Consultation" should NOT exist in Navbar for NURSE
    const consultationLink = page.locator('nav a', { hasText: 'Consultation' });
    await expect(consultationLink).toHaveCount(0);

    // Link "Tableau de bord" should NOT exist in Navbar for NURSE
    const dashboardLink = page.locator('nav a', { hasText: 'Tableau de bord' });
    await expect(dashboardLink).toHaveCount(0);
  });
});
