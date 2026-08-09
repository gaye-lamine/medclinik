import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BillingStatus, Role } from '@prisma/client';

describe('BillingService Integration Tests (e2e HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let cashierToken: string;
  let cashierUser: any;
  let testPatientId: string;
  let testDoctorId: string;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    const timestamp = Date.now();

    // Create cashier user and JWT token with 2FA complete
    cashierUser = await prisma.user.create({
      data: {
        email: `cashier-pay-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Caissier Pay Test',
        role: Role.CASHIER,
      },
    });

    cashierToken = jwtService.sign({
      sub: cashierUser.id,
      email: cashierUser.email,
      role: cashierUser.role,
      is2faComplete: true,
    });

    // Seed test doctor & patient
    const doctor = await prisma.user.create({
      data: {
        email: `doc-pay-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Dr Test Billing',
        role: Role.DOCTOR,
      },
    });
    testDoctorId = doctor.id;

    const patient = await prisma.patient.create({
      data: {
        code: `P-TEST-PAY-${timestamp}`,
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
    await prisma.user.deleteMany({ where: { id: { in: [testDoctorId, cashierUser.id] } } });
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

    const res = await request(app.getHttpServer())
      .post(`/billing/pay/${bill.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMethod: 'CASH',
        amountPaid: 10000,
      })
      .expect(201); // NestJS @Post returns 201 Created by default

    expect(res.body.status).toBe(BillingStatus.PAID);
    expect(res.body.amountPaid).toBe(10000);

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

    // Premier paiement partiel HTTP de 4000
    const res1 = await request(app.getHttpServer())
      .post(`/billing/pay/${bill.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMethod: 'CASH',
        amountPaid: 4000,
      })
      .expect(201);

    expect(res1.body.status).toBe(BillingStatus.PARTIALLY_PAID);
    expect(res1.body.amountPaid).toBe(4000);

    // Second paiement partiel HTTP de 3000 -> total 7000
    const res2 = await request(app.getHttpServer())
      .post(`/billing/pay/${bill.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMethod: 'CASH',
        amountPaid: 3000,
      })
      .expect(201);

    expect(res2.body.status).toBe(BillingStatus.PARTIALLY_PAID);
    expect(res2.body.amountPaid).toBe(7000);
  });

  it('3. Rejet si facture déjà PAID (409 Conflict)', async () => {
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

    await request(app.getHttpServer())
      .post(`/billing/pay/${bill.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMethod: 'CASH',
        amountPaid: 1000,
      })
      .expect(409);
  });

  it('4. Rejet si statut CANCELLED ou REFUNDED (400 BadRequest)', async () => {
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

    await request(app.getHttpServer())
      .post(`/billing/pay/${cancelledBill.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMethod: 'CASH',
        amountPaid: 5000,
      })
      .expect(400);

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

    await request(app.getHttpServer())
      .post(`/billing/pay/${refundedBill.id}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        paymentMethod: 'CASH',
        amountPaid: 5000,
      })
      .expect(400);
  });

  it('5. Sécurité de concurrence (Promise.all de 2 vraies requêtes HTTP supertest en parallèle)', async () => {
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

    // Lancement de 2 VRAIES requêtes HTTP supertest en parallèle via Promise.all
    await Promise.all([
      request(app.getHttpServer())
        .post(`/billing/pay/${bill.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ paymentMethod: 'CASH', amountPaid: 5000 }),
      request(app.getHttpServer())
        .post(`/billing/pay/${bill.id}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ paymentMethod: 'WAVE', amountPaid: 5000 }),
    ]);

    const checkDb = await prisma.billing.findUnique({ where: { id: bill.id } });
    expect(checkDb?.amountPaid).toBe(10000);
    expect(checkDb?.status).toBe(BillingStatus.PAID);
  }, 30000);
});
