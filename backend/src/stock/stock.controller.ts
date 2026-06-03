import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  async findAll() {
    return this.stockService.findAll();
  }

  @Get('alerts')
  async findAlerts() {
    return this.stockService.findAlerts();
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() body: any) {
    return this.stockService.create(body);
  }

  @Put('update/:id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.stockService.update(id, body);
  }

  @Get('prescription/:code')
  async findPrescriptionByCode(@Param('code') code: string) {
    return this.stockService.findPrescriptionByCode(code);
  }

  @Post('deliver/:id')
  async deliverPrescription(@Param('id') id: string) {
    return this.stockService.deliverPrescription(id);
  }
}
