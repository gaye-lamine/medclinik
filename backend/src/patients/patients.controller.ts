import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Liste de tous les patients' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès' })
  async findAll() {
    return this.patientsService.findAll();
  }

  @Get('search')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Recherche de patients' })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  async search(@Query('q') query: string) {
    return this.patientsService.search(query || '');
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Détails d\'un patient (filtre les dossiers médicaux si Caissier)' })
  @ApiResponse({ status: 200, description: 'Patient trouvé' })
  @ApiResponse({ status: 404, description: 'Patient introuvable' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userRole = req.user?.role;
    return this.patientsService.findOne(id, userRole);
  }

  @Post()
  @Roles(Role.ADMIN, Role.NURSE, Role.CASHIER)
  @ApiOperation({ summary: 'Enregistrer un nouveau patient' })
  @ApiResponse({ status: 201, description: 'Patient enregistré avec succès' })
  @ApiResponse({ status: 400, description: 'Données d\'entrée invalides' })
  async create(@Body() body: CreatePatientDto) {
    return this.patientsService.create(body);
  }
}
