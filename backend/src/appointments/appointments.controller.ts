import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  async findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findByDoctor(doctorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  async create(@Body() body: {
    patientId: string;
    doctorId: string;
    dateTime: string;
    specialty: string;
    notes?: string;
  }) {
    return this.appointmentsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: {
    dateTime?: string;
    status?: string;
    specialty?: string;
    notes?: string;
  }) {
    return this.appointmentsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Post('admit/:id')
  async admit(@Param('id') id: string) {
    return this.appointmentsService.admit(id);
  }
}
