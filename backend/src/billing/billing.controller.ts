import { Controller, Get, Post, Body, Param, Req, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { WaveService } from '../wave/wave.service';
import { SmsService } from '../sms/sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CalculateShareDto } from './dto/calculate-share.dto';
import { CreateBillingDto } from './dto/create-billing.dto';
import { PayBillingDto } from './dto/pay-billing.dto';
import { ValidateInsuranceDto } from './dto/validate-insurance.dto';
import { SendWaveSmsDto } from './dto/send-wave-sms.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private billingService: BillingService,
    private waveService: WaveService,
    private smsService: SmsService,
  ) {}

  @Get()
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Liste de toutes les factures' })
  @ApiResponse({ status: 200, description: 'Factures récupérées' })
  async findAll() {
    return this.billingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'une facture' })
  @ApiResponse({ status: 200, description: 'Facture trouvée' })
  @ApiResponse({ status: 404, description: 'Facture introuvable' })
  async findOne(@Param('id') id: string) {
    const bill = await this.billingService.findOne(id);
    if (!bill) {
      throw new NotFoundException('Facture introuvable');
    }
    return bill;
  }

  @Post('calculate-share')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Calculer la répartition mutuelle / patient d\'un montant' })
  @ApiResponse({ status: 200, description: 'Calcul effectué' })
  async calculateShare(@Body() body: CalculateShareDto) {
    return this.billingService.calculateShare(body.patientId, body.amount);
  }

  @Post()
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle facture et initialiser une consultation' })
  @ApiResponse({ status: 201, description: 'Facture créée avec succès' })
  async create(@Body() body: CreateBillingDto) {
    return this.billingService.create(body);
  }

  @Post('pay/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Enregistrer le règlement d\'une facture' })
  @ApiResponse({ status: 200, description: 'Facture réglée avec succès' })
  async pay(@Param('id') id: string, @Body() body: PayBillingDto, @Req() req: any) {
    const cashierId = req.user.sub;
    return this.billingService.pay(id, cashierId, body);
  }

  @Post('validate-insurance/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Valider manuellement la prise en charge assurance/mutuelle' })
  @ApiResponse({ status: 200, description: 'Assurance validée' })
  async validateInsurance(@Param('id') id: string, @Body() body: ValidateInsuranceDto) {
    return this.billingService.validateInsurance(id, body);
  }

  @Post('wave/checkout/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Créer un lien de paiement Wave Mobile Money' })
  @ApiResponse({ status: 200, description: 'Session Wave initialisée avec succès' })
  @ApiResponse({ status: 404, description: 'Facture introuvable' })
  async createWaveCheckout(@Param('id') id: string) {
    const bill = await this.billingService.findOne(id);
    if (!bill) {
      throw new NotFoundException('Facture introuvable');
    }
    const waveUrl = await this.waveService.createCheckoutSession(bill.patientShare, id);
    if (!waveUrl) {
      throw new BadRequestException('Impossible de générer le lien de paiement Wave');
    }
    return { waveUrl };
  }

  @Post('wave/send-sms/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  @ApiOperation({ summary: 'Envoyer le lien de paiement Wave par SMS au patient' })
  @ApiResponse({ status: 200, description: 'SMS envoyé avec succès' })
  async sendWaveSms(@Param('id') id: string, @Body() body: SendWaveSmsDto) {
    const bill = await this.billingService.findOne(id);
    if (!bill) {
      throw new NotFoundException('Facture introuvable');
    }
    const message = `Bonjour, veuillez regler votre facture MedClinik de ${bill.patientShare} FCFA en cliquant sur ce lien sécurisé Wave: ${body.waveUrl}`;
    const success = await this.smsService.send(body.phone, message);
    if (!success) {
      throw new BadRequestException("L'envoi du SMS de facturation a échoué.");
    }
    return { success: true };
  }
}
