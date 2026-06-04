import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PatientsModule } from './patients/patients.module.js';
import { QueueModule } from './queue/queue.module.js';
import { VitalsModule } from './vitals/vitals.module.js';
import { BillingModule } from './billing/billing.module.js';
import { ConsultationsModule } from './consultations/consultations.module.js';
import { StockModule } from './stock/stock.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { SmsModule } from './sms/sms.module.js';
import { FilesModule } from './files/files.module.js';
import { WaveModule } from './wave/wave.module.js';

@Module({
  imports: [
    // ─── Protection globale contre le flood (couche 1) ───────────────────────
    // 60 requêtes / 60 secondes par IP sur tous les endpoints.
    // Les endpoints sensibles (auth/login, send-sms) ont leur propre couche 2
    // via SmsRateLimiterService (fenêtre glissante par IP + par destinataire).
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,  // fenêtre de 60 secondes
        limit: 60,   // max 60 requêtes par IP par fenêtre
      },
      {
        name: 'auth',
        ttl: 60000,  // fenêtre de 60 secondes
        limit: 10,   // max 10 tentatives de login par IP par fenêtre
      },
    ]),
    PrismaModule,
    AuthModule,
    SmsModule,
    PatientsModule,
    QueueModule,
    VitalsModule,
    BillingModule,
    ConsultationsModule,
    StockModule,
    ReportsModule,
    AppointmentsModule,
    FilesModule,
    WaveModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global Throttler — appliqué sur toute l'application
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
