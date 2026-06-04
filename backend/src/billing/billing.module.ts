import { Module, forwardRef } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingGuard } from './billing.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { SmsModule } from '../sms/sms.module';
import { WaveModule } from '../wave/wave.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    QueueModule,
    SmsModule,
    forwardRef(() => WaveModule),
  ],
  controllers: [BillingController],
  providers: [BillingService, BillingGuard],
  exports: [BillingService, BillingGuard],
})
export class BillingModule {}
