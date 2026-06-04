import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de tous les patients' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès' })
  async findAll() {
    return this.patientsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Recherche de patients' })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  async search(@Query('q') query: string) {
    return this.patientsService.search(query || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un patient' })
  @ApiResponse({ status: 200, description: 'Patient trouvé' })
  @ApiResponse({ status: 404, description: 'Patient introuvable' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Enregistrer un nouveau patient' })
  @ApiResponse({ status: 201, description: 'Patient enregistré avec succès' })
  @ApiResponse({ status: 400, description: 'Données d\'entrée invalides' })
  async create(@Body() body: CreatePatientDto) {
    return this.patientsService.create(body);
  }
}
