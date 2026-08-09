import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('RBAC Authorization Guards (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let cashierToken: string;
  let nurseToken: string;
  let doctorToken: string;

  let cashierUser: any;
  let nurseUser: any;
  let doctorUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Create test users for each role
    const timestamp = Date.now();

    cashierUser = await prisma.user.create({
      data: {
        email: `cashier-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Test Cashier',
        role: Role.CASHIER,
      },
    });

    nurseUser = await prisma.user.create({
      data: {
        email: `nurse-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Test Nurse',
        role: Role.NURSE,
      },
    });

    doctorUser = await prisma.user.create({
      data: {
        email: `doctor-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Test Doctor',
        role: Role.DOCTOR,
      },
    });

    cashierToken = jwtService.sign({
      sub: cashierUser.id,
      email: cashierUser.email,
      role: cashierUser.role,
      is2faComplete: true,
    });

    nurseToken = jwtService.sign({
      sub: nurseUser.id,
      email: nurseUser.email,
      role: nurseUser.role,
      is2faComplete: true,
    });

    doctorToken = jwtService.sign({
      sub: doctorUser.id,
      email: doctorUser.email,
      role: doctorUser.role,
      is2faComplete: true,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [cashierUser.id, nurseUser.id, doctorUser.id] },
      },
    });
    await app.close();
  });

  it('1. CASHIER tentant GET /api/consultations -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get('/consultations')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403);
  });

  it('2. NURSE tentant POST /api/stock (création d un article en stock) -> 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .post('/stock')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        name: 'Test Paracetamol',
        quantity: 100,
        unit: 'boite',
        criticalThreshold: 10,
        category: 'MEDICINE',
      })
      .expect(403);
  });

  it('3. Non-ADMIN (CASHIER / DOCTOR) tentant POST /api/billing/refund/:id -> 403 Forbidden', async () => {
    const fakeBillId = '00000000-0000-0000-0000-000000000000';

    await request(app.getHttpServer())
      .post(`/billing/refund/${fakeBillId}`)
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ reason: 'Tentative non autorisée' })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/billing/refund/${fakeBillId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ reason: 'Tentative non autorisée' })
      .expect(403);
  });
});
