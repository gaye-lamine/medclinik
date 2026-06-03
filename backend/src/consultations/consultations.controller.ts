import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingGuard } from '../billing/billing.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  @Get()
  async findAll() {
    return this.consultationsService.findAll();
  }

  @Get(':id')
  @UseGuards(BillingGuard) // Block viewing if not paid
  async findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Post('start/:id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @UseGuards(BillingGuard) // Block starting if not paid
  async start(@Param('id') id: string) {
    return this.consultationsService.start(id);
  }

  @Post('complete/:id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @UseGuards(BillingGuard) // Block completion if not paid
  async complete(@Param('id') id: string, @Body() body: any) {
    return this.consultationsService.complete(id, body);
  }

  @Post('prescription/:id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @UseGuards(BillingGuard) // Block prescription creation if not paid
  async createPrescription(@Param('id') id: string, @Body() body: any) {
    return this.consultationsService.createPrescription(id, body);
  }
}
