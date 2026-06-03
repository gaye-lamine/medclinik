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
exports.ConsultationsController = void 0;
const common_1 = require("@nestjs/common");
const consultations_service_1 = require("./consultations.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const billing_guard_1 = require("../billing/billing.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let ConsultationsController = class ConsultationsController {
    consultationsService;
    constructor(consultationsService) {
        this.consultationsService = consultationsService;
    }
    async findAll() {
        return this.consultationsService.findAll();
    }
    async findOne(id) {
        return this.consultationsService.findOne(id);
    }
    async start(id) {
        return this.consultationsService.start(id);
    }
    async complete(id, body) {
        return this.consultationsService.complete(id, body);
    }
    async createPrescription(id, body) {
        return this.consultationsService.createPrescription(id, body);
    }
};
exports.ConsultationsController = ConsultationsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConsultationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(billing_guard_1.BillingGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConsultationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('start/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.DOCTOR, client_1.Role.ADMIN),
    (0, common_1.UseGuards)(billing_guard_1.BillingGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConsultationsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('complete/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.DOCTOR, client_1.Role.ADMIN),
    (0, common_1.UseGuards)(billing_guard_1.BillingGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsultationsController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('prescription/:id'),
    (0, roles_decorator_1.Roles)(client_1.Role.DOCTOR, client_1.Role.ADMIN),
    (0, common_1.UseGuards)(billing_guard_1.BillingGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsultationsController.prototype, "createPrescription", null);
exports.ConsultationsController = ConsultationsController = __decorate([
    (0, common_1.Controller)('consultations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [consultations_service_1.ConsultationsService])
], ConsultationsController);
//# sourceMappingURL=consultations.controller.js.map