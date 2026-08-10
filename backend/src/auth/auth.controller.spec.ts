import { AuthController } from './auth.controller';

describe('AuthController cookie session', () => {
  const user = { id: 'user-1', email: 'nurse@medclinik.com', name: 'Nurse', role: 'NURSE' };
  const accessToken = 'signed-access-token';

  const createResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  it('sets an httpOnly access cookie and omits the token from a successful login response', async () => {
    const authService = {
      validateUser: jest.fn().mockResolvedValue(user),
      login: jest.fn().mockResolvedValue({ requires2fa: false, accessToken, user }),
    };
    const controller = new AuthController(authService as any);
    const response = createResponse();

    await expect(controller.login({ email: user.email, password: 'secret' }, response as any))
      .resolves.toEqual({ requires2fa: false, user });
    expect(response.cookie).toHaveBeenCalledWith('access_token', accessToken, expect.objectContaining({
      httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 60 * 1000, path: '/',
    }));
  });

  it('returns the session profile and clears the cookie on logout', () => {
    const controller = new AuthController({} as any);
    const response = createResponse();

    expect(controller.me({ user: { sub: user.id, email: user.email, name: user.name, role: user.role } } as any))
      .toEqual({ user });
    controller.logout(response as any);
    expect(response.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({
      httpOnly: true, secure: true, sameSite: 'none', path: '/',
    }));
  });
});
