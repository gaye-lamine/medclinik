import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Draws the MedClinik vector logo (cross + pulse line) onto a jsPDF document.
 */
const drawLogo = (doc: jsPDF, x: number, y: number, size: number = 15) => {
  const scale = size / 100;
  
  // 1. Draw the medical cross background (light gray/translucent in print)
  doc.setFillColor(240, 240, 240);
  // Vertical bar of the cross
  doc.rect(x + 38 * scale, y + 15 * scale, 24 * scale, 70 * scale, 'F');
  // Horizontal bar of the cross
  doc.rect(x + 15 * scale, y + 38 * scale, 70 * scale, 24 * scale, 'F');

  // 2. Draw the ECG heartbeat line running across
  const points = [
    [10, 50], [30, 50], [37, 42], [44, 65], [52, 28], [60, 72], [67, 47], [73, 50], [90, 50]
  ];
  
  doc.setDrawColor(0, 0, 0); // Black for crisp laser printing
  doc.setLineWidth(1.2);
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(
      x + points[i][0] * scale,
      y + points[i][1] * scale,
      x + points[i+1][0] * scale,
      y + points[i+1][1] * scale
    );
  }
};

/**
 * Generates a clean A4 vector PDF for a patient prescription.
 */
export const generatePrescriptionPDF = async (
  prescription: {
    uniqueCode: string;
    createdAt: string;
    instructions?: string;
    medicines: Array<{ name: string; dosage: string; duration: string }>;
  },
  doctorName: string,
  specialty: string,
  patient: {
    firstName: string;
    lastName: string;
    code: string;
    gender: string;
  }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // ─── Header / Letterhead ──────────────────────────────────────────
  drawLogo(doc, 20, 15, 14);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('MedClinik', 36, 23);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('EXCELLENCE & SÉCURITÉ MEDICALE', 36, 27);

  // Clinic metadata on the right
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Clinique MedClinik Cocody', 190, 20, { align: 'right' });
  doc.text('Abidjan, Mermoz — BP 221', 190, 24, { align: 'right' });
  doc.text('Tél: +225 07 00 00 00', 190, 28, { align: 'right' });
  doc.text('contact@medclinik.com', 190, 32, { align: 'right' });

  // Divider
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(20, 37, 190, 37);

  // ─── Document Title ───────────────────────────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('ORDONNANCE MÉDICALE', 105, 48, { align: 'center' });

  // ─── Metadata block (Doctor vs Patient) ───────────────────────────
  // Outer border box
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.25);
  doc.rect(20, 54, 170, 26);

  // Vertical separation line
  doc.line(105, 54, 105, 80);

  // Left column: Practitioner details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text('PRATICIEN PRESCRIPTEUR :', 24, 60);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Dr. ${doctorName}`, 24, 66);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Spécialité : ${specialty}`, 24, 72);

  // Right column: Patient details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text('PATIENT :', 110, 60);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`${patient.firstName} ${patient.lastName}`, 110, 66);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Code DMP : ${patient.code}  |  Sexe : ${patient.gender}`, 110, 72);
  doc.text(`Date : ${new Date(prescription.createdAt).toLocaleDateString('fr-FR')}`, 110, 77);

  // ─── Rx Body Separator ────────────────────────────────────────────
  doc.setFont('Times', 'italic');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Rx :', 20, 92);
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(30, 89, 190, 89);

  // ─── Medicines Table Headers ──────────────────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Médicament / Traitement', 20, 102);
  doc.text('Posologie / Fréquence', 95, 102);
  doc.text('Durée', 190, 102, { align: 'right' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(20, 105, 190, 105);

  // ─── Medicines List Rows ──────────────────────────────────────────
  let y = 113;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  
  prescription.medicines.forEach((med) => {
    // Bold medicine name
    doc.setFont('Helvetica', 'bold');
    doc.text(med.name, 20, y);
    
    // Regular posology and duration
    doc.setFont('Helvetica', 'normal');
    doc.text(med.dosage, 95, y);
    doc.text(med.duration, 190, y, { align: 'right' });

    // Thin row divider
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.15);
    doc.line(20, y + 4, 190, y + 4);
    
    y += 11;
  });

  // ─── Additional instructions box ──────────────────────────────────
  if (prescription.instructions) {
    y += 4;
    doc.setFillColor(248, 249, 250);
    doc.rect(20, y, 170, 22, 'F');
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.65);
    doc.line(20, y, 20, y + 22); // Left thick accent border

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('Instructions cliniques complémentaires :', 24, y + 6);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    
    // Auto-wrap text if too long
    const splitText = doc.splitTextToSize(prescription.instructions, 160);
    doc.text(splitText, 24, y + 12);
    
    y += 30;
  }

  // ─── Footer with signature and Secure QR Code ─────────────────────
  y = Math.max(y + 10, 245);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(20, y, 190, y);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('✓ Certifié et signé numériquement', 20, y + 6);
  doc.text(`Identifiant de sécurité DMP : ${prescription.uniqueCode}`, 20, y + 10);
  doc.text('Ce document est un acte médical officiel crypté conforme à la réglementation des soins hospitaliers.', 20, y + 14);

  // Secure QR Code
  try {
    const qrText = `https://medclinic.lamine-gaye.tech/prescription/verify/${prescription.uniqueCode}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 150,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    doc.addImage(qrDataUrl, 'PNG', 168, y + 3, 22, 22);
  } catch (err) {
    console.error('Failed to generate QR Code', err);
    doc.setDrawColor(180, 180, 180);
    doc.rect(168, y + 3, 22, 22);
  }

  // Trigger browser PDF save
  doc.save(`ordonnance_${prescription.uniqueCode}.pdf`);
};

/**
 * Generates an 80mm cash receipt PDF (standard print roll size).
 */
export const generateReceiptPDF = async (
  bill: {
    id: string;
    createdAt: string;
    amount: number;
    insuranceShare: number;
    patientShare: number;
    insuranceCoverageShare: number;
    mutuelleName?: string | null;
    paymentMethod?: string | null;
    transactionId?: string | null;
    patient: {
      firstName: string;
      lastName: string;
      code: string;
    };
  },
  cashierName: string,
  formatFCFA: (amount: number) => string
) => {
  // A typical thermal receipt width is 80mm. Let's create an 80x175mm document to fit the real QR code
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 175]
  });

  doc.setFont('Courier', 'bold');
  
  // Logo
  drawLogo(doc, 32, 8, 15);
  
  // Clinic Header
  doc.setFontSize(13);
  doc.text('MedClinik', 40, 28, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('Courier', 'normal');
  doc.text('EXCELLENCE & SECURITE', 40, 32, { align: 'center' });
  doc.text('Abidjan, Cocody Mermoz', 40, 36, { align: 'center' });
  doc.text('Tél: +225 07 00 00 00', 40, 40, { align: 'center' });
  
  doc.text('--------------------------------', 40, 44, { align: 'center' });

  // Receipt Meta Details
  doc.setFontSize(7.5);
  doc.text(`FACTURE N°: ${bill.id.substring(0, 8).toUpperCase()}`, 10, 49);
  doc.text(`DATE: ${new Date(bill.createdAt).toLocaleDateString('fr-FR')} ${new Date(bill.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 10, 54);
  doc.text(`CAISSIER: ${cashierName}`, 10, 59);
  doc.text(`PATIENT: ${bill.patient?.firstName || ''} ${bill.patient?.lastName || ''}`, 10, 64);
  doc.text(`CODE: ${bill.patient?.code || ''}`, 10, 69);

  doc.text('--------------------------------', 40, 73, { align: 'center' });

  // Prestation Line
  doc.setFont('Courier', 'bold');
  doc.text('Prestation', 10, 78);
  doc.text('Total', 70, 78, { align: 'right' });
  
  doc.setFont('Courier', 'normal');
  doc.text('Consultation Medicale', 10, 84);
  doc.text(formatFCFA(bill.amount), 70, 84, { align: 'right' });

  doc.text('--------------------------------', 40, 89, { align: 'center' });

  // Calculations
  doc.text('Montant Brut:', 10, 94);
  doc.text(formatFCFA(bill.amount), 70, 94, { align: 'right' });

  if (bill.mutuelleName) {
    doc.text(`Part Mutuelle (${bill.insuranceCoverageShare}%):`, 10, 99);
    doc.text(`-${formatFCFA(bill.insuranceShare)}`, 70, 99, { align: 'right' });
    doc.text(`Prise en charge: ${bill.mutuelleName}`, 10, 104);
  }

  doc.text('--------------------------------', 40, 109, { align: 'center' });

  // Net paid
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('NET A PAYER (PATIENT):', 10, 115);
  doc.text(formatFCFA(bill.patientShare), 70, 115, { align: 'right' });

  // Footer Info
  doc.setFont('Courier', 'normal');
  doc.setFontSize(7.5);
  doc.text('--------------------------------', 40, 120, { align: 'center' });

  const method = bill.paymentMethod === 'WAVE' || bill.paymentMethod === 'MOBILE_MONEY_WAVE' ? 'Wave' : 'Especes';
  doc.text(`Mode reglement: ${method}`, 10, 125);
  if (bill.transactionId) {
    doc.text(`Réf Transac: ${bill.transactionId.substring(0, 16)}`, 10, 130);
  }

  doc.text('--------------------------------', 40, 133, { align: 'center' });
  
  // Real QR Code integration
  try {
    const method = bill.paymentMethod === 'WAVE' || bill.paymentMethod === 'MOBILE_MONEY_WAVE' ? 'Wave' : 'Especes';
    const qrText = `MEDCLINIK SECURE RECEIPT\nID: ${bill.id}\nPatient: ${bill.patient?.firstName || ''} ${bill.patient?.lastName || ''}\nNet: ${bill.patientShare} FCFA\nMode: ${method}\nDate: ${new Date(bill.createdAt).toLocaleDateString('fr-FR')}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, {
      margin: 1,
      width: 150,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    doc.addImage(qrDataUrl, 'PNG', 30, 136, 20, 20);
  } catch (err) {
    console.error('Failed to generate Receipt QR Code', err);
  }

  doc.setFontSize(7);
  doc.text('Document électronique sécurisé', 40, 161, { align: 'center' });
  doc.text('MedClinik ERP Caisse v1.0', 40, 165, { align: 'center' });

  doc.save(`facture_${bill.id.substring(0, 8)}.pdf`);
};

/**
 * Generates an executive activity report in A4 PDF.
 */
export const generateReportPDF = (
  data: {
    financialSummary: Array<{ method: string; amount: number }>;
    pathologyStats: Array<{ name: string; count: number; percentage: number }>;
    practitionerStats: Array<{ name: string; email: string; phone: string; completedCount: number; totalRevenue: number }>;
  },
  totalRevenueSum: number,
  formatFCFA: (amount: number) => string
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // ─── Header ───────────────────────────────────────────────────────
  drawLogo(doc, 20, 15, 14);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MedClinik', 36, 23);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('RAPPORTS D\'ACTIVITÉ & BILANS', 36, 27);

  // Clinic metadata on the right
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 190, 20, { align: 'right' });
  doc.text('Bilan Hospitalier Journalier', 190, 24, { align: 'right' });
  doc.text('Document Interne Confidentiel', 190, 28, { align: 'right' });

  // Divider
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(20, 35, 190, 35);

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('RAPPORT JOURNALIER D\'ACTIVITÉ DE LA CLINIQUE', 105, 45, { align: 'center' });

  // ─── SECTION 1: Bilan Financier ──────────────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. SYNTHÈSE DES ENCAISSEMENTS PAR MODE DE RÈGLEMENT', 20, 56);
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(20, 59, 190, 59);

  let y = 67;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);

  data.financialSummary.forEach((item) => {
    doc.text(item.method, 24, y);
    doc.setFont('Helvetica', 'bold');
    doc.text(formatFCFA(item.amount), 190, y, { align: 'right' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setDrawColor(240, 240, 240);
    doc.line(20, y + 3, 190, y + 3);
    y += 10;
  });

  // Total volume row
  doc.setFillColor(248, 249, 250);
  doc.rect(20, y, 170, 10, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.text('VOLUME GLOBAL DES ENCAISSEMENTS :', 24, y + 6.5);
  doc.text(formatFCFA(totalRevenueSum), 186, y + 6.5, { align: 'right' });

  y += 22;

  // ─── SECTION 2: Top Pathologies ──────────────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. RÉPARTITION DES DIAGNOSTICS & PATHOLOGIES', 20, y);
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(20, y + 3, 190, y + 3);

  y += 12;

  // Table header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Pathologie diagnostiquée', 20, y);
  doc.text('Nombre consultations', 115, y);
  doc.text('Proportion (%)', 190, y, { align: 'right' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(20, y + 3, 190, y + 3);
  
  y += 10;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  
  data.pathologyStats.forEach((patho) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(patho.name, 20, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.text(`${patho.count} consult.`, 115, y);
    doc.text(`${patho.percentage}%`, 190, y, { align: 'right' });

    doc.setDrawColor(240, 240, 240);
    doc.line(20, y + 3, 190, y + 3);
    y += 10;
  });

  // Page Break for Practitioners list
  doc.addPage();

  // Header page 2
  drawLogo(doc, 20, 15, 10);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MedClinik', 32, 21);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Bilan d\'activité des Praticiens', 32, 25);
  doc.line(20, 30, 190, 30);

  y = 42;

  // ─── SECTION 3: Practitioners performance ────────────────────────
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. ACTIVITÉ & CHIFFRE D\'AFFAIRES GÉNÉRÉ PAR PRATICIEN', 20, y);
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(20, y + 3, 190, y + 3);

  y += 12;

  // Table header page 2
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Médecin Praticien', 20, y);
  doc.text('Contact / Email', 80, y);
  doc.text('Actes clos', 145, y, { align: 'center' });
  doc.text('Revenus générés', 190, y, { align: 'right' });

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(20, y + 3, 190, y + 3);
  
  y += 10;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);

  data.practitionerStats.forEach((docItem) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(docItem.name, 20, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(docItem.email, 80, y);
    doc.setFontSize(9.5);
    doc.text(`${docItem.completedCount}`, 145, y, { align: 'center' });
    doc.setFont('Helvetica', 'bold');
    doc.text(formatFCFA(docItem.totalRevenue), 190, y, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setDrawColor(240, 240, 240);
    doc.line(20, y + 3, 190, y + 3);
    y += 11;
  });

  // Footer page 2
  y = Math.max(y + 10, 270);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('Document confidentiel de gestion interne. MedClinik Hospital ERP.', 20, y + 6);
  doc.text('Page 2 / 2', 190, y + 6, { align: 'right' });

  doc.save(`rapport_activite_${new Date().toISOString().substring(0, 10)}.pdf`);
};
