import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultationStatus } from '@prisma/client';

@Injectable()
export class BillingGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const consultationId = request.params.id;

    if (!consultationId) {
      return true; // If no specific consultation ID is in params, proceed (e.g. creating/listing)
    }

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { billing: true },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation introuvable');
    }

    // Anti-Fraud check: The consultation is locked if it is in PENDING state (no paid bill)
    if (consultation.status === ConsultationStatus.PENDING) {
      throw new ForbiddenException(
        'Cette consultation n\'a pas encore été réglée à la caisse. Accès médical bloqué pour éviter les fuites financières.'
      );
    }

    return true;
  }
}
