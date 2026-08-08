import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Liste de tous les rendez-vous' })
  @ApiResponse({ status: 200, description: 'Rendez-vous récupérés' })
  async findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('doctor/:doctorId')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Liste des rendez-vous affectés à un médecin' })
  @ApiResponse({ status: 200, description: 'Rendez-vous médecin récupérés' })
  async findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findByDoctor(doctorId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Détails d\'un rendez-vous' })
  @ApiResponse({ status: 200, description: 'Rendez-vous trouvé' })
  @ApiResponse({ status: 404, description: 'Rendez-vous introuvable' })
  async findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Créer un rendez-vous' })
  @ApiResponse({ status: 201, description: 'Rendez-vous planifié et SMS de confirmation envoyé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(body);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Mettre à jour un rendez-vous' })
  @ApiResponse({ status: 200, description: 'Rendez-vous mis à jour' })
  @ApiResponse({ status: 404, description: 'Rendez-vous introuvable' })
  async update(@Param('id') id: string, @Body() body: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Annuler/supprimer un rendez-vous (ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Rendez-vous supprimé' })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Post('admit/:id')
  @Roles(Role.ADMIN, Role.CASHIER, Role.NURSE)
  @ApiOperation({ summary: 'Admettre le patient en consultation (crée la facture)' })
  @ApiResponse({ status: 200, description: 'Patient admis, facture impayée générée' })
  async admit(@Param('id') id: string) {
    return this.appointmentsService.admit(id);
  }
}
