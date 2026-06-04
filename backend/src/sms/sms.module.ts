import { Module } from '@nestjs/common';
import { SmsService } from './sms.service.js';
import { SmsRateLimiterService } from './sms-rate-limiter.service.js';

@Module({
  providers: [SmsService, SmsRateLimiterService],
  exports: [SmsService, SmsRateLimiterService],
})
export class SmsModule {}
