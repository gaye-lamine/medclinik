import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SmsService } from '../sms/sms.service';
import { createHash } from 'crypto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async findUserByEmailForDemo(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async login(user: any) {
    // Generate a random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP with JWT_SECRET
    const secret = process.env.JWT_SECRET || 'medclinik_secret_key_2026_super_secure';
    const hashedOtp = createHash('sha256').update(otp + secret).digest('hex');

    // Send the OTP via SMS to the user's phone number
    if (user.phone) {
      const message = `Votre code de validation MedClinik est : ${otp}. Ne le partagez jamais.`;
      this.smsService
        .send(user.phone, message)
        .then((success) => {
          if (success) {
            this.logger.log(`2FA OTP SMS sent successfully to ${user.phone}`);
          } else {
            this.logger.error(`Failed to send 2FA OTP SMS to ${user.phone}`);
          }
        })
        .catch((err) => {
          this.logger.error(`Error sending 2FA OTP SMS: ${err.message}`);
        });
    } else {
      this.logger.warn(`User ${user.email} has no phone number. Cannot send OTP.`);
    }

    // Generate a temporary JWT token representing the pre-2FA state
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
      hashedOtp,
      is2faComplete: false,
    };

    return {
      requires2fa: true,
      email: user.email,
      phone: user.phone || 'N/A',
      tempToken: this.jwtService.sign(payload, { expiresIn: '10m' }),
    };
  }

  async verifyOtp(tempToken: string, code: string) {
    try {
      const decoded = this.jwtService.verify(tempToken);

      const secret = process.env.JWT_SECRET || 'medclinik_secret_key_2026_super_secure';
      const computedHash = createHash('sha256').update(code + secret).digest('hex');

      // Verify OTP. In development, allow bypass codes
      const isDev = process.env.NODE_ENV !== 'production';
      const isBypass = isDev && (code === '123456' || code === '000000');
      const isValidOtp = decoded.hashedOtp === computedHash || isBypass;

      if (isValidOtp) {
        const payload = {
          email: decoded.email,
          sub: decoded.sub,
          role: decoded.role,
          name: decoded.name,
          is2faComplete: true,
        };
        return {
          accessToken: this.jwtService.sign(payload),
          user: {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
          },
        };
      }
      throw new UnauthorizedException('Code OTP incorrect');
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Token de session invalide ou expiré');
    }
  }

  async register(data: RegisterDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        phone: data.phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
