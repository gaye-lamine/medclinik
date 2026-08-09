import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PatientsService } from '../src/patients/patients.service';

describe('Patients Privacy & Medical Secrecy Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let patientsService: PatientsService;

  let testPatientId: string;
  let testDoctorId: string;
  let testNurseId: string;
  let testConsultationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    patientsService = app.get(PatientsService);

    const timestamp = Date.now();

    const doctor = await prisma.user.create({
      data: {
        email: `doc-privacy-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Dr Secrecy Test',
        role: 'DOCTOR',
      },
    });
    testDoctorId = doctor.id;

    const nurse = await prisma.user.create({
      data: {
        email: `nurse-privacy-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Infirmière Test',
        role: 'NURSE',
      },
    });
    testNurseId = nurse.id;

    const patient = await prisma.patient.create({
      data: {
        code: `P-PRIV-${timestamp}`,
        firstName: 'Secret',
        lastName: 'Patient',
        dateOfBirth: new Date('1995-12-10'),
        gender: 'F',
        phoneNumber: `+22177${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
    });
    testPatientId = patient.id;

    await prisma.vitals.create({
      data: {
        patientId: testPatientId,
        nurseId: testNurseId,
        weight: 65,
        bloodPressure: '120/80',
        temperature: 36.6,
      },
    });

    const consultation = await prisma.consultation.create({
      data: {
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'COMPLETED',
        specialty: 'Général',
        diagnosis: 'Diagnostic confidentiel',
        notes: 'Notes médicales secrètes',
      },
    });
    testConsultationId = consultation.id;
  });

  afterAll(async () => {
    await prisma.vitals.deleteMany({ where: { patientId: testPatientId } });
    await prisma.consultation.deleteMany({ where: { patientId: testPatientId } });
    await prisma.patient.delete({ where: { id: testPatientId } });
    await prisma.user.deleteMany({ where: { id: { in: [testDoctorId, testNurseId] } } });
    await app.close();
  });

  it('1. CASHIER : findOne() ne retourne NI vitals NI consultations (secret médical)', async () => {
    const resCashier: any = await patientsService.findOne(testPatientId, 'CASHIER');

    expect(resCashier).toBeDefined();
    expect(resCashier.id).toBe(testPatientId);
    expect(resCashier.vitals).toBeUndefined();
    expect(resCashier.consultations).toBeUndefined();
    expect(resCashier.bills).toBeDefined();
  });

  it('2. DOCTOR : findOne() retourne les constantes vitals et consultations médicales', async () => {
    const resDoctor: any = await patientsService.findOne(testPatientId, 'DOCTOR');

    expect(resDoctor).toBeDefined();
    expect(resDoctor.vitals).toBeDefined();
    expect(resDoctor.vitals.length).toBeGreaterThan(0);
    expect(resDoctor.consultations).toBeDefined();
    expect(resDoctor.consultations[0].diagnosis).toBe('Diagnostic confidentiel');
  });
});
