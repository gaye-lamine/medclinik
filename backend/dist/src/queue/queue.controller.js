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
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("./queue.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const register_queue_dto_1 = require("./dto/register-queue.dto");
const swagger_1 = require("@nestjs/swagger");
let QueueController = class QueueController {
    queueService;
    constructor(queueService) {
        this.queueService = queueService;
    }
    async getQueue() {
        return this.queueService.getQueue();
    }
    async register(body) {
        return this.queueService.register(body);
    }
    async call(id, req) {
        const doctorId = req.user.role === 'DOCTOR' ? req.user.sub : undefined;
        return this.queueService.call(id, doctorId);
    }
    async start(id) {
        return this.queueService.start(id);
    }
    async finish(id) {
        return this.queueService.finish(id);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer la file d\'attente active' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File d\'attente récupérée' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Enregistrer un patient dans la file d\'attente' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Enregistrement réussi' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Données invalides' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_queue_dto_1.RegisterQueueDto]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('call/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Appeler un patient par son numéro de file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Patient appelé et notifié par SMS' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entrée introuvable' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "call", null);
__decorate([
    (0, common_1.Post)('start/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Démarrer la consultation/constantes pour le patient' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statut mis à jour' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('finish/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retirer un patient de la file d\'attente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retrait réussi' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QueueController.prototype, "finish", null);
exports.QueueController = QueueController = __decorate([
    (0, swagger_1.ApiTags)('Queue'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('queue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map