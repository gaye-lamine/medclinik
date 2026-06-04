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
exports.VitalsController = void 0;
const common_1 = require("@nestjs/common");
const vitals_service_1 = require("./vitals.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const create_vitals_dto_1 = require("./dto/create-vitals.dto");
const swagger_1 = require("@nestjs/swagger");
let VitalsController = class VitalsController {
    vitalsService;
    constructor(vitalsService) {
        this.vitalsService = vitalsService;
    }
    async create(body, req) {
        const nurseId = req.user.sub;
        return this.vitalsService.create(nurseId, body);
    }
    async getPatientHistory(patientId) {
        return this.vitalsService.getPatientHistory(patientId);
    }
};
exports.VitalsController = VitalsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.Role.NURSE, client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer les constantes vitales d\'un patient' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Constantes enregistrées avec succès et patient mis en file d\'attente médecin' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vitals_dto_1.CreateVitalsDto, Object]),
    __metadata("design:returntype", Promise)
], VitalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer l\'historique des constantes vitales d\'un patient' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Historique récupéré' }),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VitalsController.prototype, "getPatientHistory", null);
exports.VitalsController = VitalsController = __decorate([
    (0, swagger_1.ApiTags)('Vitals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('vitals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [vitals_service_1.VitalsService])
], VitalsController);
//# sourceMappingURL=vitals.controller.js.map