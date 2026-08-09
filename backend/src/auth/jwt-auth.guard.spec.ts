import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard cookie authentication', () => {
  const payload = {
    sub: 'user-1', email: 'nurse@medclinik.com', name: 'Nurse', role: 'NURSE', is2faComplete: true,
  };

  const createContext = (cookies: Record<string, string>) => ({
    switchToHttp: () => ({ getRequest: () => ({ cookies }) }),
    getHandler: () => undefined,
  }) as any;

  it('accepts a valid access_token cookie', async () => {
    const jwtService = { verify: jest.fn().mockReturnValue(payload) };
    const guard = new JwtAuthGuard(jwtService as any, { get: jest.fn().mockReturnValue(undefined) } as any);

    await expect(guard.canActivate(createContext({ access_token: 'valid-cookie-token' }))).resolves.toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('valid-cookie-token');
  });

  it('returns 401 when the cookie is absent or expired', async () => {
    const jwtService = { verify: jest.fn().mockImplementation(() => { throw new Error('expired'); }) };
    const guard = new JwtAuthGuard(jwtService as any, { get: jest.fn().mockReturnValue(undefined) } as any);

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(createContext({ access_token: 'expired-cookie-token' }))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
