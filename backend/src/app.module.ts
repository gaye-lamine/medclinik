import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { QueueModule } from './queue/queue.module';
import { VitalsModule } from './vitals/vitals.module';
import { BillingModule } from './billing/billing.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { StockModule } from './stock/stock.module';
import { ReportsModule } from './reports/reports.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SmsModule } from './sms/sms.module';
import { FilesModule } from './files/files.module';
import { WaveModule } from './wave/wave.module';

@Module({
  imports: [
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
  providers: [AppService],
})
export class AppModule {}

