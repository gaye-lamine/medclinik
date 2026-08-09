import { test, expect } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-session';

test.describe('Agenda RBAC - Hidden Action Buttons for non-ADMIN', () => {
  test('NURSE role on /agenda should not see Supprimer RDV button', async ({ page }) => {
    await mockAuthenticatedSession(page, {
      id: 'nurse-1', email: 'nurse@medclinik.com', name: 'Infirmière Test', role: 'NURSE',
    });

    await page.goto('/agenda');
    await page.waitForLoadState('domcontentloaded');

    // Ensure button with text "Supprimer" or "Supprimer le RDV" is absent for NURSE
    const deleteBtn = page.locator('button', { hasText: 'Supprimer' });
    await expect(deleteBtn).toHaveCount(0);
  });
});
