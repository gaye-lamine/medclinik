import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogPayload {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre une action sensible dans le journal d'audit.
   * Non bloquant : les erreurs sont avalées pour ne jamais interrompre
   * le flux métier principal.
   */
  async log(payload: AuditLogPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: payload.userId ?? null,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          details: payload.details ? (payload.details as unknown as import('@prisma/client').Prisma.JsonObject) : undefined,
          ip: payload.ip ?? null,
        },
      });
    } catch (err) {
      // L'audit ne doit jamais faire échouer une opération métier
      console.error('[AuditService] Erreur lors de l\'enregistrement de l\'audit :', err);
    }
  }
}
