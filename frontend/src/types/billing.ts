export interface Patient {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  gender: string;
  phoneNumber: string;
  mutuelleName?: string;
  insuranceCoverageShare: number;
}

export interface Bill {
  id: string;
  patientId: string;
  patient: Patient;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: string;
  mutuelleName?: string;
  insuranceCoverageShare: number;
  patientShare: number;
  insuranceShare: number;
  amountPaid?: number;        // montant déjà encaissé (paiements partiels cumulés)
  transactionId?: string;
  createdAt: string;
  cashier?: { name: string };
  insuranceValidated?: boolean;
  insuranceAuthCode?: string;
}
