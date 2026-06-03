import { Controller, Get, Post, Body, Param, Req, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { WaveService } from '../wave/wave.service';
import { SmsService } from '../sms/sms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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
  async findAll() {
    return this.billingService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Post('calculate-share')
  @Roles(Role.CASHIER, Role.ADMIN)
  async calculateShare(@Body() body: any) {
    return this.billingService.calculateShare(body.patientId, parseFloat(body.amount));
  }

  @Post()
  @Roles(Role.CASHIER, Role.ADMIN)
  async create(@Body() body: any) {
    return this.billingService.create(body);
  }

  @Post('pay/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  async pay(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const cashierId = req.user.sub;
    return this.billingService.pay(id, cashierId, body);
  }

  @Post('validate-insurance/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  async validateInsurance(@Param('id') id: string, @Body() body: { mutuelleName: string; coverageShare: number }) {
    return this.billingService.validateInsurance(id, body);
  }

  @Post('wave/checkout/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  async createWaveCheckout(@Param('id') id: string) {
    const bill = await this.billingService.findOne(id);
    if (!bill) {
      throw new Error('Facture introuvable');
    }
    const waveUrl = await this.waveService.createCheckoutSession(bill.patientShare, id);
    if (!waveUrl) {
      throw new Error('Impossible de générer le lien Wave');
    }
    return { waveUrl };
  }

  @Post('wave/send-sms/:id')
  @Roles(Role.CASHIER, Role.ADMIN)
  async sendWaveSms(@Param('id') id: string, @Body() body: { phone: string; waveUrl: string }) {
    const bill = await this.billingService.findOne(id);
    if (!bill) {
      throw new Error('Facture introuvable');
    }
    const message = `Bonjour, veuillez regler votre facture MedClinik de ${bill.patientShare} FCFA en cliquant sur ce lien sécurisé Wave: ${body.waveUrl}`;
    const success = await this.smsService.send(body.phone, message);
    if (!success) {
      throw new Error("L'envoi du SMS a échoué.");
    }
    return { success: true };
  }
}
