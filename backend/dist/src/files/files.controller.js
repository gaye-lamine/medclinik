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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let FilesController = class FilesController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadFile(patientId, file, consultationId, customName) {
        if (!file) {
            throw new common_1.BadRequestException('Aucun fichier fourni.');
        }
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.BadRequestException('Patient introuvable.');
        }
        const extension = (0, path_1.extname)(file.originalname).toLowerCase();
        let type = 'AUTRE';
        if (extension === '.dcm') {
            type = 'DICOM';
        }
        else if (['.jpg', '.jpeg', '.png'].includes(extension)) {
            type = 'JPEG';
        }
        else if (extension === '.pdf') {
            type = 'PDF';
        }
        const fileUrl = `/uploads/${file.filename}`;
        const newFile = await this.prisma.patientFile.create({
            data: {
                patientId,
                consultationId: consultationId || null,
                name: customName || file.originalname,
                url: fileUrl,
                type,
                size: file.size,
            },
        });
        return newFile;
    }
    async getFiles(patientId) {
        return this.prisma.patientFile.findMany({
            where: { patientId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('patient/:patientId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        limits: { fileSize: 20 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('consultationId')),
    __param(3, (0, common_1.Body)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getFiles", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FilesController);
//# sourceMappingURL=files.controller.js.map