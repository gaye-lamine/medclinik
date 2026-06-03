import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    SmsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'medclinik_secret_key_2026_super_secure',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
