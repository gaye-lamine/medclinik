-- =============================================================================
-- Migration: 20260808220000_unique_vitals_id
-- Resserre la relation Vitals -> Consultation en 1:1 stricte via contrainte @unique
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "Consultation_vitalsId_key" ON "Consultation"("vitalsId");
