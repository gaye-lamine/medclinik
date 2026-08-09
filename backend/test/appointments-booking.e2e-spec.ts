import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppointmentsService } from '../src/appointments/appointments.service';

describe('Anti-Double-Booking Appointments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let appointmentsService: AppointmentsService;

  let testPatientId: string;
  let testDoctorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    appointmentsService = app.get(AppointmentsService);

    const timestamp = Date.now();

    const doctor = await prisma.user.create({
      data: {
        email: `doc-booking-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Dr Booking Test',
        role: 'DOCTOR',
      },
    });
    testDoctorId = doctor.id;

    const patient = await prisma.patient.create({
      data: {
        code: `P-BOOK-${timestamp}`,
        firstName: 'Paul',
        lastName: 'Moreau',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'M',
        phoneNumber: `+22177${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
    });
    testPatientId = patient.id;
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({ where: { doctorId: testDoctorId } });
    await prisma.patient.delete({ where: { id: testPatientId } });
    await prisma.user.delete({ where: { id: testDoctorId } });
    await app.close();
  });

  it('1. Création d un 1er rendez-vous -> succès', async () => {
    const baseTime = new Date('2026-09-01T10:00:00.000Z');

    const appt1 = await appointmentsService.create({
      patientId: testPatientId,
      doctorId: testDoctorId,
      dateTime: baseTime.toISOString(),
      specialty: 'Cardiologie',
    });

    expect(appt1).toBeDefined();
    expect(appt1.status).toBe('SCHEDULED');
  });

  it('2. Tentative de création d un 2e RDV chevauchant (+15 min) pour le même médecin -> 409 ConflictException', async () => {
    const overlappingTime = new Date('2026-09-01T10:15:00.000Z');

    await expect(
      appointmentsService.create({
        patientId: testPatientId,
        doctorId: testDoctorId,
        dateTime: overlappingTime.toISOString(),
        specialty: 'Cardiologie',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('3. Création d un RDV non-chevauchant (+60 min) -> succès', async () => {
    const nonOverlappingTime = new Date('2026-09-01T11:00:00.000Z');

    const appt2 = await appointmentsService.create({
      patientId: testPatientId,
      doctorId: testDoctorId,
      dateTime: nonOverlappingTime.toISOString(),
      specialty: 'Cardiologie',
    });

    expect(appt2).toBeDefined();
    expect(appt2.status).toBe('SCHEDULED');
  });
});
