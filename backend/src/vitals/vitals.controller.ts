import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('vitals')
@UseGuards(JwtAuthGuard)
export class VitalsController {
  constructor(private vitalsService: VitalsService) {}

  @Post()
  @Roles(Role.NURSE, Role.ADMIN)
  async create(@Body() body: any, @Req() req: any) {
    const nurseId = req.user.sub;
    return this.vitalsService.create(nurseId, body);
  }

  @Get('patient/:patientId')
  async getPatientHistory(@Param('patientId') patientId: string) {
    return this.vitalsService.getPatientHistory(patientId);
  }
}
