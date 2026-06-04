import { Module, forwardRef } from '@nestjs/common';
import { WaveController } from './wave.controller.js';
import { WaveService } from './wave.service.js';
import { BillingModule } from '../billing/billing.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [forwardRef(() => BillingModule), AuthModule],
  controllers: [WaveController],
  providers: [WaveService],
  exports: [WaveService],
})
export class WaveModule {}
