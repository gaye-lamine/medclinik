import { Controller, Post, Get, Delete, Param, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto.js';
import { Verify2faDto } from './dto/verify-2fa.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { DemoLoginDto } from './dto/demo-login.dto.js';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/** Extrait l'IP réelle du client, en tenant compte du proxy Traefik */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion de l\'utilisateur (génère l\'envoi OTP)' })
  @ApiResponse({ status: 201, description: 'OTP envoyé au téléphone de l\'utilisateur, tempToken retourné' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  @ApiResponse({ status: 429, description: 'Quota SMS dépassé — réessayez plus tard' })
  async login(@Body() body: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants de connexion invalides');
    }
    return this.authService.login(user, getClientIp(req));
  }

  @Post('verify-2fa')
  @ApiOperation({ summary: 'Vérifier le code OTP de la double authentification' })
  @ApiResponse({ status: 201, description: 'Jeton JWT final et profil utilisateur retournés' })
  @ApiResponse({ status: 401, description: 'Code OTP ou session invalide' })
  async verify2fa(@Body() body: Verify2faDto) {
    return this.authService.verifyOtp(body.tempToken, body.code);
  }

  @Post('demo-login')
  @ApiOperation({ summary: 'Connexion de démonstration rapide (désactivée en production)' })
  @ApiResponse({ status: 201, description: 'Initialise la connexion démo avec OTP généré' })
  @ApiResponse({ status: 401, description: 'Mode démo désactivé' })
  @ApiResponse({ status: 429, description: 'Quota SMS dépassé' })
  async demoLogin(@Body() body: DemoLoginDto, @Req() req: Request) {
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
    return this.authService.login(user, getClientIp(req));
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
