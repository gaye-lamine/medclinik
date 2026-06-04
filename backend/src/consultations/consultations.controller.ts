import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingGuard } from '../billing/billing.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CompleteConsultationDto } from './dto/complete-consultation.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Consultations')
@ApiBearerAuth()
@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de toutes les consultations' })
  @ApiResponse({ status: 200, description: 'Consultations récupérées' })
  async findAll() {
    return this.consultationsService.findAll();
  }

  @Get(':id')
  @UseGuards(BillingGuard) // Block viewing if not paid
  @ApiOperation({ summary: 'Détails d\'une consultation' })
  @ApiResponse({ status: 200, description: 'Détails de la consultation' })
  @ApiResponse({ status: 403, description: 'Accès bloqué (facture impayée)' })
  @ApiResponse({ status: 404, description: 'Consultation introuvable' })
  async findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Post('start/:id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @UseGuards(BillingGuard) // Block starting if not paid
  @ApiOperation({ summary: 'Démarrer une consultation en cours' })
  @ApiResponse({ status: 200, description: 'Consultation démarrée' })
  async start(@Param('id') id: string) {
    return this.consultationsService.start(id);
  }

  @Post('complete/:id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @UseGuards(BillingGuard) // Block completion if not paid
  @ApiOperation({ summary: 'Clôturer une consultation avec diagnostic et notes' })
  @ApiResponse({ status: 200, description: 'Consultation clôturée' })
  async complete(@Param('id') id: string, @Body() body: CompleteConsultationDto) {
    return this.consultationsService.complete(id, body);
  }

  @Post('prescription/:id')
  @Roles(Role.DOCTOR, Role.ADMIN)
  @UseGuards(BillingGuard) // Block prescription creation if not paid
  @ApiOperation({ summary: 'Créer une ordonnance sécurisée pour la consultation' })
  @ApiResponse({ status: 201, description: 'Ordonnance créée avec succès' })
  async createPrescription(@Param('id') id: string, @Body() body: CreatePrescriptionDto) {
    return this.consultationsService.createPrescription(id, body);
  }
}
