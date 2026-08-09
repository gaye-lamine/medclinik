import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Jeton de connexion requis');
    }
    try {
      const payload = this.jwtService.verify(token);
      if (!payload.is2faComplete) {
        throw new UnauthorizedException('Validation 2FA requise');
      }
      
      // Inject user profile into request context
      request.user = payload;

      // Extract required roles for this handler
      const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
      if (!requiredRoles) {
        return true;
      }

      // Check if user has one of the required roles
      const hasRole = requiredRoles.includes(payload.role);
      if (!hasRole) {
        throw new ForbiddenException('Vous n\'avez pas les permissions pour effectuer cette action');
      }

      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Session de connexion invalide ou expirée');
    }
  }
}
