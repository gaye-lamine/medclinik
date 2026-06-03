import { Controller, Post, Get, Delete, Param, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Identifiants de connexion invalides');
    }
    return this.authService.login(user);
  }

  @Post('verify-2fa')
  async verify2fa(@Body() body: any) {
    return this.authService.verifyOtp(body.tempToken, body.code);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async findAllUsers() {
    return this.authService.findAllUsers();
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
