/**
 * Utilitaires de calcul de facturation — fonction pure sans dépendance Prisma.
 * Source unique de vérité pour le calcul tiers-payant / quote-part assurance.
 * Utilisée par BillingService.calculateShare() ET AppointmentsService.admit().
 */
export interface InsuranceShareResult {
  amount: number;
  insuranceCoverageShare: number;
  insuranceShare: number;
  patientShare: number;
}

/**
 * Calcule la quote-part patient et assurance à partir d'un montant total
 * et d'un taux de couverture assurance (en %, 0–100).
 */
export function calculateInsuranceShare(
  amount: number,
  coveragePercent: number,
): InsuranceShareResult {
  const coverage = Math.max(0, Math.min(100, coveragePercent));
  const insuranceShare = (amount * coverage) / 100;
  const patientShare = amount - insuranceShare;
  return {
    amount,
    insuranceCoverageShare: coverage,
    insuranceShare,
    patientShare,
  };
}
