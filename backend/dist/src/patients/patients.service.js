"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PatientsService = class PatientsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.patient.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
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
    async search(query) {
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
    async create(data) {
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
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map