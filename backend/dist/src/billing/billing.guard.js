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
exports.BillingGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const clinical_rule_exception_1 = require("../common/exceptions/clinical-rule.exception");
let BillingGuard = class BillingGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const consultationId = request.params.id;
        if (!consultationId) {
            return true;
        }
        const consultation = await this.prisma.consultation.findUnique({
            where: { id: consultationId },
            include: { billing: true },
        });
        if (!consultation) {
            throw new common_1.NotFoundException('Consultation introuvable');
        }
        if (consultation.status === client_1.ConsultationStatus.PENDING) {
            throw new clinical_rule_exception_1.ClinicalRuleException('Cette consultation n\'a pas encore été réglée à la caisse. Accès médical bloqué pour éviter les fuites financières.', 'CLINICAL_UNPAID_CONSULTATION');
        }
        return true;
    }
};
exports.BillingGuard = BillingGuard;
exports.BillingGuard = BillingGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingGuard);
//# sourceMappingURL=billing.guard.js.map