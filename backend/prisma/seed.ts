import { PrismaClient, Role, ConsultationStatus, BillingStatus, QueueStatus, QueueDepartment } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding MedClinik database...');

  // 1. Clear existing data
  await prisma.queueEntry.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.vitals.deleteMany({});
  await prisma.billing.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.stockItem.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const doctorPassword = await bcrypt.hash('doctor123', saltRounds);
  const nursePassword = await bcrypt.hash('nurse123', saltRounds);
  const cashierPassword = await bcrypt.hash('cashier123', saltRounds);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@medclinik.com',
      password: adminPassword,
      name: 'Admin MedClinik',
      role: Role.ADMIN,
      phone: '+221770000001',
    },
  });

  const adminMain = await prisma.user.create({
    data: {
      email: 'lifesonou@gmail.com',
      password: await bcrypt.hash('password123', saltRounds),
      name: 'Administrateur Principal',
      role: Role.ADMIN,
      phone: '+221772238013',
    },
  });

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@medclinik.com',
      password: doctorPassword,
      name: 'Dr. Jean-Marc Koffi',
      role: Role.DOCTOR,
      phone: '+225070000002',
    },
  });

  const nurse = await prisma.user.create({
    data: {
      email: 'nurse@medclinik.com',
      password: nursePassword,
      name: 'Inf. Assiatou Diallo',
      role: Role.NURSE,
      phone: '+224620000003',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      email: 'cashier@medclinik.com',
      password: cashierPassword,
      name: 'Cais. Olivier Mensah',
      role: Role.CASHIER,
      phone: '+228900000004',
    },
  });

  console.log('Users created successfully.');

  // 4. Create Stock Items (including low stock warnings)
  await prisma.stockItem.createMany({
    data: [
      {
        name: 'Paracétamol 500mg',
        quantity: 120,
        unit: 'boîtes',
        criticalThreshold: 20,
        category: 'Médicaments',
      },
      {
        name: 'Seringues stériles 5ml',
        quantity: 15, // Below critical threshold (30)
        unit: 'boîtes',
        criticalThreshold: 30,
        category: 'Consommables',
      },
      {
        name: 'Gants d\'examen (Taille M)',
        quantity: 45,
        unit: 'boîtes',
        criticalThreshold: 10,
        category: 'Consommables',
      },
      {
        name: 'Amoxicilline 500mg',
        quantity: 8, // Below critical threshold (15)
        unit: 'boîtes',
        criticalThreshold: 15,
        category: 'Médicaments',
      },
      {
        name: 'Solution hydroalcoolique 1L',
        quantity: 12,
        unit: 'bouteilles',
        criticalThreshold: 5,
        category: 'Consommables',
      },
    ],
  });

  console.log('Stock items created.');

  // 5. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      code: 'PAT-0001',
      firstName: 'Moussa',
      lastName: 'Traoré',
      dateOfBirth: new Date('1980-05-15'),
      gender: 'M',
      phoneNumber: '+221771234567',
      address: 'Dakar, Plateau',
      mutuelleName: 'IPM Senelec',
      insuranceCoverageShare: 80, // 80% coverage
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      code: 'PAT-0002',
      firstName: 'Fatou',
      lastName: 'Diop',
      dateOfBirth: new Date('1995-10-22'),
      gender: 'F',
      phoneNumber: '+2250707123456',
      address: 'Abidjan, Cocody',
      mutuelleName: null,
      insuranceCoverageShare: 0, // No coverage (100% patient share)
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      code: 'PAT-0003',
      firstName: 'Amadou',
      lastName: 'Diallo',
      dateOfBirth: new Date('2018-03-08'),
      gender: 'M',
      phoneNumber: '+224622112233',
      address: 'Conakry, Kaloum',
      mutuelleName: 'Gras Savoye',
      insuranceCoverageShare: 70, // 70% coverage
    },
  });

  console.log('Patients created.');

  // 6. Create Vitals entries
  // Patient 1 historical vitals
  const vitals1 = await prisma.vitals.create({
    data: {
      patientId: patient1.id,
      nurseId: nurse.id,
      temperature: 38.5,
      bloodPressure: '130/85',
      weight: 78,
      heartRate: 82,
      bloodSugar: 1.1,
      oxygenSaturation: 98,
      comments: 'Patient se plaint de maux de tête et fièvre.',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  });

  const vitals1Today = await prisma.vitals.create({
    data: {
      patientId: patient1.id,
      nurseId: nurse.id,
      temperature: 37.2,
      bloodPressure: '120/80',
      weight: 77.5,
      heartRate: 75,
      bloodSugar: 0.95,
      oxygenSaturation: 99,
      comments: 'Constantes stables pour consultation de suivi.',
    },
  });

  // Patient 2 historical vitals
  const vitals2 = await prisma.vitals.create({
    data: {
      patientId: patient2.id,
      nurseId: nurse.id,
      temperature: 36.8,
      bloodPressure: '110/70',
      weight: 62.0,
      heartRate: 70,
      bloodSugar: 0.85,
      oxygenSaturation: 100,
      comments: 'Visite de routine.',
    },
  });

  console.log('Vitals entries created.');

  // 7. Create Billing & Consultation histories
  // Patient 1 Past Consultation (Completed & Paid)
  const bill1 = await prisma.billing.create({
    data: {
      patientId: patient1.id,
      cashierId: cashier.id,
      amount: 15000,
      status: BillingStatus.PAID,
      paymentMethod: 'CASH',
      mutuelleName: 'IPM Senelec',
      insuranceCoverageShare: 80,
      patientShare: 3000, // 20%
      insuranceShare: 12000, // 80%
      transactionId: 'TX-CASH-8716',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  const consultation1 = await prisma.consultation.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      vitalsId: vitals1.id,
      billingId: bill1.id,
      diagnosis: 'Paludisme simple',
      notes: 'Traitement antipaludéen prescrit. Repos de 3 jours.',
      specialty: 'Général',
      status: ConsultationStatus.COMPLETED,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.prescription.create({
    data: {
      consultationId: consultation1.id,
      uniqueCode: 'RX-2026-0001',
      medicines: [
        { name: 'Coartem 80/480mg', dosage: '1 tab matin et soir pendant 3 jours', duration: '3 jours' },
        { name: 'Paracétamol 1g', dosage: '1 tab toutes les 6 heures si fièvre', duration: '5 jours' },
      ],
      instructions: 'Prendre les comprimés au cours du repas.',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Patient 2 Today's Consultation (Completed & Paid - Cash payment of 15000 FCFA)
  const bill2 = await prisma.billing.create({
    data: {
      patientId: patient2.id,
      cashierId: cashier.id,
      amount: 15000,
      status: BillingStatus.PAID,
      paymentMethod: 'MOBILE_MONEY',
      mutuelleName: null,
      insuranceCoverageShare: 0,
      patientShare: 15000,
      insuranceShare: 0,
      transactionId: 'MOMO-WAVE-89218',
    },
  });

  const consultation2 = await prisma.consultation.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      vitalsId: vitals2.id,
      billingId: bill2.id,
      diagnosis: 'Hypertension légère',
      notes: 'Réduire l\'apport en sel. Exercice régulier. Rendez-vous de suivi dans 1 mois.',
      specialty: 'Général',
      status: ConsultationStatus.COMPLETED,
    },
  });

  await prisma.prescription.create({
    data: {
      consultationId: consultation2.id,
      uniqueCode: 'RX-2026-0002',
      medicines: [
        { name: 'Amlodipine 5mg', dosage: '1 comprimé le matin', duration: '30 jours' },
      ],
      instructions: 'Contrôler la tension régulièrement.',
    },
  });

  // 8. Create Waiting Queue Entries for Active Flow
  // Patient 1 is currently in queue for Consultation (their vitals are taken, bill is paid)
  // We need to create a paid bill for Patient 1's today visit
  const bill1Today = await prisma.billing.create({
    data: {
      patientId: patient1.id,
      cashierId: cashier.id,
      amount: 15000,
      status: BillingStatus.PAID,
      paymentMethod: 'CASH',
      mutuelleName: 'IPM Senelec',
      insuranceCoverageShare: 80,
      patientShare: 3000,
      insuranceShare: 12000,
      transactionId: 'TX-CASH-9912',
    },
  });

  // Today consultation row created in pending status, tied to paid bill
  const consultation1Today = await prisma.consultation.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      vitalsId: vitals1Today.id,
      billingId: bill1Today.id,
      status: ConsultationStatus.PAID,
    },
  });

  await prisma.queueEntry.create({
    data: {
      patientId: patient1.id,
      status: QueueStatus.IN_QUEUE,
      priority: 'NORMAL',
      department: QueueDepartment.CONSULTATION,
      assignedDoctorId: doctor.id,
    },
  });

  // Patient 3 is in queue for Vitals (unpaid, needs vital constants input and payment setup)
  const bill3Unpaid = await prisma.billing.create({
    data: {
      patientId: patient3.id,
      amount: 15000,
      status: BillingStatus.UNPAID,
      patientShare: 4500, // 30% patient share
      insuranceShare: 10500, // 70% insurance coverage
      mutuelleName: 'Gras Savoye',
      insuranceCoverageShare: 70,
    },
  });

  // Today consultation row created, but UNPAID (Doctor CANNOT open it yet)
  await prisma.consultation.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor.id,
      billingId: bill3Unpaid.id,
      status: ConsultationStatus.PENDING,
    },
  });

  await prisma.queueEntry.create({
    data: {
      patientId: patient3.id,
      status: QueueStatus.IN_QUEUE,
      priority: 'URGENT', // Urgent child entry
      department: QueueDepartment.VITALS,
    },
  });

  console.log('Active waiting queues seeded.');
  console.log('MedClinik database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
