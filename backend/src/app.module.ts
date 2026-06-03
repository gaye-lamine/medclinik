import { Module } from '@nestjs/common';
import { SmsModule } from './sms/sms.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsController } from './patients/patients.controller';
import { PatientsService } from './patients/patients.service';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { QueueGateway } from './queue/queue.gateway';
import { VitalsController } from './vitals/vitals.controller';
import { VitalsService } from './vitals/vitals.service';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';
import { ConsultationsController } from './consultations/consultations.controller';
import { ConsultationsService } from './consultations/consultations.service';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { FilesController } from './files/files.controller';
import { WaveController } from './wave/wave.controller';
import { WaveService } from './wave/wave.service';

@Module({
  imports: [PrismaModule, AuthModule, AppointmentsModule, SmsModule],
  controllers: [
    AppController,
    PatientsController,
    QueueController,
    VitalsController,
    BillingController,
    ConsultationsController,
    StockController,
    ReportsController,
    FilesController,
    WaveController,
  ],
  providers: [
    AppService,
    PatientsService,
    QueueService,
    QueueGateway,
    VitalsService,
    BillingService,
    ConsultationsService,
    StockService,
    ReportsService,
    WaveService,
  ],
})
export class AppModule {}
