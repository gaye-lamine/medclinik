"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
require("dotenv/config");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Seeding MedClinik database...');
    await prisma.queueEntry.deleteMany({});
    await prisma.prescription.deleteMany({});
    await prisma.consultation.deleteMany({});
    await prisma.vitals.deleteMany({});
    await prisma.billing.deleteMany({});
    await prisma.patient.deleteMany({});
    await prisma.stockItem.deleteMany({});
    await prisma.user.deleteMany({});
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const doctorPassword = await bcrypt.hash('doctor123', saltRounds);
    const nursePassword = await bcrypt.hash('nurse123', saltRounds);
    const cashierPassword = await bcrypt.hash('cashier123', saltRounds);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@medclinik.com',
            password: adminPassword,
            name: 'Admin MedClinik',
            role: client_1.Role.ADMIN,
            phone: '+221770000001',
        },
    });
    const doctor = await prisma.user.create({
        data: {
            email: 'doctor@medclinik.com',
            password: doctorPassword,
            name: 'Dr. Jean-Marc Koffi',
            role: client_1.Role.DOCTOR,
            phone: '+225070000002',
        },
    });
    const nurse = await prisma.user.create({
        data: {
            email: 'nurse@medclinik.com',
            password: nursePassword,
            name: 'Inf. Assiatou Diallo',
            role: client_1.Role.NURSE,
            phone: '+224620000003',
        },
    });
    const cashier = await prisma.user.create({
        data: {
            email: 'cashier@medclinik.com',
            password: cashierPassword,
            name: 'Cais. Olivier Mensah',
            role: client_1.Role.CASHIER,
            phone: '+228900000004',
        },
    });
    console.log('Users created successfully.');
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
                quantity: 15,
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
                quantity: 8,
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
            insuranceCoverageShare: 80,
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
            insuranceCoverageShare: 0,
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
            insuranceCoverageShare: 70,
        },
    });
    console.log('Patients created.');
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
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
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
    const bill1 = await prisma.billing.create({
        data: {
            patientId: patient1.id,
            cashierId: cashier.id,
            amount: 15000,
            status: client_1.BillingStatus.PAID,
            paymentMethod: 'CASH',
            mutuelleName: 'IPM Senelec',
            insuranceCoverageShare: 80,
            patientShare: 3000,
            insuranceShare: 12000,
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
            status: client_1.ConsultationStatus.COMPLETED,
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
    const bill2 = await prisma.billing.create({
        data: {
            patientId: patient2.id,
            cashierId: cashier.id,
            amount: 15000,
            status: client_1.BillingStatus.PAID,
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
            status: client_1.ConsultationStatus.COMPLETED,
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
    const bill1Today = await prisma.billing.create({
        data: {
            patientId: patient1.id,
            cashierId: cashier.id,
            amount: 15000,
            status: client_1.BillingStatus.PAID,
            paymentMethod: 'CASH',
            mutuelleName: 'IPM Senelec',
            insuranceCoverageShare: 80,
            patientShare: 3000,
            insuranceShare: 12000,
            transactionId: 'TX-CASH-9912',
        },
    });
    const consultation1Today = await prisma.consultation.create({
        data: {
            patientId: patient1.id,
            doctorId: doctor.id,
            vitalsId: vitals1Today.id,
            billingId: bill1Today.id,
            status: client_1.ConsultationStatus.PAID,
        },
    });
    await prisma.queueEntry.create({
        data: {
            patientId: patient1.id,
            status: client_1.QueueStatus.IN_QUEUE,
            priority: 'NORMAL',
            department: client_1.QueueDepartment.CONSULTATION,
            assignedDoctorId: doctor.id,
        },
    });
    const bill3Unpaid = await prisma.billing.create({
        data: {
            patientId: patient3.id,
            amount: 15000,
            status: client_1.BillingStatus.UNPAID,
            patientShare: 4500,
            insuranceShare: 10500,
            mutuelleName: 'Gras Savoye',
            insuranceCoverageShare: 70,
        },
    });
    await prisma.consultation.create({
        data: {
            patientId: patient3.id,
            doctorId: doctor.id,
            billingId: bill3Unpaid.id,
            status: client_1.ConsultationStatus.PENDING,
        },
    });
    await prisma.queueEntry.create({
        data: {
            patientId: patient3.id,
            status: client_1.QueueStatus.IN_QUEUE,
            priority: 'URGENT',
            department: client_1.QueueDepartment.VITALS,
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
//# sourceMappingURL=seed.js.map