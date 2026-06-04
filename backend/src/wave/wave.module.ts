import { Module, forwardRef } from '@nestjs/common';
import { WaveController } from './wave.controller';
import { WaveService } from './wave.service';
import { BillingModule } from '../billing/billing.module.js';

@Module({
  imports: [forwardRef(() => BillingModule)],
  controllers: [WaveController],
  providers: [WaveService],
  exports: [WaveService],
})
export class WaveModule {}
