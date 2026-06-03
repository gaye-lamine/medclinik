import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('doctors')
  @UseGuards(JwtAuthGuard)
  async getDoctors() {
    return this.prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true, email: true },
    });
  }
}
