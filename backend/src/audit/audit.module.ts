import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Module global d'audit — exporté globalement pour être disponible
 * dans tous les modules sans réimportation.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
