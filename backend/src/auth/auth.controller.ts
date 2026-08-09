import { Controller, Post, Get, Delete, Param, Body, Req, Res, UseGuards, UnauthorizedException, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto.js';
import { Verify2faDto } from './dto/verify-2fa.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { DemoLoginDto } from './dto/demo-login.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setAccessTokenCookie(response: Response, result: any) {
    if (!result.accessToken) return result;

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 60 * 1000,
      path: '/',
    });
    const { accessToken: _accessToken, ...body } = result;
    return body;
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion de l\'utilisateur' })
  @ApiResponse({ status: 201, description: 'Cookie httpOnly posé, profil utilisateur retourné' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants de connexion invalides');
    }
    return this.setAccessTokenCookie(response, await this.authService.login(user));
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Vérifier le code OTP de la double authentification' })
  @ApiResponse({ status: 201, description: 'Jeton JWT final et profil utilisateur retournés' })
  @ApiResponse({ status: 401, description: 'Code OTP ou session invalide' })
  async verify2fa(@Body() body: Verify2faDto, @Res({ passthrough: true }) response: Response) {
    return this.setAccessTokenCookie(response, await this.authService.verifyOtp(body.tempToken, body.code));
  }

  @Post('demo-login')
  @ApiOperation({ summary: 'Connexion de démonstration rapide (désactivée en production)' })
  @ApiResponse({ status: 201, description: 'Cookie httpOnly posé, profil démo retourné' })
  @ApiResponse({ status: 401, description: 'Mode démo désactivé' })
  async demoLogin(@Body() body: DemoLoginDto, @Res({ passthrough: true }) response: Response) {
    const enableDemo = process.env.ENABLE_DEMO === 'true' || process.env.NODE_ENV !== 'production';
    if (!enableDemo) {
      throw new UnauthorizedException('Le mode démonstration rapide est désactivé');
    }

    const roleEmails: Record<Role, string> = {
      ADMIN: 'admin@medclinik.com',
      DOCTOR: 'doctor@medclinik.com',
      NURSE: 'nurse@medclinik.com',
      CASHIER: 'cashier@medclinik.com',
    };

    const email = roleEmails[body.role];
    const user = await this.authService.findUserByEmailForDemo(email);
    if (!user) {
      throw new UnauthorizedException('Utilisateur de démonstration introuvable');
    }
    return this.setAccessTokenCookie(response, await this.authService.login(user));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retourner le profil de la session courante' })
  @ApiResponse({ status: 200, description: 'Profil de la session active' })
  @ApiResponse({ status: 401, description: 'Session absente, invalide ou expirée' })
  me(@Req() req: Request) {
    const { sub: id, email, name, role } = req.user as any;
    return { user: { id, email, name, role } };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enregistrer un nouveau collaborateur' })
  @ApiResponse({ status: 201, description: 'Collaborateur enregistré avec succès' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister tous les collaborateurs' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée' })
  async findAllUsers() {
    return this.authService.findAllUsers();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Désactiver/supprimer un collaborateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
