import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StockService } from '../src/stock/stock.service';
import { InventoryException } from '../src/common/exceptions/inventory.exception';

describe('StockService deliverPrescription Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let stockService: StockService;

  let testPatientId: string;
  let testDoctorId: string;
  let testConsultationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    stockService = app.get(StockService);

    const timestamp = Date.now();

    const doctor = await prisma.user.create({
      data: {
        email: `doc-stock-${timestamp}@medclinik.test`,
        password: 'hash',
        name: 'Dr Stock Test',
        role: 'DOCTOR',
      },
    });
    testDoctorId = doctor.id;

    const patient = await prisma.patient.create({
      data: {
        code: `P-STOCK-${timestamp}`,
        firstName: 'Awa',
        lastName: 'Ndiaye',
        dateOfBirth: new Date('1992-03-20'),
        gender: 'F',
        phoneNumber: `+22177${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
    });
    testPatientId = patient.id;

    const consultation = await prisma.consultation.create({
      data: {
        patientId: testPatientId,
        doctorId: testDoctorId,
        status: 'COMPLETED',
        specialty: 'Général',
      },
    });
    testConsultationId = consultation.id;
  });

  afterAll(async () => {
    await prisma.prescription.deleteMany({
      where: { consultationId: testConsultationId },
    });
    await prisma.consultation.delete({ where: { id: testConsultationId } });
    await prisma.patient.delete({ where: { id: testPatientId } });
    await prisma.user.delete({ where: { id: testDoctorId } });
    await app.close();
  });

  it('1. Rejet si rupture de stock (quantité demandée > disponible)', async () => {
    const item = await prisma.stockItem.create({
      data: {
        name: `Paracetamol Low-${Date.now()}`,
        quantity: 2,
        unit: 'boite',
        criticalThreshold: 5,
        category: 'MEDICINE',
      },
    });

    const rx = await prisma.prescription.create({
      data: {
        consultationId: testConsultationId,
        medicines: [{ stockItemId: item.id, name: item.name, quantity: 5 }],
        uniqueCode: `RX-LOW-${Date.now()}`,
        isDelivered: false,
      },
    });

    await expect(stockService.deliverPrescription(rx.id)).rejects.toThrow(InventoryException);

    await prisma.prescription.delete({ where: { id: rx.id } });
    await prisma.stockItem.delete({ where: { id: item.id } });
  });

  it('2. Rejet si l ordonnance a déjà été délivrée', async () => {
    const item = await prisma.stockItem.create({
      data: {
        name: `Amoxicilline-${Date.now()}`,
        quantity: 50,
        unit: 'boite',
        criticalThreshold: 5,
        category: 'MEDICINE',
      },
    });

    const rx = await prisma.prescription.create({
      data: {
        consultationId: testConsultationId,
        medicines: [{ stockItemId: item.id, name: item.name, quantity: 2 }],
        uniqueCode: `RX-DEL-${Date.now()}`,
        isDelivered: true, // Déjà délivrée !
      },
    });

    await expect(stockService.deliverPrescription(rx.id)).rejects.toThrow(InventoryException);

    await prisma.prescription.delete({ where: { id: rx.id } });
    await prisma.stockItem.delete({ where: { id: item.id } });
  });

  it('3. Déduction exacte de la quantité en stock lors d une délivrance réussie', async () => {
    const item = await prisma.stockItem.create({
      data: {
        name: `Ibuprofene-${Date.now()}`,
        quantity: 20,
        unit: 'boite',
        criticalThreshold: 5,
        category: 'MEDICINE',
      },
    });

    const rx = await prisma.prescription.create({
      data: {
        consultationId: testConsultationId,
        medicines: [{ stockItemId: item.id, name: item.name, quantity: 4 }],
        uniqueCode: `RX-OK-${Date.now()}`,
        isDelivered: false,
      },
    });

    await stockService.deliverPrescription(rx.id);

    const updatedItem = await prisma.stockItem.findUnique({ where: { id: item.id } });
    expect(updatedItem?.quantity).toBe(16); // 20 - 4 = 16

    const updatedRx = await prisma.prescription.findUnique({ where: { id: rx.id } });
    expect(updatedRx?.isDelivered).toBe(true);

    await prisma.prescription.delete({ where: { id: rx.id } });
    await prisma.stockItem.delete({ where: { id: item.id } });
  });
});
