import type { Page } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'CASHIER';
}

/** Simulates the cookie-backed auth endpoints used by the static frontend. */
export async function mockAuthenticatedSession(page: Page, initialUser: TestUser) {
  let user: TestUser | null = initialUser;

  await page.context().addCookies([{
    name: 'access_token',
    value: 'playwright-session',
    url: 'http://localhost:3005',
    httpOnly: true,
  }]);

  await page.route('**/api/auth/me', async (route) => {
    const hasAccessCookie = (await route.request().headerValue('cookie'))?.includes('access_token=');
    if (!user || !hasAccessCookie) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Session expirée' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user }) });
  });

  await page.route('**/api/auth/logout', async (route) => {
    user = null;
    await route.fulfill({ status: 204 });
  });

  return {
    async loginAs(nextUser: TestUser) {
      user = nextUser;
      await page.context().addCookies([{
        name: 'access_token',
        value: 'playwright-session',
        url: 'http://localhost:3005',
        httpOnly: true,
      }]);
    },
  };
}
