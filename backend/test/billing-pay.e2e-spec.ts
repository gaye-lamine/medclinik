import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ConflictException, BadRequestException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BillingService } from '../src/billing/billing.service';
import { BillingStatus } from '@prisma/client';

describe('BillingService Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let billingService: BillingService;

  let testPatientId: string;
  let testDoctorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    billingService = app.get(BillingService);

    // Seed test doctor & patient
    const doctor = await prisma.user.create({
      data: {
        email: `doc-${Date.now()}@medclinik.test`,
        password: 'hash',
        name: 'Dr Test Billing',
        role: 'DOCTOR',
      },
    });
    testDoctorId = doctor.id;

    const patient = await prisma.patient.create({
      data: {
        code: `P-TEST-${Date.now()}`,
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'M',
        phoneNumber: `+22177${Math.floor(1000000 + Math.random() * 9000000)}`,
        insuranceCoverageShare: 0,
      },
    });
    testPatientId = patient.id;
  });

  afterAll(async () => {
    // Cleanup created test data
    await prisma.consultation.deleteMany({ where: { patientId: testPatientId } });
    await prisma.billing.deleteMany({ where: { patientId: testPatientId } });
    await prisma.patient.delete({ where: { id: testPatientId } });
    await prisma.user.delete({ where: { id: testDoctorId } });
    await app.close();
  });

  it('1. Paiement complet (statut -> PAID)', async () => {
    const bill = await prisma.billing.create({
      data: {
        patientId: testPatientId,
        amount: 10000,
        amountPaid: 0,
        status: BillingStatus.UNPAID,
        patientShare: 10000,
        insuranceShare: 0,
      },
    });

    const res = await billingService.pay(bill.id, null, {
      paymentMethod: 'CASH',
      amountPaid: 10000,
    });

    expect(res.status).toBe(BillingStatus.PAID);
    expect(res.amountPaid).toBe(10000);

    const checkDb = await prisma.billing.findUnique({ where: { id: bill.id } });
    expect(checkDb?.status).toBe(BillingStatus.PAID);
    expect(checkDb?.amountPaid).toBe(10000);
  });

  it('2. Paiement partiel (statut -> PARTIALLY_PAID, montant cumulé exact)', async () => {
    const bill = await prisma.billing.create({
      data: {
        patientId: testPatientId,
        amount: 10000,
        amountPaid: 0,
        status: BillingStatus.UNPAID,
        patientShare: 10000,
        insuranceShare: 0,
      },
    });

    // Premier paiement partiel de 4000
    const res1 = await billingService.pay(bill.id, null, {
      paymentMethod: 'CASH',
      amountPaid: 4000,
    });
    expect(res1.status).toBe(BillingStatus.PARTIALLY_PAID);
    expect(res1.amountPaid).toBe(4000);

    // Second paiement partiel de 3000 -> total 7000
    const res2 = await billingService.pay(bill.id, null, {
      paymentMethod: 'CASH',
      amountPaid: 3000,
    });
    expect(res2.status).toBe(BillingStatus.PARTIALLY_PAID);
    expect(res2.amountPaid).toBe(7000);
  });

  it('3. Rejet si facture déjà PAID (409 ConflictException)', async () => {
    const bill = await prisma.billing.create({
      data: {
        patientId: testPatientId,
        amount: 5000,
        amountPaid: 5000,
        status: BillingStatus.PAID,
        patientShare: 5000,
        insuranceShare: 0,
      },
    });

    await expect(
      billingService.pay(bill.id, null, {
        paymentMethod: 'CASH',
        amountPaid: 1000,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('4. Rejet si statut CANCELLED ou REFUNDED (400 BadRequestException)', async () => {
    const cancelledBill = await prisma.billing.create({
      data: {
        patientId: testPatientId,
        amount: 5000,
        amountPaid: 0,
        status: BillingStatus.CANCELLED,
        patientShare: 5000,
        insuranceShare: 0,
      },
    });

    await expect(
      billingService.pay(cancelledBill.id, null, {
        paymentMethod: 'CASH',
        amountPaid: 5000,
      }),
    ).rejects.toThrow(BadRequestException);

    const refundedBill = await prisma.billing.create({
      data: {
        patientId: testPatientId,
        amount: 5000,
        amountPaid: 5000,
        status: BillingStatus.REFUNDED,
        patientShare: 5000,
        insuranceShare: 0,
      },
    });

    await expect(
      billingService.pay(refundedBill.id, null, {
        paymentMethod: 'CASH',
        amountPaid: 5000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('5. Sécurité de paiement concurrent (incrément atomique sans perte d argent)', async () => {
    const bill = await prisma.billing.create({
      data: {
        patientId: testPatientId,
        amount: 10000,
        amountPaid: 0,
        status: BillingStatus.UNPAID,
        patientShare: 10000,
        insuranceShare: 0,
      },
    });

    // Lancement de 2 paiements simultanés de 5000 FCFA chacun
    await Promise.all([
      billingService.pay(bill.id, null, { paymentMethod: 'CASH', amountPaid: 5000 }),
      billingService.pay(bill.id, null, { paymentMethod: 'WAVE', amountPaid: 5000 }),
    ]);

    const checkDb = await prisma.billing.findUnique({ where: { id: bill.id } });
    expect(checkDb?.amountPaid).toBe(10000);
    expect(checkDb?.status).toBe(BillingStatus.PAID);
  });
});
