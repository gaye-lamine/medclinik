-- =============================================================================
-- Migration: 20260808210000_m2_m6_m7_audit_appointment_queue
-- Vague 2 (M2, M6, M7)
-- =============================================================================

-- M7: Ajouter CASHIER à l'enum QueueDepartment
ALTER TYPE "QueueDepartment" ADD VALUE 'CASHIER';

-- M2: Ajouter appointmentId (FK optionnel) sur Consultation
ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "appointmentId" TEXT;
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- M2: Ajouter appointmentId (FK optionnel) sur Billing
ALTER TABLE "Billing" ADD COLUMN IF NOT EXISTS "appointmentId" TEXT;
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- M6: Créer le modèle AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT,
  "action"     TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId"   TEXT NOT NULL,
  "details"    JSONB,
  "ip"         TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
