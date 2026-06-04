import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Vitals')
@ApiBearerAuth()
@Controller('vitals')
@UseGuards(JwtAuthGuard)
export class VitalsController {
  constructor(private vitalsService: VitalsService) {}

  @Post()
  @Roles(Role.NURSE, Role.ADMIN)
  @ApiOperation({ summary: 'Enregistrer les constantes vitales d\'un patient' })
  @ApiResponse({ status: 201, description: 'Constantes enregistrées avec succès et patient mis en file d\'attente médecin' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(@Body() body: CreateVitalsDto, @Req() req: any) {
    const nurseId = req.user.sub;
    return this.vitalsService.create(nurseId, body);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Récupérer l\'historique des constantes vitales d\'un patient' })
  @ApiResponse({ status: 200, description: 'Historique récupéré' })
  async getPatientHistory(@Param('patientId') patientId: string) {
    return this.vitalsService.getPatientHistory(patientId);
  }
}
