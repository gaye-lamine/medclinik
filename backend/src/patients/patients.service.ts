import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        vitals: { orderBy: { createdAt: 'desc' } },
        consultations: {
          include: {
            doctor: { select: { name: true } },
            prescriptions: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        bills: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async search(query: string) {
    return this.prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } },
        ],
      },
      take: 10,
    });
  }

  async create(data: any) {
    // Generate consecutive PAT-XXXX code
    const count = await this.prisma.patient.count();
    const code = `PAT-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.patient.create({
      data: {
        code,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        address: data.address,
        mutuelleName: data.mutuelleName || null,
        insuranceCoverageShare: parseFloat(data.insuranceCoverageShare || 0),
      },
    });
  }
}
