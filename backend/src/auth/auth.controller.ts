import { Controller, Post, Get, Delete, Param, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { RegisterDto } from './dto/register.dto';
import { DemoLoginDto } from './dto/demo-login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion de l\'utilisateur (génère l\'envoi OTP)' })
  @ApiResponse({ status: 201, description: 'OTP envoyé au téléphone de l\'utilisateur, tempToken retourné' })
  @ApiResponse({ status: 401, description: 'Identifiants incorrects' })
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants de connexion invalides');
    }
    return this.authService.login(user);
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
  async demoLogin(@Body() body: DemoLoginDto) {
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
    return this.authService.login(user);
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
